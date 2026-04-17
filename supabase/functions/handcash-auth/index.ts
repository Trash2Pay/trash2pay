import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
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
    console.log("HandCash action:", action);

    // =========================
    // 🔵 STEP 1: GET REDIRECT URL
    // =========================
    if (action === "get-redirect-url") {
      const origin =
        req.headers.get("origin") || "https://trash2pay.vercel.app";

      const redirectUrl = `https://app.handcash.io/#/authorizeApp?appId=${appId}&redirectUrl=${encodeURIComponent(
        origin
      )}`;

      return new Response(JSON.stringify({ redirectUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // =========================
    // 🟢 STEP 2: VERIFY TOKEN (FIXED)
    // =========================
    if (action === "verify-token") {
      if (!authToken) {
        throw new Error("Missing authToken");
      }

      console.log("Exchanging authToken for accessToken...");

      // 🔥 CRITICAL FIX: Exchange authToken → accessToken
      const tokenResponse = await fetch(
  "https://api.handcash.io/v1/connect/token",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${btoa(`${appId}:${appSecret}`)}`,
    },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: authToken,
    }),
  }
);

      if (!tokenResponse.ok) {
        const errText = await tokenResponse.text();
        console.error("Token exchange failed:", errText);
        throw new Error("Failed to exchange HandCash token");
      }

      const tokenData = await tokenResponse.json();
      console.log("TOKEN DATA:", tokenData);
      const accessToken = tokenData.access_token;

      if (!accessToken) {
        throw new Error("No accessToken returned from HandCash");
      }

      console.log("Access token obtained");

      // =========================
      // 🔵 STEP 3: FETCH USER PROFILE
      // =========================
      const profileResponse = await fetch(
        "https://api.handcash.io/v3/connect/profile/currentUserProfile",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!profileResponse.ok) {
        const errText = await profileResponse.text();
        console.error("Profile fetch failed:", errText);
        throw new Error("Failed to fetch HandCash profile");
      }

      const profile = await profileResponse.json();

      console.log("Profile fetched successfully");

      const handle = profile.publicProfile?.handle;
      const displayName = profile.publicProfile?.displayName;
      const avatarUrl = profile.publicProfile?.avatarUrl;
      const paymail = profile.publicProfile?.paymail;

      // =========================
      // ✅ RETURN EVERYTHING NEEDED
      // =========================
      return new Response(
        JSON.stringify({
          success: true,
          handle,
          displayName,
          avatarUrl,
          paymail,
          accessToken, // 🔥 VERY IMPORTANT
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    throw new Error("Invalid action");
  } catch (error: any) {
    console.error("HandCash auth error:", error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});