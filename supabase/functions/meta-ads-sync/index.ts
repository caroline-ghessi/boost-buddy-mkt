import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.76.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface MetaInsightData {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  date_stop: string;
  impressions: string;
  reach: string;
  clicks: string;
  spend: string;
  ctr: string;
  cpc: string;
  cpm: string;
  actions?: Array<{
    action_type: string;
    value: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting Meta Ads sync...');

    // Authenticate user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Authenticated user: ${user.id}`);

    // Get Meta credentials from secrets
    const metaAccessToken = Deno.env.get('META_ACCESS_TOKEN');
    let metaAdAccountId = Deno.env.get('META_AD_ACCOUNT_ID');

    if (!metaAccessToken || !metaAdAccountId) {
      throw new Error('Meta credentials not configured');
    }

    // Ensure account ID has the 'act_' prefix required by Meta API
    if (!metaAdAccountId.startsWith('act_')) {
      metaAdAccountId = `act_${metaAdAccountId}`;
      console.log(`Added 'act_' prefix to account ID: ${metaAdAccountId}`);
    }

    // Parse date range from request
    const { startDate, endDate } = await req.json().catch(() => ({}));
    
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    const since = start.toISOString().split('T')[0];
    const until = end.toISOString().split('T')[0];

    console.log(`Fetching Meta Ads data from ${since} to ${until}`);

    // Build Meta Graph API request
    const fields = [
      'campaign_id',
      'campaign_name',
      'impressions',
      'reach',
      'clicks',
      'spend',
      'ctr',
      'cpc',
      'cpm',
      'actions',
      'action_values'
    ].join(',');

    const apiUrl = new URL(`https://graph.facebook.com/v22.0/${metaAdAccountId}/insights`);
    apiUrl.searchParams.set('fields', fields);
    apiUrl.searchParams.set('level', 'campaign');
    apiUrl.searchParams.set('time_increment', '1');
    apiUrl.searchParams.set('time_range', JSON.stringify({ since, until }));
    apiUrl.searchParams.set('access_token', metaAccessToken);

    console.log('Calling Meta Graph API...');

    const metaResponse = await fetch(apiUrl.toString());
    
    if (!metaResponse.ok) {
      const errorText = await metaResponse.text();
      console.error('Meta API error:', errorText);
      throw new Error(`Meta API error: ${metaResponse.status} - ${errorText}`);
    }

    const metaData = await metaResponse.json();
    console.log(`Received ${metaData.data?.length || 0} campaign insights from Meta`);

    // Process and store metrics
    let processedCampaigns = 0;
    const totals = {
      impressions: 0,
      reach: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      ctr: 0,
    };

    for (const insight of metaData.data || []) {
      const data = insight as MetaInsightData;
      
      // Extract conversions from actions array
      let conversions = 0;
      if (data.actions) {
        const conversionActions = data.actions.filter(action => 
          ['purchase', 'lead', 'complete_registration', 'submit_application'].includes(action.action_type)
        );
        conversions = conversionActions.reduce((sum, action) => sum + parseFloat(action.value || '0'), 0);
      }

      const impressions = parseInt(data.impressions || '0');
      const reach = parseInt(data.reach || '0');
      const clicks = parseInt(data.clicks || '0');
      const cost = parseFloat(data.spend || '0');
      const ctr = parseFloat(data.ctr || '0');
      const cpc = parseFloat(data.cpc || '0');
      const cpm = parseFloat(data.cpm || '0');

      const conversionRate = clicks > 0 ? (conversions / clicks) * 100 : 0;
      const costPerConversion = conversions > 0 ? cost / conversions : 0;

      // Upsert into database
      const { error: upsertError } = await supabase
        .from('meta_ads_metrics')
        .upsert({
          user_id: user.id,
          campaign_id: data.campaign_id,
          campaign_name: data.campaign_name,
          date: data.date_start,
          impressions,
          reach,
          clicks,
          ctr,
          cost,
          cpc,
          cpm,
          conversions,
          conversion_rate: conversionRate,
          cost_per_conversion: costPerConversion,
          metadata: {
            actions: data.actions || [],
            synced_at: new Date().toISOString(),
          },
        }, {
          onConflict: 'user_id,campaign_id,date',
        });

      if (upsertError) {
        console.error('Error upserting metric:', upsertError);
        throw upsertError;
      }

      // Add to totals
      totals.impressions += impressions;
      totals.reach += reach;
      totals.clicks += clicks;
      totals.cost += cost;
      totals.conversions += conversions;
      processedCampaigns++;
    }

    totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;

    console.log(`Successfully processed ${processedCampaigns} campaign insights`);

    return new Response(
      JSON.stringify({
        success: true,
        period: { start: since, end: until },
        totals,
        campaignsProcessed: processedCampaigns,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in meta-ads-sync:', error);
    return new Response(
      JSON.stringify({ 
        error: error?.message || 'Unknown error',
        details: error?.toString() || '' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
