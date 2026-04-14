/// <reference lib="deno.ns" />
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

  // =========================
  // INIT ENV + CLIENTS
  // =========================
  const appId = Deno.env.get("HANDCASH_APP_ID");
  const appSecret = Deno.env.get("HANDCASH_APP_SECRET");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(
      JSON.stringify({ success: false, error: "Supabase not configured" }),
      { status: 500, headers: corsHeaders }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const body = await req.json();
    const { authToken, role, walletHandle, walletType } = body;

    if (!role || !walletHandle || !walletType) {
      throw new Error("Missing required fields");
    }

    console.log("Registering:", walletHandle, walletType);

    let transactionId: string | null = null;

    // =========================
    // HANDCASH FLOW
    // =========================
    if (walletType === "handcash") {
      if (!authToken || !appId || !appSecret) {
        throw new Error("HandCash credentials missing");
      }

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
        throw new Error(await paymentResponse.text());
      }

      const payment = await paymentResponse.json();
      transactionId = payment.transactionId;
    }

    // =========================
    // ELECTRUMSV FLOW
    // =========================
    if (walletType === "electrumsv") {
      transactionId = "manual-" + crypto.randomUUID();
    }

    // =========================
    // PROFILE UPSERT
    // =========================
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("wallet_handle", walletHandle)
      .maybeSingle();

    let profileId: string;

    if (existing) {
      profileId = existing.id;

      await supabase
        .from("profiles")
        .update({
          wallet_connected_at: new Date().toISOString(),
        })
        .eq("id", profileId);
    } else {
      profileId = crypto.randomUUID();

      const { error } = await supabase.from("profiles").insert({
        id: profileId,
        wallet_handle: walletHandle,
        wallet_type: walletType,
        wallet_connected_at: new Date().toISOString(),
      });

      if (error) throw error;
    }

    // =========================
    // ROLE
    // =========================
    await supabase.from("user_roles").upsert(
      { user_id: profileId, role },
      { onConflict: "user_id" }
    );

    // =========================
    // BALANCE
    // =========================
    await supabase.from("token_balances").upsert(
      {
        user_id: profileId,
        balance: 0,
        total_earned: 0,
      },
      { onConflict: "user_id" }
    );

    // =========================
    // TRANSACTION LOG
    // =========================
    await supabase.from("token_transactions").insert({
      user_id: profileId,
      amount: -REGISTRATION_FEE_SATOSHIS,
      transaction_type: "registration_fee",
      description: `Registration (${walletType}) - TX: ${transactionId}`,
    });

    // =========================
    // QR GENERATION (IMPORTANT FIX)
    // =========================
    let qrData = null;

    try {
      const qrRes = await fetch(
        `${supabaseUrl}/functions/v1/generate-qr-code`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${supabaseServiceKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            walletHandle,
            userRole: role,
          }),
        }
      );

      qrData = await qrRes.json();
      console.log("QR generated:", qrData);
    } catch (e) {
      console.error("QR generation failed:", e);
    }

    // =========================
    // RESPONSE
    // =========================
    return new Response(
      JSON.stringify({
        success: true,
        profileId,
        transactionId,
        whatsonchainUrl:
          transactionId && !transactionId.startsWith("manual")
            ? `https://whatsonchain.com/tx/${transactionId}`
            : null,
        qr: qrData || null,
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