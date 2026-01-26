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
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch all active exchange rates
    const { data: rates, error } = await supabase
      .from('exchange_rates')
      .select('from_currency, to_currency, rate, updated_at')
      .eq('is_active', true);

    if (error) {
      throw new Error('Failed to fetch exchange rates');
    }

    // Format rates into a more usable structure
    const formattedRates: Record<string, Record<string, number>> = {};
    
    for (const rate of rates || []) {
      if (!formattedRates[rate.from_currency]) {
        formattedRates[rate.from_currency] = {};
      }
      formattedRates[rate.from_currency][rate.to_currency] = rate.rate;
    }

    return new Response(
      JSON.stringify({
        success: true,
        rates: formattedRates,
        raw_rates: rates,
        last_updated: rates?.[0]?.updated_at || new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('Exchange rates error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
