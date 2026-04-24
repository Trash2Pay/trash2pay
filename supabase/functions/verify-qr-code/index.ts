import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_SIGNATURE = "T2P";

// ✅ Logging helper (SAFE)
async function logScan(
  supabase: any,
  qrCodeId: string | null,
  scannedByUserId: string | null,
  scannedByWallet: string | null,
  result: boolean,
  failureReason: string | null
) {
  try {
    await supabase.from("qr_scan_logs").insert({
      qr_code_id: qrCodeId,
      scanned_by_user_id: scannedByUserId,
      scanned_by_wallet: scannedByWallet,
      verification_result: result,
      failure_reason: failureReason,
      scanned_at: new Date().toISOString(),
    });
  } catch (e) {
    console.error("logScan error:", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));

    // =========================
    // ✅ NORMALIZE INPUT
    // =========================
    let {
      qrData,
      scannedByUserId,
      scannedByWallet,
    } = body;

    scannedByUserId = scannedByUserId || null;
    scannedByWallet = scannedByWallet || null;

    console.log("📥 Incoming:", {
      qrData,
      scannedByUserId,
      scannedByWallet,
    });

    if (!qrData) throw new Error("Missing QR data");

    // =========================
    // ✅ REQUIRE AT LEAST ONE IDENTITY
    // =========================
    if (!scannedByUserId && !scannedByWallet) {
      throw new Error("Missing scanner identity (user or wallet required)");
    }

    console.log("🔍 Verifying QR...");

    // =========================
    // ✅ PARSE QR
    // =========================
    let parsedData;
    try {
      parsedData =
        typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch {
      await logScan(
        supabase,
        null,
        scannedByUserId,
        scannedByWallet,
        false,
        "Invalid QR format"
      );

      return new Response(
        JSON.stringify({ success: false, error: "Invalid QR format" }),
        { headers: corsHeaders }
      );
    }

    // =========================
    // ✅ SIGNATURE CHECK
    // =========================
    if (parsedData.app !== APP_SIGNATURE) {
      await logScan(
        supabase,
        null,
        scannedByUserId,
        scannedByWallet,
        false,
        "Invalid signature"
      );

      return new Response(
        JSON.stringify({ success: false, error: "Not a T2P QR" }),
        { headers: corsHeaders }
      );
    }

    const token = parsedData?.token?.trim();

    if (!token) {
      await logScan(
        supabase,
        null,
        scannedByUserId,
        scannedByWallet,
        false,
        "Missing token"
      );
      throw new Error("Invalid QR: missing token");
    }

    console.log("🔑 Token:", token);

    // =========================
    // ✅ DB LOOKUP
    // =========================
    const { data: qrRecord, error: lookupError } = await supabase
      .from("user_qr_codes")
      .select("*")
      .eq("qr_token", token)
      .maybeSingle();

    if (lookupError) {
      console.error("DB error:", lookupError.message);
      throw new Error("Database query failed");
    }

    if (!qrRecord) {
      await logScan(
        supabase,
        null,
        scannedByUserId,
        scannedByWallet,
        false,
        "QR not found"
      );

      return new Response(
        JSON.stringify({ success: false, error: "Invalid or revoked QR" }),
        { headers: corsHeaders }
      );
    }

    // =========================
    // ✅ ACTIVE CHECK
    // =========================
    if (!qrRecord.is_active) {
      await logScan(
        supabase,
        qrRecord.id,
        scannedByUserId,
        scannedByWallet,
        false,
        "Deactivated"
      );

      return new Response(
        JSON.stringify({ success: false, error: "QR is deactivated" }),
        { headers: corsHeaders }
      );
    }

    // =========================
    // ✅ COOLDOWN CHECK (SMART)
    // =========================
    let query = supabase
      .from("qr_scan_logs")
      .select("scanned_at")
      .eq("qr_code_id", qrRecord.id)
      .order("scanned_at", { ascending: false })
      .limit(1);

    if (scannedByUserId) {
      query = query.eq("scanned_by_user_id", scannedByUserId);
    } else {
      query = query.eq("scanned_by_wallet", scannedByWallet);
    }

    const { data: existingScan } = await query.maybeSingle();

    if (existingScan) {
      const diff =
        (Date.now() - new Date(existingScan.scanned_at).getTime()) / 1000;

      if (diff < 30) {
        await logScan(
          supabase,
          qrRecord.id,
          scannedByUserId,
          scannedByWallet,
          false,
          "Cooldown"
        );

        return new Response(
          JSON.stringify({
            success: false,
            error: "Please wait before scanning again",
          }),
          { headers: corsHeaders }
        );
      }
    }

    // =========================
    // ✅ ATOMIC INCREMENT
    // =========================
    await supabase.rpc("increment_scan_count", {
      row_id: qrRecord.id,
    });

    const { data: updatedRecord } = await supabase
      .from("user_qr_codes")
      .select("scan_count")
      .eq("id", qrRecord.id)
      .single();

    const finalScanCount =
      updatedRecord?.scan_count ?? (qrRecord.scan_count || 0) + 1;

    // =========================
    // ✅ SUCCESS LOG
    // =========================
    await logScan(
      supabase,
      qrRecord.id,
      scannedByUserId,
      scannedByWallet,
      true,
      null
    );

    console.log("✅ VERIFIED:", {
      user: qrRecord.user_id,
      scanCount: finalScanCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        user: qrRecord.user_id,
        scanCount: finalScanCount,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );

  } catch (error: any) {
    console.error("❌ QR verification error:", error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});