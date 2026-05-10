import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });

interface ProfileRow {
  id: string;
  full_name?: string | null;
  phone?: string | null;
  nin?: string | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    const serviceKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceKey) {
      return json(
        { error: "Missing Supabase environment variables" },
        500
      );
    }

    const supabase = createClient(
      supabaseUrl,
      serviceKey
    );

    let body: any = {};

    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }

    const { action, walletHandle } = body;

    if (!action || !walletHandle) {
      return json(
        { error: "Missing action or walletHandle" },
        400
      );
    }

    /**
     * Resolve profile
     */
    const {
      data: profile,
      error: profileErr,
    } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_handle", walletHandle)
      .maybeSingle();

    if (profileErr) {
      console.error("profile lookup error:", profileErr);
      throw profileErr;
    }

    if (!profile) {
      return json(
        { error: "Profile not found for wallet" },
        404
      );
    }

    const profileId = profile.id;

    /**
     * Attach profile metadata to pickup rows
     */
    const attachProfiles = async (rows: any[]) => {
      if (!rows?.length) return rows;

      const userIds = [
        ...new Set(
          rows
            .map((r) => r.user_id)
            .filter(Boolean)
        ),
      ];

      if (!userIds.length) return rows;

      const {
        data: profiles,
        error: profilesErr,
      } = await supabase
        .from("profiles")
        .select("id, full_name, phone, nin")
        .in("id", userIds);

      if (profilesErr) {
        console.error(
          "attachProfiles error:",
          profilesErr
        );

        return rows;
      }

      const map = new Map<string, ProfileRow>(
        (profiles || []).map((p: any) => [
          p.id,
          p as ProfileRow,
        ])
      );

      return rows.map((r) => {
        const userProfile = map.get(r.user_id);

        return {
          ...r,
          user_name:
            userProfile?.full_name ||
            "Anonymous User",

          user_phone:
            userProfile?.phone || "",

          user_nin:
            userProfile?.nin || "",
        };
      });
    };

    switch (action) {
      /**
       * LIST MY PICKUPS
       */
      case "list_my": {
        const { data, error } = await supabase
          .from("pickups")
          .select("*")
          .eq("user_id", profileId)
          .order("created_at", {
            ascending: false,
          });

        if (error) throw error;

        return json({
          pickups: data || [],
        });
      }

      /**
       * CREATE PICKUP
       */
      case "create": {
        const {
          address,
          waste_type,
          notes,
          scheduled_date,
          full_name,
          phone,
          nin,
        } = body;

        if (!address || !waste_type) {
          return json(
            {
              error:
                "address and waste_type are required",
            },
            400
          );
        }

        if (!full_name || !phone) {
          return json(
            {
              error:
                "Name and phone are required",
            },
            400
          );
        }
       
        //  NIN is Compulsory
if (!nin) {
    return json({ error: "NIN required" }, 400);
  }

        /**
         * Update profile info
         */
        const profileUpdate: Record<
          string,
          any
        > = {
          full_name,
          phone,
          address,
          nin,
        };

        const {
          error: updateErr,
        } = await supabase
          .from("profiles")
          .update(profileUpdate)
          .eq("id", profileId);

        if (updateErr) {
          console.warn(
            "profile update warning:",
            updateErr.message
          );
        }

        /**
         * Create pickup
         */
        const {
          data,
          error,
        } = await supabase
          .from("pickups")
          .insert([
            {
              user_id: profileId,
              address,
              waste_type,
              notes: notes || null,
              scheduled_date:
                scheduled_date || null,
              status: "pending",
            },
          ])
          .select()
          .single();

        if (error) throw error;

        return json({
          pickup: data,
        });
      }

      /**
       * LIST COLLECTOR PICKUPS
       */
      case "list_collector": {
        const [
          pendingRes,
          assignedRes,
          completedRes,
        ] = await Promise.all([
          supabase
            .from("pickups")
            .select("*")
            .eq("status", "pending")
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("pickups")
            .select("*")
            .eq("collector_id", profileId)
            .in("status", [
              "accepted",
              "in_progress",
            ])
            .order("created_at", {
              ascending: false,
            }),

          supabase
            .from("pickups")
            .select("*")
            .eq("collector_id", profileId)
            .eq("status", "completed")
            .order("completed_at", {
              ascending: false,
            })
            .limit(10),
        ]);

        if (pendingRes.error)
          throw pendingRes.error;

        if (assignedRes.error)
          throw assignedRes.error;

        if (completedRes.error)
          throw completedRes.error;

        return json({
          available: await attachProfiles(
            pendingRes.data || []
          ),

          assigned: await attachProfiles(
            assignedRes.data || []
          ),

          completed: await attachProfiles(
            completedRes.data || []
          ),
        });
      }

      /**
       * ACCEPT PICKUP
       */
      case "accept": {
        const { pickupId } = body;

        if (!pickupId) {
          return json(
            { error: "pickupId required" },
            400
          );
        }

        const { error } = await supabase
          .from("pickups")
          .update({
            collector_id: profileId,
            status: "accepted",
          })
          .eq("id", pickupId)
          .eq("status", "pending");

        if (error) throw error;

        return json({
          success: true,
        });
      }

      /**
       * COMPLETE PICKUP
       */
      case "complete": {
        const {
          pickupId,
          reward_tokens,
        } = body;

        if (!pickupId) {
          return json(
            { error: "pickupId required" },
            400
          );
        }

        const updatePayload: Record<
          string,
          any
        > = {
          status: "completed",
          completed_at:
            new Date().toISOString(),
        };

        if (
          reward_tokens !== undefined
        ) {
          updatePayload.reward_tokens =
            reward_tokens;
        }

        const { error } = await supabase
          .from("pickups")
          .update(updatePayload)
          .eq("id", pickupId)
          .eq("collector_id", profileId);

        if (error) throw error;

        return json({
          success: true,
        });
      }

      default:
        return json(
          {
            error: `Unknown action: ${action}`,
          },
          400
        );
    }
  } catch (err: any) {
    console.error(
      "pickups-api fatal error:",
      err
    );

    return json(
      {
        error:
          err?.message ||
          "Internal server error",
      },
      500
    );
  }
});