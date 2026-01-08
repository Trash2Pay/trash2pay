import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const REGISTRATION_FEE_SATOSHIS = 100;
const PLATFORM_WALLET = 'trash2pay'; // Platform's HandCash handle to receive registration fees

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get('HANDCASH_APP_ID');
    const appSecret = Deno.env.get('HANDCASH_APP_SECRET');
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!appId || !appSecret) {
      console.error('HandCash credentials not configured');
      throw new Error('HandCash credentials not configured');
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase credentials not configured');
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const { authToken, role, walletHandle } = await req.json();

    if (!authToken || !role || !walletHandle) {
      throw new Error('Missing required fields: authToken, role, walletHandle');
    }

    console.log('Processing registration for wallet:', walletHandle, 'as role:', role);

    // Step 1: Charge 10 Satoshis using HandCash Pay API
    console.log('Initiating payment of', REGISTRATION_FEE_SATOSHIS, 'satoshis...');
    
    const paymentResponse = await fetch('https://cloud.handcash.io/v3/pay', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'app-id': appId,
        'app-secret': appSecret,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        description: `Trash2Pay Registration Fee - ${role === 'collector' ? 'Collector' : 'User'}`,
        receivers: [
          {
            destination: PLATFORM_WALLET,
            currencyCode: 'SAT',
            sendAmount: REGISTRATION_FEE_SATOSHIS,
          }
        ],
        appAction: 'registration',
      }),
    });

    if (!paymentResponse.ok) {
      const errorText = await paymentResponse.text();
      console.error('Payment failed:', paymentResponse.status, errorText);
      throw new Error(`Payment failed: ${errorText}`);
    }

    const paymentResult = await paymentResponse.json();
    console.log('Payment successful. Transaction ID:', paymentResult.transactionId);

    // Step 2: Create or update user profile in database
    // First check if profile exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('wallet_handle', walletHandle)
      .single();

    let profileId: string;

    if (existingProfile) {
      // Update existing profile
      profileId = existingProfile.id;
      await supabase
        .from('profiles')
        .update({
          wallet_connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', profileId);
      console.log('Updated existing profile:', profileId);
    } else {
      // Create new profile with generated UUID
      const newId = crypto.randomUUID();
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: newId,
          wallet_handle: walletHandle,
          wallet_connected_at: new Date().toISOString(),
        });

      if (insertError) {
        console.error('Failed to create profile:', insertError);
        throw new Error('Failed to create user profile');
      }
      profileId = newId;
      console.log('Created new profile:', profileId);
    }

    // Step 3: Add user role
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id: profileId,
        role: role,
      }, {
        onConflict: 'user_id',
      });

    if (roleError) {
      console.error('Failed to set user role:', roleError);
      // Don't throw - registration payment was successful
    }

    // Step 4: Initialize token balance
    await supabase
      .from('token_balances')
      .upsert({
        user_id: profileId,
        balance: 0,
        total_earned: 0,
      }, {
        onConflict: 'user_id',
      });

    // Step 5: Record the registration transaction
    await supabase
      .from('token_transactions')
      .insert({
        user_id: profileId,
        amount: -REGISTRATION_FEE_SATOSHIS,
        transaction_type: 'registration_fee',
        description: `Registration as ${role} - TX: ${paymentResult.transactionId}`,
      });

    const transactionId = paymentResult.transactionId;
    const whatsonchainUrl = `https://whatsonchain.com/tx/${transactionId}`;

    console.log('Registration complete. Whatsonchain URL:', whatsonchainUrl);

    return new Response(
      JSON.stringify({
        success: true,
        transactionId,
        whatsonchainUrl,
        profileId,
        message: `Successfully registered as ${role}. Transaction recorded on BSV blockchain.`,
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