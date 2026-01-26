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
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!paystackSecretKey || !supabaseUrl || !supabaseServiceKey) {
      throw new Error('Required credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { reference } = await req.json();

    if (!reference) {
      throw new Error('Missing payment reference');
    }

    console.log('Verifying Paystack payment:', reference);

    // Verify with Paystack
    const verifyResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    if (!verifyResponse.ok) {
      throw new Error('Failed to verify payment with Paystack');
    }

    const verifyData = await verifyResponse.json();
    console.log('Paystack verification result:', verifyData.data.status);

    if (verifyData.data.status !== 'success') {
      // Update payment status to failed
      await supabase
        .from('payments')
        .update({ status: 'failed' })
        .eq('paystack_reference', reference);

      throw new Error(`Payment verification failed: ${verifyData.data.gateway_response}`);
    }

    // Get the payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select('*')
      .eq('paystack_reference', reference)
      .maybeSingle();

    if (paymentError || !payment) {
      console.error('Payment record not found:', paymentError);
      throw new Error('Payment record not found');
    }

    // Update payment status to completed
    await supabase
      .from('payments')
      .update({ 
        status: 'completed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', payment.id);

    // Get exchange rate for NGN to T2P
    const { data: exchangeRate } = await supabase
      .from('exchange_rates')
      .select('rate')
      .eq('from_currency', 'NGN')
      .eq('to_currency', 'T2P')
      .eq('is_active', true)
      .maybeSingle();

    const t2pAmount = exchangeRate 
      ? Math.floor(payment.amount * exchangeRate.rate)
      : Math.floor(payment.amount * 0.1); // Default 0.1 T2P per NGN

    // Credit T2P tokens to user
    const { data: balance } = await supabase
      .from('token_balances')
      .select('*')
      .eq('user_id', payment.user_id)
      .maybeSingle();

    if (balance) {
      await supabase
        .from('token_balances')
        .update({
          balance: balance.balance + t2pAmount,
          total_earned: balance.total_earned + t2pAmount,
        })
        .eq('user_id', payment.user_id);
    } else {
      await supabase
        .from('token_balances')
        .insert({
          user_id: payment.user_id,
          balance: t2pAmount,
          total_earned: t2pAmount,
        });
    }

    // Record token transaction
    await supabase
      .from('token_transactions')
      .insert({
        user_id: payment.user_id,
        amount: t2pAmount,
        transaction_type: 'token_purchase',
        description: `Purchased ${t2pAmount} T2P for ₦${payment.amount}`,
      });

    console.log('Payment verified and tokens credited:', t2pAmount, 'T2P');

    return new Response(
      JSON.stringify({
        success: true,
        payment_status: 'completed',
        amount_paid: payment.amount,
        currency: 'NGN',
        tokens_credited: t2pAmount,
        message: `Successfully purchased ${t2pAmount} T2P tokens`,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Payment verification error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
