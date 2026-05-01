import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json();
    const { action, walletHandle } = body || {};

    if (!action || !walletHandle) {
      return json({ error: "Missing action or walletHandle" }, 400);
    }

    // Resolve profile by wallet_handle
    const { data: profile, error: profileErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_handle", walletHandle)
      .maybeSingle();

    if (profileErr) throw profileErr;
    if (!profile) return json({ error: "Profile not found for wallet" }, 404);
    const profileId = profile.id;

    // Helper: attach profile info to pickup rows
    const attachProfiles = async (rows: any[]) => {
      const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
      if (!userIds.length) return rows;
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, phone, nin")
        .in("id", userIds);
      const map = new Map((profiles || []).map((p) => [p.id, p]));
      return rows.map((r) => ({
        ...r,
        user_name: map.get(r.user_id)?.full_name || "Anonymous User",
        user_phone: map.get(r.user_id)?.phone || "",
        user_nin: map.get(r.user_id)?.nin || "",
      }));
    };

    switch (action) {
      case "list_my": {
        const { data, error } = await supabase
          .from("pickups")
          .select("*")
          .eq("user_id", profileId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        return json({ pickups: data || [] });
      }

      case "create": {
        const { address, waste_type, notes, scheduled_date, full_name, phone, nin } = body;
        if (!address || !waste_type) return json({ error: "address and waste_type are required" }, 400);
        if (!full_name || !phone) return json({ error: "Name and phone are required" }, 400);

        // Update profile with the latest contact info supplied with this request
        const profileUpdate: Record<string, any> = {
          full_name,
          phone,
          address,
        };
        if (nin) profileUpdate.nin = nin;
        const { error: updErr } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", profileId);
        if (updErr) console.warn("profile update warn:", updErr.message);

        const { data, error } = await supabase
          .from("pickups")
          .insert([{
            user_id: profileId,
            address,
            waste_type,
            notes: notes || null,
            scheduled_date: scheduled_date || null,
            status: "pending",
          }])
          .select()
          .single();
        if (error) throw error;
        return json({ pickup: data });
      }


      case "list_collector": {
        const [pendingRes, assignedRes, completedRes] = await Promise.all([
          supabase.from("pickups").select("*").eq("status", "pending").order("created_at", { ascending: false }),
          supabase.from("pickups").select("*").eq("collector_id", profileId).in("status", ["accepted", "in_progress"]).order("created_at", { ascending: false }),
          supabase.from("pickups").select("*").eq("collector_id", profileId).eq("status", "completed").order("completed_at", { ascending: false }).limit(10),
        ]);
        if (pendingRes.error) throw pendingRes.error;
        if (assignedRes.error) throw assignedRes.error;
        if (completedRes.error) throw completedRes.error;
        return json({
          available: await attachProfiles(pendingRes.data || []),
          assigned: await attachProfiles(assignedRes.data || []),
          completed: await attachProfiles(completedRes.data || []),
        });
      }

      case "accept": {
        const { pickupId } = body;
        if (!pickupId) return json({ error: "pickupId required" }, 400);
        const { error } = await supabase
          .from("pickups")
          .update({ collector_id: profileId, status: "accepted" })
          .eq("id", pickupId)
          .eq("status", "pending");
        if (error) throw error;
        return json({ success: true });
      }

      case "complete": {
        const { pickupId, reward_tokens } = body;
        if (!pickupId) return json({ error: "pickupId required" }, 400);
        const { error } = await supabase
          .from("pickups")
          .update({
            status: "completed",
            completed_at: new Date().toISOString(),
            ...(reward_tokens !== undefined ? { reward_tokens } : {}),
          })
          .eq("id", pickupId)
          .eq("collector_id", profileId);
        if (error) throw error;
        return json({ success: true });
      }

      default:
        return json({ error: `Unknown action: ${action}` }, 400);
    }
  } catch (err: any) {
    console.error("pickups-api error:", err);
    return json({ error: err.message || "Internal error" }, 500);
  }
});
