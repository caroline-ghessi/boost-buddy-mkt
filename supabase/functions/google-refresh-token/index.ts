// Helper function to refresh Google OAuth tokens
// Used by other edge functions, not called directly

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  expires_in: number;
}> {
  const clientId = Deno.env.get('GOOGLE_CLIENT_ID');
  const clientSecret = Deno.env.get('GOOGLE_CLIENT_SECRET');

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: clientId!,
      client_secret: clientSecret!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Token refresh failed:', errorText);
    throw new Error('Failed to refresh access token');
  }

  const data = await response.json();
  return {
    access_token: data.access_token,
    expires_in: data.expires_in,
  };
}

export async function getValidAccessToken(
  supabase: any,
  userId: string
): Promise<string> {
  // Get credentials from database
  const { data: creds, error } = await supabase
    .from('google_credentials')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !creds) {
    throw new Error('No Google credentials found. Please connect your Google account.');
  }

  // Check if token is expired (with 5 minute buffer)
  const expiresAt = new Date(creds.expires_at);
  const now = new Date();
  const bufferMs = 5 * 60 * 1000; // 5 minutes

  if (expiresAt.getTime() - now.getTime() > bufferMs) {
    // Token still valid
    return creds.access_token;
  }

  // Token expired, refresh it
  console.log('Access token expired, refreshing...');
  const { access_token, expires_in } = await refreshAccessToken(creds.refresh_token);

  // Update database with new token
  const newExpiresAt = new Date(Date.now() + (expires_in * 1000));
  await supabase
    .from('google_credentials')
    .update({
      access_token,
      expires_at: newExpiresAt.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', userId);

  return access_token;
}
