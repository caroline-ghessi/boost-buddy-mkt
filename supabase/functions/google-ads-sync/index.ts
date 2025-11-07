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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  let jobRunId: string | null = null;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    const { startDate: reqStartDate, endDate: reqEndDate, automated = false } = await req.json().catch(() => ({}));
    
    // Fase 3: Janela de reprocessamento de 7 dias
    const end = reqEndDate || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const start = reqStartDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    console.log(`Syncing Google Ads data for user ${user.id} from ${start} to ${end}`);

    // Criar registro de execução
    const { data: jobRun, error: jobRunError } = await supabase
      .from('sync_job_runs')
      .insert({
        job_name: automated ? 'daily-google-ads-sync' : 'manual-google-ads-sync',
        source: 'google_ads',
        user_id: user.id,
        status: 'running',
        metadata: { startDate: start, endDate: end, automated }
      })
      .select()
      .single();

    if (!jobRunError) {
      jobRunId = jobRun.id;
    }

    const accessToken = await getValidAccessToken(supabase, user.id);
    
    const customerId = Deno.env.get('GOOGLE_ADS_CUSTOMER_ID');
    const loginCustomerId = Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');

    if (!customerId || !developerToken) {
      throw new Error('Google Ads credentials not configured');
    }

    console.log(`Using Customer ID: ${customerId}, Login Customer ID: ${loginCustomerId || 'none'}`);

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
      console.error('Google Ads API error:', errorText);
      throw new Error(`Google Ads API failed: ${adsResponse.status} - ${errorText}`);
    }

    const adsData = await adsResponse.json();

    if (Array.isArray(adsData) && adsData.length > 0 && adsData[0].error) {
      throw new Error(`Google Ads API error: ${adsData[0].error.message || 'Unknown error'}`);
    }

    let totalImpressions = 0;
    let totalClicks = 0;
    let totalCost = 0;
    let totalConversions = 0;
    let processedResults = 0;

    for (const batch of adsData) {
      if (!batch.results || !Array.isArray(batch.results)) continue;

      for (const result of batch.results) {
        if (!result.campaign || !result.segments || !result.metrics) continue;

        const { campaign, segments, metrics } = result;
        processedResults++;

        const cost = parseFloat(metrics.costMicros || 0) / 1_000_000;
        const cpc = parseFloat(metrics.averageCpc || 0) / 1_000_000;
        const conversions = parseFloat(metrics.conversions);
        const clicks = parseInt(metrics.clicks);
        
        const conversion_rate = clicks > 0 ? parseFloat((conversions / clicks * 100).toFixed(2)) : 0;
        const cost_per_conversion = conversions > 0 ? parseFloat((cost / conversions).toFixed(2)) : 0;

        // Fase 3: Upsert para reprocessamento
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

    const avgCtr = totalImpressions > 0 ? parseFloat((totalClicks / totalImpressions * 100).toFixed(2)) : 0;

    console.log(`Google Ads sync completed. Processed ${processedResults} results.`);

    // Atualizar job run com sucesso
    if (jobRunId) {
      await supabase
        .from('sync_job_runs')
        .update({
          status: 'success',
          finished_at: new Date().toISOString(),
          rows_processed: processedResults,
          metadata: { totalImpressions, totalClicks, totalCost, totalConversions, avgCtr }
        })
        .eq('id', jobRunId);
    }

    return new Response(
      JSON.stringify({
        success: true,
        period: { start, end },
        totals: { impressions: totalImpressions, clicks: totalClicks, cost: totalCost, conversions: totalConversions, ctr: avgCtr },
        resultsProcessed: processedResults,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Error in google-ads-sync:', error);
    
    // Atualizar job run com erro
    if (jobRunId) {
      const supabase = createClient(supabaseUrl, supabaseKey);
      await supabase
        .from('sync_job_runs')
        .update({
          status: 'failed',
          finished_at: new Date().toISOString(),
          error_message: error instanceof Error ? error.message : 'Unknown error'
        })
        .eq('id', jobRunId);
    }
    
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});