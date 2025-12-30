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
      // Get the origin from request headers for callback URL
      const origin = req.headers.get('origin') || 'https://trash2pay.vercel.app';
      
      // Generate HandCash OAuth redirect URL with callback to our app
      const redirectUrl = `https://app.handcash.io/#/authorizeApp?appId=${appId}&redirectUrl=${encodeURIComponent(origin)}`;
      console.log('Generated redirect URL with callback to:', origin);
      
      return new Response(
        JSON.stringify({ redirectUrl }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'verify-token' && authToken) {
      // Verify HandCash auth token and get user profile using Connect API
      console.log('Verifying HandCash token...');
      
      // Try the new Connect API endpoint first
      let profileResponse = await fetch('https://api.handcash.io/v3/connect/profile/currentUserProfile', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      // Fallback to alternative endpoint if needed
      if (!profileResponse.ok) {
        console.log('Trying alternative profile endpoint...');
        profileResponse = await fetch('https://iae.cloud.handcash.io/api/users/me', {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        });
      }

      if (!profileResponse.ok) {
        const errorText = await profileResponse.text();
        console.error('HandCash profile fetch failed:', profileResponse.status, errorText);
        throw new Error('Failed to verify HandCash token');
      }

      const profile = await profileResponse.json();
      console.log('HandCash profile response:', JSON.stringify(profile));
      
      // Handle different response formats
      const handle = profile.publicProfile?.handle || profile.handle || profile.alias;
      const displayName = profile.publicProfile?.displayName || profile.displayName || handle;
      const avatarUrl = profile.publicProfile?.avatarUrl || profile.avatarUrl;
      const paymail = profile.publicProfile?.paymail || profile.paymail || `${handle}@handcash.io`;

      return new Response(
        JSON.stringify({
          handle,
          displayName,
          avatarUrl,
          paymail,
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