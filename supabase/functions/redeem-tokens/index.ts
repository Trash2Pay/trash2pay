import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { walletHandle, t2pAmount, targetCurrency, walletAddress } = await req.json();

    if (!walletHandle || !t2pAmount || !targetCurrency || !walletAddress) {
      throw new Error('Missing required fields: walletHandle, t2pAmount, targetCurrency, walletAddress');
    }

    if (t2pAmount <= 0) {
      throw new Error('Amount must be greater than 0');
    }

    if (!['SAT', 'BSV'].includes(targetCurrency)) {
      throw new Error('Invalid target currency. Must be SAT or BSV');
    }

    console.log('Processing token redemption:', t2pAmount, 'T2P to', targetCurrency);

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_handle', walletHandle)
      .maybeSingle();

    if (profileError || !profile) {
      throw new Error('User profile not found');
    }

    // Check user's T2P balance
    const { data: balance, error: balanceError } = await supabase
      .from('token_balances')
      .select('balance')
      .eq('user_id', profile.id)
      .maybeSingle();

    if (balanceError || !balance) {
      throw new Error('Token balance not found');
    }

    if (balance.balance < t2pAmount) {
      throw new Error(`Insufficient T2P balance. Available: ${balance.balance}, Requested: ${t2pAmount}`);
    }

    // Get exchange rate
    const { data: exchangeRate, error: rateError } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'T2P')
      .eq('to_currency', targetCurrency)
      .eq('is_active', true)
      .maybeSingle();

    if (rateError || !exchangeRate) {
      throw new Error(`Exchange rate not found for T2P to ${targetCurrency}`);
    }

    const convertedAmount = t2pAmount * exchangeRate.rate;
    console.log('Conversion:', t2pAmount, 'T2P =', convertedAmount, targetCurrency);

    // Deduct T2P from balance
    await supabase
      .from('token_balances')
      .update({ balance: balance.balance - t2pAmount })
      .eq('user_id', profile.id);

    // Create redemption request
    const { data: redemption, error: redemptionError } = await supabase
      .from('token_redemptions')
      .insert({
        user_id: profile.id,
        t2p_amount: t2pAmount,
        target_currency: targetCurrency,
        converted_amount: convertedAmount,
        exchange_rate: exchangeRate.rate,
        wallet_address: walletAddress,
        status: 'processing',
      })
      .select()
      .single();

    if (redemptionError) {
      // Rollback balance deduction
      await supabase
        .from('token_balances')
        .update({ balance: balance.balance })
        .eq('user_id', profile.id);
      throw new Error('Failed to create redemption request');
    }

    // Record token transaction
    await supabase
      .from('token_transactions')
      .insert({
        user_id: profile.id,
        amount: -t2pAmount,
        transaction_type: 'token_redemption',
        description: `Redeemed ${t2pAmount} T2P for ${convertedAmount} ${targetCurrency}`,
      });

    // TODO: Integrate with HandCash Pay API to send actual crypto
    // For now, mark as processing (manual fulfillment)
    console.log('Redemption request created:', redemption.id);

    return new Response(
      JSON.stringify({
        success: true,
        redemption_id: redemption.id,
        t2p_amount: t2pAmount,
        converted_amount: convertedAmount,
        target_currency: targetCurrency,
        exchange_rate: exchangeRate.rate,
        wallet_address: walletAddress,
        status: 'processing',
        message: `Redemption request submitted. ${convertedAmount} ${targetCurrency} will be sent to ${walletAddress}`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Token redemption error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
