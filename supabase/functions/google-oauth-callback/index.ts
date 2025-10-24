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
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/performance?error=oauth_failed`);
    }

    if (!code || !state) {
      throw new Error('Missing code or state parameter');
    }

    // Decode and validate state
    const stateData = JSON.parse(atob(state));
    const userId = stateData.user_id;

    if (!userId) {
      throw new Error('Invalid state parameter');
    }

    // Exchange code for tokens
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    const redirectUri = `${Deno.env.get('SUPABASE_URL')}/functions/v1/google-oauth-callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId!,
        client_secret: clientSecret!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Token exchange failed:', errorText);
      throw new Error('Failed to exchange code for tokens');
    }

    const tokens = await tokenResponse.json();
    console.log('Tokens received, expires_in:', tokens.expires_in);

    // Initialize Supabase with service role key for inserting data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Calculate expiration time
    const expiresAt = new Date(Date.now() + (tokens.expires_in * 1000));

    // Store credentials in database
    const { error: insertError } = await supabase
      .from('google_credentials')
      .upsert({
        user_id: userId,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt.toISOString(),
        scope: tokens.scope.split(' '),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (insertError) {
      console.error('Failed to store credentials:', insertError);
      throw new Error('Failed to store credentials');
    }

    console.log('Credentials stored successfully for user:', userId);

    // Redirect back to performance page
    const redirectUrl = `${supabaseUrl.replace('.supabase.co', '.lovable.app')}/performance?success=true`;
    return Response.redirect(redirectUrl);

  } catch (error) {
    console.error('Error in google-oauth-callback:', error);
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const redirectUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app')}/performance?error=${encodeURIComponent(errorMsg)}`;
    return Response.redirect(redirectUrl);
  }
});
