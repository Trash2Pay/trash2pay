import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get('HANDCASH_APP_ID');
    const appSecret = Deno.env.get('HANDCASH_APP_SECRET');

    if (!appId || !appSecret) {
      console.error('HandCash credentials not configured');
      throw new Error('HandCash credentials not configured');
    }

    const { action, authToken } = await req.json();
    console.log('HandCash auth action:', action);

    if (action === 'get-redirect-url') {
      // Generate HandCash OAuth redirect URL
      const redirectUrl = `https://app.handcash.io/#/authorizeApp?appId=${appId}`;
      console.log('Generated redirect URL');
      
      return new Response(
        JSON.stringify({ redirectUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-token' && authToken) {
      // Verify HandCash auth token and get user profile
      console.log('Verifying HandCash token...');
      
      const profileResponse = await fetch('https://cloud.handcash.io/v2/users/currentUserProfile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'app-id': appId,
          'app-secret': appSecret,
        },
      });

      if (!profileResponse.ok) {
        console.error('HandCash profile fetch failed:', profileResponse.status);
        throw new Error('Failed to verify HandCash token');
      }

      const profile = await profileResponse.json();
      console.log('HandCash profile verified for handle:', profile.publicProfile?.handle);

      return new Response(
        JSON.stringify({
          handle: profile.publicProfile?.handle,
          displayName: profile.publicProfile?.displayName,
          avatarUrl: profile.publicProfile?.avatarUrl,
          paymail: profile.publicProfile?.paymail,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');
  } catch (error: unknown) {
    console.error('HandCash auth error:', error);
    const message = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});