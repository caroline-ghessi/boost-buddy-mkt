import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  console.log('[google-oauth-authorize] Function invoked');
  
  if (req.method === 'OPTIONS') {
    console.log('[google-oauth-authorize] Handling CORS preflight');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[google-oauth-authorize] Processing OAuth request');
    
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('[google-oauth-authorize] Missing authorization header');
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('[google-oauth-authorize] Missing Supabase environment variables');
      throw new Error('Server configuration error: Missing Supabase credentials');
    }
    
    console.log('[google-oauth-authorize] Supabase URL:', supabaseUrl);
    
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: {
        headers: { Authorization: authHeader },
      },
    });

    // Get user from token
    console.log('[google-oauth-authorize] Verifying user authentication');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('[google-oauth-authorize] User authentication failed:', userError);
      throw new Error('Unauthorized');
    }
    
    console.log('[google-oauth-authorize] User authenticated:', user.id);

    // Check all required secrets
    const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
    const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');
    
    console.log('[google-oauth-authorize] Checking secrets...');
    console.log('[google-oauth-authorize] GOOGLE_CLIENT_ID present:', !!clientId);
    console.log('[google-oauth-authorize] GOOGLE_CLIENT_SECRET present:', !!clientSecret);
    
    if (!clientId) {
      console.error('[google-oauth-authorize] GOOGLE_CLIENT_ID not configured');
      throw new Error('Google Client ID not configured. Please add it in Supabase Edge Function secrets.');
    }
    
    if (!clientSecret) {
      console.error('[google-oauth-authorize] GOOGLE_CLIENT_SECRET not configured');
      throw new Error('Google Client Secret not configured. Please add it in Supabase Edge Function secrets.');
    }
    
    const redirectUri = `${supabaseUrl}/functions/v1/google-oauth-callback`;
    console.log('[google-oauth-authorize] Redirect URI:', redirectUri);

    // Build Google OAuth URL with proper scopes
    const scopes = [
      'https://www.googleapis.com/auth/analytics.readonly',
      'https://www.googleapis.com/auth/adwords',
    ];

    // Create state with user_id for security
    const state = btoa(JSON.stringify({ user_id: user.id, timestamp: Date.now() }));

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('access_type', 'offline');
    authUrl.searchParams.set('prompt', 'consent'); // Force to get refresh token

    console.log('[google-oauth-authorize] Generated OAuth URL:', authUrl.toString());

    return new Response(
      JSON.stringify({ url: authUrl.toString() }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('[google-oauth-authorize] Error occurred:', error);
    console.error('[google-oauth-authorize] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: 'Check Edge Function logs for more information'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
