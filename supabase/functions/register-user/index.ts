import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGISTRATION_FEE_SATOSHIS = 100;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      throw new Error('Server configuration error');
    }

    // Validate JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized', success: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claimsData.claims.sub as string;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json();
    const { walletHandle, walletType, role, displayName } = body;

    if (!walletHandle) {
      throw new Error('Missing walletHandle');
    }

    console.log('Registering wallet for user:', userId, 'handle:', walletHandle, 'role:', role);

    const transactionId = `reg-${Date.now()}-${crypto.randomUUID().slice(0, 8)}`;

    // Update existing profile (created by handle_new_user trigger) with wallet info
    const profileUpdate: Record<string, any> = {
      wallet_handle: walletHandle,
      wallet_connected_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (displayName) profileUpdate.full_name = displayName;

    const { error: updateErr } = await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', userId);

    if (updateErr) {
      console.error('Profile update failed:', updateErr);
      throw new Error('Failed to update profile with wallet');
    }

    // Set/update role if provided
    if (role) {
      // Delete existing then insert (single role per user)
      await supabase.from('user_roles').delete().eq('user_id', userId);
      const { error: roleErr } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role });
      if (roleErr) console.error('Role insert failed:', roleErr);
    }

    // Ensure token balance row exists (trigger creates it, but be safe)
    await supabase
      .from('token_balances')
      .upsert({ user_id: userId, balance: 0, total_earned: 0 }, { onConflict: 'user_id' });

    // Record the registration transaction
    if (role) {
      await supabase.from('token_transactions').insert({
        user_id: userId,
        amount: -REGISTRATION_FEE_SATOSHIS,
        transaction_type: 'registration_fee',
        description: `Registration as ${role} - TX: ${transactionId}`,
      });
    }

    const isHandCash = walletType === 'handcash';
    const whatsonchainUrl = isHandCash ? `https://whatsonchain.com/tx/${transactionId}` : null;

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        whatsonchainUrl,
        profileId: userId,
        message: role
          ? `Successfully registered as ${role}.`
          : `Wallet linked successfully.`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Registration error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
