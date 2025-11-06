import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { platform, profileHandle, startDate, endDate } = await req.json();
    const APIFY_API_TOKEN = Deno.env.get('APIFY_API_TOKEN');

    if (!APIFY_API_TOKEN) {
      throw new Error('APIFY_API_TOKEN not configured');
    }

    console.log(`Syncing ${platform} metrics for profile: ${profileHandle}`);

    let apifyActorId = '';
    let inputConfig: any = {};

    // Configurar Apify actor baseado na plataforma
    switch (platform) {
      case 'instagram':
        apifyActorId = 'apify/instagram-scraper';
        inputConfig = {
          username: [profileHandle],
          resultsType: 'profiles',
          resultsLimit: 1,
        };
        break;
      
      case 'linkedin':
        apifyActorId = 'apify/linkedin-profile-scraper';
        inputConfig = {
          profileUrls: [`https://www.linkedin.com/company/${profileHandle}`],
        };
        break;
      
      case 'youtube':
        apifyActorId = 'apify/youtube-channel-scraper';
        inputConfig = {
          channelUrls: [`https://www.youtube.com/@${profileHandle}`],
        };
        break;
      
      default:
        throw new Error(`Unsupported platform: ${platform}`);
    }

    // Chamar Apify para scraping
    const apifyResponse = await fetch(
      `https://api.apify.com/v2/acts/${apifyActorId}/run-sync-get-dataset-items?token=${APIFY_API_TOKEN}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(inputConfig),
      }
    );

    if (!apifyResponse.ok) {
      throw new Error(`Apify API error: ${apifyResponse.statusText}`);
    }

    const apifyData = await apifyResponse.json();
    console.log('Apify response:', JSON.stringify(apifyData).substring(0, 200));

    if (!apifyData || apifyData.length === 0) {
      throw new Error('No data returned from Apify');
    }

    const profileData = apifyData[0];
    const today = new Date().toISOString().split('T')[0];

    // Processar dados baseado na plataforma
    let metricsData: any = {
      user_id: user.id,
      platform,
      profile_handle: profileHandle,
      date: today,
      scraped_at: new Date().toISOString(),
    };

    switch (platform) {
      case 'instagram':
        metricsData = {
          ...metricsData,
          followers: profileData.followersCount || 0,
          following: profileData.followsCount || 0,
          posts_count: profileData.postsCount || 0,
          total_likes: profileData.likesCount || 0,
          engagement_rate: profileData.engagementRate || 0,
          metadata: {
            biography: profileData.biography,
            verified: profileData.verified,
            profilePicUrl: profileData.profilePicUrl,
          },
        };
        break;

      case 'linkedin':
        metricsData = {
          ...metricsData,
          followers: profileData.followersCount || 0,
          posts_count: profileData.postsCount || 0,
          metadata: {
            description: profileData.description,
            website: profileData.website,
            industry: profileData.industry,
          },
        };
        break;

      case 'youtube':
        metricsData = {
          ...metricsData,
          followers: profileData.subscriberCount || 0,
          posts_count: profileData.videoCount || 0,
          total_views: profileData.viewCount || 0,
          metadata: {
            description: profileData.description,
            customUrl: profileData.customUrl,
          },
        };
        break;
    }

    // Upsert na tabela social_media_metrics
    const { data: insertedData, error: insertError } = await supabaseClient
      .from('social_media_metrics')
      .upsert(metricsData, {
        onConflict: 'user_id,platform,profile_handle,date',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting metrics:', insertError);
      throw insertError;
    }

    console.log(`Successfully synced ${platform} metrics for ${profileHandle}`);

    return new Response(
      JSON.stringify({
        success: true,
        platform,
        profileHandle,
        metrics: insertedData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('Error in social-media-sync:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.toString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
