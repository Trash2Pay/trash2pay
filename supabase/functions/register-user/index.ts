import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const REGISTRATION_FEE_SATOSHIS = 100;
const PLATFORM_WALLET = "trash2pay";

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("HANDCASH_APP_ID");
    const appSecret = Deno.env.get("HANDCASH_APP_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { authToken, role, walletHandle, walletType } = await req.json();

    // ✅ Flexible validation
    if (!role || !walletHandle || !walletType) {
      throw new Error(
        "Missing required fields: role, walletHandle, walletType"
      );
    }

    console.log("Wallet:", walletHandle, "| Type:", walletType);

    let transactionId = null;

    // =========================
    // 🟢 HANDCASH FLOW
    // =========================
    if (walletType === "handcash") {
      if (!authToken || !appId || !appSecret) {
        throw new Error("HandCash credentials missing");
      }

      console.log("Processing HandCash payment...");

      const paymentResponse = await fetch(
        "https://cloud.handcash.io/v3/pay",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authToken}`,
            "app-id": appId,
            "app-secret": appSecret,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            description: `Trash2Pay Registration - ${role}`,
            receivers: [
              {
                destination: PLATFORM_WALLET,
                currencyCode: "SAT",
                sendAmount: REGISTRATION_FEE_SATOSHIS,
              },
            ],
          }),
        }
      );

      if (!paymentResponse.ok) {
        const errorText = await paymentResponse.text();
        throw new Error(`Payment failed: ${errorText}`);
      }

      const paymentResult = await paymentResponse.json();
      transactionId = paymentResult.transactionId;
    }

    // =========================
    // 🔵 ELECTRUM SV FLOW
    // =========================
    if (walletType === "electrumsv") {
      console.log("ElectrumSV user - skipping automatic charge");

      // You can later:
      // - Verify payment manually
      // - Or require frontend TX submission

      transactionId = "manual-" + crypto.randomUUID();
    }

    // =========================
    // DATABASE LOGIC
    // =========================

    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_handle", walletHandle)
      .single();

    let profileId: string;

    if (existingProfile) {
      profileId = existingProfile.id;

      await supabase
        .from("profiles")
        .update({
          wallet_connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    } else {
      const newId = crypto.randomUUID();

      const { error } = await supabase.from("profiles").insert({
        id: newId,
        wallet_handle: walletHandle,
        wallet_type: walletType,
        wallet_connected_at: new Date().toISOString(),
      });

      if (error) throw error;

      profileId = newId;
    }

    // Role
    await supabase.from("user_roles").upsert(
      {
        user_id: profileId,
        role,
      },
      { onConflict: "user_id" }
    );

    // Token balance
    await supabase.from("token_balances").upsert(
      {
        user_id: profileId,
        balance: 0,
        total_earned: 0,
      },
      { onConflict: "user_id" }
    );

    // Transaction log
    await supabase.from("token_transactions").insert({
      user_id: profileId,
      amount: -REGISTRATION_FEE_SATOSHIS,
      transaction_type: "registration_fee",
      description: `Registration (${walletType}) - TX: ${transactionId}`,
    });

    const whatsonchainUrl =
      transactionId && !transactionId.startsWith("manual")
        ? `https://whatsonchain.com/tx/${transactionId}`
        : null;

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        whatsonchainUrl,
        profileId,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Registration error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});