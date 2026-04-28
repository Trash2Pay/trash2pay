import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWallet } from "@/contexts/WalletContext";

export type PickupStatus = "pending" | "accepted" | "in_progress" | "completed" | "cancelled";

export type WasteType = "recyclable" | "organic" | "general" | "electronic" | "hazardous";

export interface PickupRow {
  id: string;
  user_id: string;
  collector_id: string | null;
  waste_type: WasteType;
  weight_kg: number | null;
  address: string;
  notes: string | null;
  status: PickupStatus;
  reward_tokens: number | null;
  scheduled_date: string | null;
  created_at: string;
  completed_at: string | null;
  user_name?: string;
  user_phone?: string;
}

const formatWasteLabel = (t: string) => {
  switch (t) {
    case "recyclable": return "Recyclables";
    case "organic": return "Organic";
    case "electronic": return "E-Waste";
    case "hazardous": return "Hazardous";
    case "general": return "General Waste";
    default: return t;
  }
};

async function attachProfiles(rows: PickupRow[]): Promise<PickupRow[]> {
  const userIds = Array.from(new Set(rows.map(r => r.user_id)));
  if (userIds.length === 0) return rows;
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, phone")
    .in("id", userIds);
  const map = new Map((profiles || []).map(p => [p.id, p]));
  return rows.map(r => ({
    ...r,
    user_name: map.get(r.user_id)?.full_name || "Anonymous User",
    user_phone: map.get(r.user_id)?.phone || "",
  }));
}

/** Pickups owned by the current user (Dashboard view). */
export function useMyPickups() {
  const { walletProfile } = useWallet();
  const [pickups, setPickups] = useState<PickupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPickups = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setPickups([]);
      setLoading(false);
      return;
    }
    const { data, error } = await supabase
      .from("pickups")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error("fetch pickups", error);
      setPickups([]);
    } else {
      setPickups((data || []) as PickupRow[]);
    }
    setLoading(false);
  }, [walletProfile?.handle]);

  useEffect(() => {
    fetchPickups();
    const channel = supabase
      .channel("my-pickups")
      .on("postgres_changes", { event: "*", schema: "public", table: "pickups" }, () => fetchPickups())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchPickups]);

  const createPickup = async (input: {
    address: string;
    waste_type: WasteType;
    notes?: string;
    scheduled_date?: string;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { data, error } = await supabase
      .from("pickups")
      .insert([{
        user_id: user.id,
        address: input.address,
        waste_type: input.waste_type,
        notes: input.notes || null,
        scheduled_date: input.scheduled_date || null,
        status: "pending" as const,
      }])
      .select()
      .single();
    if (error) throw error;
    await fetchPickups();
    return data;
  };

  return { pickups, loading, refetch: fetchPickups, createPickup, formatWasteLabel };
}

/** Pickups visible to a collector: pending (available) + assigned/completed by them. */
export function useCollectorPickups() {
  const [available, setAvailable] = useState<PickupRow[]>([]);
  const [assigned, setAssigned] = useState<PickupRow[]>([]);
  const [completed, setCompleted] = useState<PickupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setAvailable([]); setAssigned([]); setCompleted([]);
      setLoading(false);
      return;
    }

    const [pendingRes, assignedRes, completedRes] = await Promise.all([
      supabase.from("pickups").select("*").eq("status", "pending").order("created_at", { ascending: false }),
      supabase.from("pickups").select("*").eq("collector_id", user.id).in("status", ["accepted", "in_progress"]).order("created_at", { ascending: false }),
      supabase.from("pickups").select("*").eq("collector_id", user.id).eq("status", "completed").order("completed_at", { ascending: false }).limit(10),
    ]);

    setAvailable(await attachProfiles((pendingRes.data || []) as PickupRow[]));
    setAssigned(await attachProfiles((assignedRes.data || []) as PickupRow[]));
    setCompleted(await attachProfiles((completedRes.data || []) as PickupRow[]));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("collector-pickups")
      .on("postgres_changes", { event: "*", schema: "public", table: "pickups" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const acceptPickup = async (pickupId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");
    const { error } = await supabase
      .from("pickups")
      .update({ collector_id: user.id, status: "accepted" })
      .eq("id", pickupId)
      .eq("status", "pending");
    if (error) throw error;
    await fetchAll();
  };

  const completePickup = async (pickupId: string, reward_tokens?: number) => {
    const { error } = await supabase
      .from("pickups")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
        ...(reward_tokens !== undefined ? { reward_tokens } : {}),
      })
      .eq("id", pickupId);
    if (error) throw error;
    await fetchAll();
  };

  return { available, assigned, completed, loading, refetch: fetchAll, acceptPickup, completePickup, formatWasteLabel };
}
