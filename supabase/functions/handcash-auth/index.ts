import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { HandCashConnect } from 'npm:@handcash/handcash-connect';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const appId = Deno.env.get("HANDCASH_APP_ID");
    const appSecret = Deno.env.get("HANDCASH_APP_SECRET");

    if (!appId || !appSecret) {
      throw new Error("HandCash credentials not configured");
    }

    const { action, authToken } = await req.json();
    const handCashConnect = new HandCashConnect({ appId, appSecret });

    // --- ACTION: GET REDIRECT URL ---
    if (action === "get-redirect-url") {
      const redirectUrl = handCashConnect.getRedirectionUrl();
      return new Response(JSON.stringify({ redirectUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- ACTION: VERIFY TOKEN ---
    if (action === "verify-token") {
      if (!authToken) throw new Error("Missing authToken");

      // Correct SDK flow
      const account = handCashConnect.getAccountFromAuthToken(authToken);
      const profile = await account.profile.getCurrentProfile();

      return new Response(
        JSON.stringify({
          success: true,
          handle: profile.publicProfile.handle,
          displayName: profile.publicProfile.displayName,
          avatarUrl: profile.publicProfile.avatarUrl,
          paymail: profile.publicProfile.paymail,
          accessToken: authToken,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Invalid action");
    
  } catch (error: any) {
    console.error("HandCash auth error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message || "Unknown error" }),
      { 
        status: 400, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
