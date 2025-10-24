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

    console.log(`Syncing GA4 data for user ${user.id} from ${start} to ${end}`);

    // Get valid access token
    const accessToken = await getValidAccessToken(supabase, user.id);
    const propertyId = Deno.env.get('GOOGLE_ANALYTICS_PROPERTY_ID');

    // Call Google Analytics Data API
    const analyticsResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: start, endDate: end }],
          dimensions: [
            { name: 'date' },
            { name: 'sessionDefaultChannelGrouping' }
          ],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'newUsers' },
            { name: 'screenPageViews' },
            { name: 'bounceRate' },
            { name: 'averageSessionDuration' },
            { name: 'conversions' }
          ],
        }),
      }
    );

    if (!analyticsResponse.ok) {
      const errorText = await analyticsResponse.text();
      console.error('GA4 API error:', errorText);
      throw new Error(`GA4 API failed: ${analyticsResponse.status}`);
    }

    const analyticsData = await analyticsResponse.json();
    console.log('GA4 data received, rows:', analyticsData.rows?.length || 0);

    // Process and aggregate data by date
    const metricsByDate: Record<string, any> = {};

    for (const row of analyticsData.rows || []) {
      const date = row.dimensionValues[0].value;
      const channel = row.dimensionValues[1].value;
      const metrics = row.metricValues;

      if (!metricsByDate[date]) {
        metricsByDate[date] = {
          sessions: 0,
          users: 0,
          new_users: 0,
          pageviews: 0,
          bounce_rate: 0,
          avg_session_duration: 0,
          conversions: 0,
          traffic_sources: {},
        };
      }

      const dateMetrics = metricsByDate[date];
      dateMetrics.sessions += parseInt(metrics[0].value);
      dateMetrics.users += parseInt(metrics[1].value);
      dateMetrics.new_users += parseInt(metrics[2].value);
      dateMetrics.pageviews += parseInt(metrics[3].value);
      dateMetrics.bounce_rate += parseFloat(metrics[4].value);
      dateMetrics.avg_session_duration += parseFloat(metrics[5].value);
      dateMetrics.conversions += parseInt(metrics[6].value);

      // Track traffic sources
      dateMetrics.traffic_sources[channel] = {
        sessions: parseInt(metrics[0].value),
        users: parseInt(metrics[1].value),
      };
    }

    // Insert or update metrics in database
    for (const [date, metrics] of Object.entries(metricsByDate)) {
      const conversion_rate = metrics.sessions > 0 
        ? parseFloat((metrics.conversions / metrics.sessions * 100).toFixed(2))
        : 0;

      await supabase
        .from('google_analytics_metrics')
        .upsert({
          user_id: user.id,
          date,
          sessions: metrics.sessions,
          users: metrics.users,
          new_users: metrics.new_users,
          pageviews: metrics.pageviews,
          bounce_rate: parseFloat(metrics.bounce_rate.toFixed(2)),
          avg_session_duration: parseFloat(metrics.avg_session_duration.toFixed(2)),
          conversions: metrics.conversions,
          conversion_rate,
          traffic_sources: metrics.traffic_sources,
          metadata: { synced_at: new Date().toISOString() },
        }, {
          onConflict: 'user_id,date'
        });
    }

    // Calculate aggregated totals
    const totals = Object.values(metricsByDate).reduce((acc: any, day: any) => ({
      sessions: acc.sessions + day.sessions,
      users: acc.users + day.users,
      new_users: acc.new_users + day.new_users,
      pageviews: acc.pageviews + day.pageviews,
      conversions: acc.conversions + day.conversions,
    }), { sessions: 0, users: 0, new_users: 0, pageviews: 0, conversions: 0 });

    console.log('GA4 sync completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        period: { start, end },
        totals,
        days: Object.keys(metricsByDate).length,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in google-analytics-sync:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});
