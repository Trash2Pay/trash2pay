/**
 * redemption-batch
 * ----------------------------------------------------------------
 * Periodically aggregates pending off-chain T2P credits from Supabase
 * and builds a signed redemption batch for on-chain settlement against
 * the BSV T2PToken smart contract (contracts/bsv/T2PToken.scrypt.ts).
 *
 * Flow:
 *   1. Collect pending redemptions (token_redemptions.status = 'pending')
 *   2. Build merkle tree over (recipientWalletHash, amount) leaves
 *   3. Compute batchRoot, totalAmount, nonce
 *   4. Sign commitment with ORACLE_PRIVATE_KEY:
 *        ACTION_REDEMPTION_BATCH (0x02) || batchRoot || totalAmount(LE8) || nonce(LE8)
 *   5. Persist batch + mark redemptions as 'batched'
 *   6. Return signed payload for treasury co-sign + BSV broadcast
 *      (treasury signing + tx broadcast happen out-of-band)
 *
 * Auth: service-role only (called by scheduler or admin).
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ACTION_REDEMPTION_BATCH = new Uint8Array([0x02]);

// ---------- helpers ----------

const enc = new TextEncoder();

async function sha256(bytes: Uint8Array): Promise<Uint8Array> {
  const h = await crypto.subtle.digest("SHA-256", bytes);
  return new Uint8Array(h);
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

function toHex(b: Uint8Array): string {
  return Array.from(b).map((x) => x.toString(16).padStart(2, "0")).join("");
}

function u64LE(n: bigint): Uint8Array {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setBigUint64(0, n, true);
  return buf;
}

async function leafHash(recipient: string, amount: bigint): Promise<Uint8Array> {
  return await sha256(concat(enc.encode(recipient), u64LE(amount)));
}

async function merkleRoot(leaves: Uint8Array[]): Promise<Uint8Array> {
  if (leaves.length === 0) return new Uint8Array(32);
  let layer = leaves;
  while (layer.length > 1) {
    const next: Uint8Array[] = [];
    for (let i = 0; i < layer.length; i += 2) {
      const l = layer[i];
      const r = i + 1 < layer.length ? layer[i + 1] : layer[i];
      next.push(await sha256(concat(l, r)));
    }
    layer = next;
  }
  return layer[0];
}

async function importOraclePrivKey(pkcs8B64: string): Promise<CryptoKey> {
  const raw = Uint8Array.from(atob(pkcs8B64), (c) => c.charCodeAt(0));
  return await crypto.subtle.importKey(
    "pkcs8",
    raw,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

async function signOracle(key: CryptoKey, msg: Uint8Array): Promise<string> {
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    key,
    msg,
  );
  return toHex(new Uint8Array(sig));
}

// ---------- handler ----------

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const oracleKeyB64 = Deno.env.get("ORACLE_PRIVATE_KEY");

    if (!oracleKeyB64) {
      throw new Error(
        "ORACLE_PRIVATE_KEY secret not configured (base64 PKCS8 P-256 key)",
      );
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    // 1. Load pending redemptions
    const { data: pending, error: pErr } = await supabase
      .from("token_redemptions")
      .select("id, user_id, wallet_address, t2p_amount")
      .eq("status", "pending")
      .order("created_at", { ascending: true })
      .limit(500);

    if (pErr) throw pErr;
    if (!pending || pending.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No pending redemptions" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // 2. Build leaves + merkle root
    const leaves: Uint8Array[] = [];
    let totalAmount = 0n;
    const recipients = pending.map((r) => {
      const amt = BigInt(Math.floor(Number(r.t2p_amount)));
      totalAmount += amt;
      return { id: r.id, wallet: r.wallet_address, amount: amt };
    });
    for (const r of recipients) {
      leaves.push(await leafHash(r.wallet, r.amount));
    }
    const root = await merkleRoot(leaves);

    // 3. Determine nonce (monotonic per contract state)
    const { data: lastBatch } = await supabase
      .from("redemption_batches")
      .select("nonce")
      .order("nonce", { ascending: false })
      .limit(1)
      .maybeSingle();
    const nonce = BigInt((lastBatch?.nonce ?? 0) + 1);

    // 4. Sign commitment
    const commitment = concat(
      ACTION_REDEMPTION_BATCH,
      root,
      u64LE(totalAmount),
      u64LE(nonce),
    );
    const oracleKey = await importOraclePrivKey(oracleKeyB64);
    const oracleSig = await signOracle(oracleKey, commitment);

    // 5. Persist batch + mark redemptions as batched
    const { data: batch, error: bErr } = await supabase
      .from("redemption_batches")
      .insert({
        nonce: Number(nonce),
        batch_root: toHex(root),
        total_amount: Number(totalAmount),
        recipient_count: recipients.length,
        oracle_sig: oracleSig,
        status: "awaiting_treasury",
      })
      .select()
      .single();

    if (bErr) throw bErr;

    await supabase
      .from("token_redemptions")
      .update({ status: "batched" })
      .in("id", recipients.map((r) => r.id));

    // 6. Return payload for treasury co-sign + BSV broadcast
    return new Response(
      JSON.stringify({
        success: true,
        batch_id: batch.id,
        nonce: Number(nonce),
        batch_root: toHex(root),
        total_amount: Number(totalAmount),
        commitment_hex: toHex(commitment),
        oracle_sig: oracleSig,
        recipients: recipients.map((r) => ({
          wallet: r.wallet,
          amount: Number(r.amount),
        })),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: unknown) {
    console.error("redemption-batch error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ success: false, error: message }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
