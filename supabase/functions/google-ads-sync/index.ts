import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getValidAccessToken } from "../_shared/google-auth-helpers.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { startDate, endDate } = await req.json();
    
    // Default to last 30 days if not provided
    const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const end = endDate || new Date().toISOString().split('T')[0];

    console.log(`Syncing Google Ads data for user ${user.id} from ${start} to ${end}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);
    
    // Get Google Ads credentials from environment
    const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
    const loginCustomerId = Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');

    // Validate required secrets
    if (!customerId) {
      throw new Error('GOOGLE_ADS_CUSTOMER_ID not configured');
    }
    if (!developerToken) {
      throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not configured');
    }
    if (!loginCustomerId) {
      console.warn('GOOGLE_ADS_LOGIN_CUSTOMER_ID not set. Required for MCC accounts.');
    }

    console.log(`Using Customer ID: ${customerId}, Login Customer ID: ${loginCustomerId || 'none'}`);

    // Log request headers (masking sensitive data)
    console.log('Google Ads API Request Configuration:', {
      endpoint: 'v22/googleAds:searchStream',
      customerId,
      loginCustomerId: loginCustomerId || customerId,
      hasDeveloperToken: !!developerToken,
      hasAccessToken: !!accessToken,
    });

    // Build GAQL query (v22 API uses snake_case)
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        segments.date,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cost_micros,
        metrics.average_cpc,
        metrics.conversions,
        metrics.conversions_value
      FROM campaign
      WHERE segments.date BETWEEN '${start}' AND '${end}'
        AND campaign.status = 'ENABLED'
      ORDER BY segments.date DESC
    `;

    // Call Google Ads API
    const adsResponse = await fetch(
      `https://googleads.googleapis.com/v22/customers/${customerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'developer-token': developerToken,
          'login-customer-id': loginCustomerId || customerId,
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!adsResponse.ok) {
      const errorText = await adsResponse.text();
      console.error('Google Ads API error details:', {
        status: adsResponse.status,
        statusText: adsResponse.statusText,
        error: errorText,
        customerId,
        loginCustomerId,
      });
      throw new Error(`Google Ads API failed: ${adsResponse.status} - ${errorText}`);
    }

    const adsData = await adsResponse.json();
    console.log('Google Ads API Full Response:', JSON.stringify(adsData, null, 2));

    // Check if response contains error
    if (Array.isArray(adsData) && adsData.length > 0 && adsData[0].error) {
      console.error('Google Ads API returned error in response:', adsData[0].error);
      throw new Error(`Google Ads API error: ${adsData[0].error.message || 'Unknown error'}`);
    }

    // Process and insert metrics
    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCost = 0;
    let totalConversions = 0;
    let processedResults = 0;

    // Google Ads API v22 searchStream returns array of batches, each with a results array
    for (const batch of adsData) {
      if (!batch.results || !Array.isArray(batch.results)) {
        console.warn('Batch missing results array:', { hasBatch: !!batch, hasResults: !!batch?.results });
        continue;
      }

      console.log(`Processing batch with ${batch.results.length} results`);

      for (const result of batch.results) {
        // Validate result structure
        if (!result.campaign || !result.segments || !result.metrics) {
          console.warn('Skipping invalid result - missing required fields:', {
            hasCampaign: !!result.campaign,
            hasSegments: !!result.segments,
            hasMetrics: !!result.metrics,
          });
          continue;
        }

        const campaign = result.campaign;
        const segments = result.segments;
        const metrics = result.metrics;
        processedResults++;

      // Convert cost from micros to currency (API returns camelCase fields)
      const cost = parseFloat(metrics.costMicros || 0) / 1_000_000;
      const cpc = parseFloat(metrics.averageCpc || 0) / 1_000_000;
      const conversions = parseFloat(metrics.conversions);
      const clicks = parseInt(metrics.clicks);
      
      const conversion_rate = clicks > 0 
        ? parseFloat((conversions / clicks * 100).toFixed(2))
        : 0;
      
      const cost_per_conversion = conversions > 0
        ? parseFloat((cost / conversions).toFixed(2))
        : 0;

      await supabase
        .from('google_ads_metrics')
        .upsert({
          user_id: user.id,
          date: segments.date,
          campaign_id: campaign.id.toString(),
          campaign_name: campaign.name,
          impressions: parseInt(metrics.impressions),
          clicks,
          ctr: parseFloat((parseFloat(metrics.ctr) * 100).toFixed(2)),
          cost,
          cpc,
          conversions,
          conversion_rate,
          cost_per_conversion,
          metadata: { 
            conversions_value: parseFloat(metrics.conversionsValue || 0),
            synced_at: new Date().toISOString() 
          },
        }, {
          onConflict: 'user_id,campaign_id,date'
        });

        totalImpressions += parseInt(metrics.impressions);
        totalClicks += clicks;
        totalCost += cost;
        totalConversions += conversions;
      }
    }

    const avgCtr = totalImpressions > 0 
      ? parseFloat((totalClicks / totalImpressions * 100).toFixed(2))
      : 0;

    console.log(`Google Ads sync completed successfully. Processed ${processedResults} campaign results.`);

    return new Response(
      JSON.stringify({
        success: true,
        period: { start, end },
        totals: {
          impressions: totalImpressions,
          clicks: totalClicks,
          cost: totalCost,
          conversions: totalConversions,
          ctr: avgCtr,
        },
        resultsProcessed: processedResults,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in google-ads-sync:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
