import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const APP_SIGNATURE = "T2P";

// ✅ Logging helper
async function logScan(
  supabase: any,
  qrCodeId: string | null,
  scannedByUserId: string | null,
  result: boolean,
  failureReason: string | null
) {
  try {
    const { error } = await supabase.from("qr_scan_logs").insert({
      qr_code_id: qrCodeId,
      scanned_by_user_id: scannedByUserId,
      verification_result: result,
      failure_reason: failureReason,
      scanned_at: new Date().toISOString(),
    });

    if (error) console.error("logScan DB Error:", error.message);
  } catch (e) {
    console.error("logScan Critical Error:", e);
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
    const { qrData, scannedByUserId } = body;

    if (!qrData) throw new Error("Missing QR data");

    console.log("🔍 Verifying QR...");

    // ✅ HARD REQUIRE USER (prevents infinite increment bug)
    if (!scannedByUserId) {
      throw new Error("Missing scannedByUserId");
    }

    // ✅ Parse QR
    let parsedData;
    try {
      parsedData =
        typeof qrData === "string" ? JSON.parse(qrData) : qrData;
    } catch {
      await logScan(supabase, null, scannedByUserId, false, "Invalid QR format");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid QR format" }),
        { headers: corsHeaders }
      );
    }

    // ✅ Signature check
    if (parsedData.app !== APP_SIGNATURE) {
      await logScan(supabase, null, scannedByUserId, false, "Invalid signature");
      return new Response(
        JSON.stringify({ success: false, error: "Not a T2P QR" }),
        { headers: corsHeaders }
      );
    }

    const { token } = parsedData;

    if (!token) {
      await logScan(supabase, null, scannedByUserId, false, "Missing token");
      throw new Error("Invalid QR: missing token");
    }

    console.log("🔑 Token:", token);

    // ✅ DB lookup
    const { data: qrRecord, error: lookupError } = await supabase
      .from("user_qr_codes")
      .select("*")
      .eq("qr_token", token.trim())
      .maybeSingle();

    console.log("📦 DB response:", {
      found: !!qrRecord,
      error: lookupError?.message || null,
    });

    if (lookupError) {
      console.error("❌ DB error:", lookupError.message);
      throw new Error("Database query failed");
    }

    if (!qrRecord) {
      await logScan(supabase, null, scannedByUserId, false, "QR not found");
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or revoked QR" }),
        { headers: corsHeaders }
      );
    }

    console.log("✅ QR FOUND:", {
      id: qrRecord.id,
      user: qrRecord.user_id,
      active: qrRecord.is_active,
      scan_count: qrRecord.scan_count,
    });

    // ✅ ACTIVE CHECK
    if (!qrRecord.is_active) {
      await logScan(supabase, qrRecord.id, scannedByUserId, false, "Deactivated");
      return new Response(
        JSON.stringify({ success: false, error: "QR is deactivated" }),
        { headers: corsHeaders }
      );
    }

    // =========================
    // ✅ COOLDOWN CHECK (STRICT)
    // =========================
    const { data: existingScan, error: scanError } = await supabase
      .from("qr_scan_logs")
      .select("id, scanned_at")
      .eq("qr_code_id", qrRecord.id)
      .eq("scanned_by_user_id", scannedByUserId)
      .order("scanned_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (scanError) {
      console.error("❌ Scan lookup failed:", scanError.message);
    }

    if (existingScan) {
      const lastScanTime = new Date(existingScan.scanned_at).getTime();
      const now = Date.now();
      const diffSeconds = (now - lastScanTime) / 1000;

      if (diffSeconds < 30) {
        console.log("⛔ Duplicate scan blocked");

        await logScan(
          supabase,
          qrRecord.id,
          scannedByUserId,
          false,
          "Cooldown: duplicate scan"
        );

        return new Response(
          JSON.stringify({
            success: false,
            error: "Please wait before scanning again",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // =========================
    // ✅ ATOMIC INCREMENT
    // =========================
    const { error: updateError } = await supabase.rpc("increment_scan_count", {
      row_id: qrRecord.id,
    });

    if (updateError) {
      console.error("❌ Update failed:", updateError.message);
    } else {
      console.log("✅ Scan updated");
    }

    // =========================
    // ✅ FETCH TRUE COUNT
    // =========================
    const { data: updatedRecord } = await supabase
      .from("user_qr_codes")
      .select("scan_count")
      .eq("id", qrRecord.id)
      .single();

    const finalScanCount =
      updatedRecord?.scan_count ?? (qrRecord.scan_count || 0) + 1;

    // ✅ Log success
    await logScan(supabase, qrRecord.id, scannedByUserId, true, null);

    console.log("🎉 VERIFIED:", {
      user: qrRecord.user_id,
      scanCount: finalScanCount,
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: true,
        user: qrRecord.user_id,
        scanCount: finalScanCount,
        message: "QR verified successfully",
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