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

async function callApi(action: string, walletHandle: string, extra: Record<string, any> = {}) {
  const { data, error } = await supabase.functions.invoke("pickups-api", {
    body: { action, walletHandle, ...extra },
  });
  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/** Pickups owned by the current wallet user (Dashboard view). */
export function useMyPickups() {
  const { walletProfile } = useWallet();
  const walletHandle = walletProfile?.handle;
  const [pickups, setPickups] = useState<PickupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPickups = useCallback(async () => {
    if (!walletHandle) {
      setPickups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await callApi("list_my", walletHandle);
      setPickups((data?.pickups || []) as PickupRow[]);
    } catch (e) {
      console.error("fetch pickups", e);
      setPickups([]);
    } finally {
      setLoading(false);
    }
  }, [walletHandle]);

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
    if (!walletHandle) throw new Error("Wallet not connected");
    const data = await callApi("create", walletHandle, input);
    await fetchPickups();
    return data?.pickup;
  };

  return { pickups, loading, refetch: fetchPickups, createPickup, formatWasteLabel };
}

/** Pickups visible to a collector: pending (available) + assigned/completed by them. */
export function useCollectorPickups() {
  const { walletProfile } = useWallet();
  const walletHandle = walletProfile?.handle;
  const [available, setAvailable] = useState<PickupRow[]>([]);
  const [assigned, setAssigned] = useState<PickupRow[]>([]);
  const [completed, setCompleted] = useState<PickupRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!walletHandle) {
      setAvailable([]); setAssigned([]); setCompleted([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await callApi("list_collector", walletHandle);
      setAvailable((data?.available || []) as PickupRow[]);
      setAssigned((data?.assigned || []) as PickupRow[]);
      setCompleted((data?.completed || []) as PickupRow[]);
    } catch (e) {
      console.error("fetch collector pickups", e);
    } finally {
      setLoading(false);
    }
  }, [walletHandle]);

  useEffect(() => {
    fetchAll();
    const channel = supabase
      .channel("collector-pickups")
      .on("postgres_changes", { event: "*", schema: "public", table: "pickups" }, () => fetchAll())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchAll]);

  const acceptPickup = async (pickupId: string) => {
    if (!walletHandle) throw new Error("Wallet not connected");
    await callApi("accept", walletHandle, { pickupId });
    await fetchAll();
  };

  const completePickup = async (pickupId: string, reward_tokens?: number) => {
    if (!walletHandle) throw new Error("Wallet not connected");
    await callApi("complete", walletHandle, { pickupId, reward_tokens });
    await fetchAll();
  };

  return { available, assigned, completed, loading, refetch: fetchAll, acceptPickup, completePickup, formatWasteLabel };
}
