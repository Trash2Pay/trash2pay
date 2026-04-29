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
    const { walletHandle, reason } = await req.json();

    if (!walletHandle) {
      throw new Error('Missing walletHandle');
    }

    console.log('Revoking QR code for:', walletHandle, 'reason:', reason);

    // Find and deactivate the user's active QR code
    const { data: existingQR, error: findError } = await supabase
      .from('user_qr_codes')
      .select('id, qr_token')
      .eq('user_id', walletHandle)
      .eq('is_active', true)
      .maybeSingle();

    if (findError) {
      console.error('Error finding QR code:', findError);
      throw new Error('Failed to find QR code');
    }

    if (!existingQR) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'No active QR code found to revoke',
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Deactivate the QR code
    const { error: updateError } = await supabase
      .from('user_qr_codes')
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingQR.id);

    if (updateError) {
      console.error('Error revoking QR code:', updateError);
      throw new Error('Failed to revoke QR code');
    }

    console.log('Successfully revoked QR code:', existingQR.qr_token.substring(0, 20) + '...');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'QR code has been revoked successfully',
        revokedToken: existingQR.qr_token.substring(0, 10) + '...',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    console.error('QR revocation error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message, success: false }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
