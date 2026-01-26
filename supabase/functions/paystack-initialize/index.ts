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

    if (!paystackSecretKey) {
      throw new Error('Paystack secret key not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { email, amount, walletHandle, paymentType, metadata } = await req.json();

    if (!email || !amount || !walletHandle || !paymentType) {
      throw new Error('Missing required fields: email, amount, walletHandle, paymentType');
    }

    console.log('Initializing Paystack payment for:', walletHandle, 'amount:', amount, 'NGN');

    // Get user profile ID
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_handle', walletHandle)
      .maybeSingle();

    if (profileError || !profile) {
      console.error('Profile lookup error:', profileError);
      throw new Error('User profile not found');
    }

    // Generate unique reference
    const reference = `T2P_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Paystack uses kobo (100 kobo = 1 NGN)
        reference,
        callback_url: metadata?.callback_url || `${req.headers.get('origin') || 'http://localhost:8080'}/payment-callback`,
        metadata: {
          user_id: profile.id,
          wallet_handle: walletHandle,
          payment_type: paymentType,
          ...metadata,
        },
      }),
    });

    if (!paystackResponse.ok) {
      const errorText = await paystackResponse.text();
      console.error('Paystack initialization failed:', errorText);
      throw new Error('Failed to initialize Paystack payment');
    }

    const paystackData = await paystackResponse.json();
    console.log('Paystack initialization successful:', paystackData.data.reference);

    // Create pending payment record
    const { error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: profile.id,
        amount,
        currency: 'NGN',
        payment_type: paymentType,
        payment_method: 'paystack',
        status: 'pending',
        reference,
        paystack_reference: paystackData.data.reference,
        metadata: metadata || {},
      });

    if (paymentError) {
      console.error('Failed to create payment record:', paymentError);
      // Don't throw - payment was initialized successfully
    }

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: paystackData.data.authorization_url,
        access_code: paystackData.data.access_code,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Paystack initialization error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
