import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
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
    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      throw new Error('Unauthorized');
    }

    console.log(`Diagnosing Google Ads accounts for user ${user.id}`);

    // Get valid Google access token
    const accessToken = await getValidAccessToken(supabase, user.id);
    
    // Get Google Ads credentials from environment
    const loginCustomerId = Deno.env.get('GOOGLE_ADS_LOGIN_CUSTOMER_ID');
    const developerToken = Deno.env.get('GOOGLE_ADS_DEVELOPER_TOKEN');

    if (!loginCustomerId || !developerToken) {
      throw new Error('Missing Google Ads credentials');
    }

    console.log(`Using Login Customer ID (MCC): ${loginCustomerId}`);

    // Query to list all customer clients under the MCC
    const query = `
      SELECT 
        customer_client.client_customer,
        customer_client.descriptive_name,
        customer_client.id,
        customer_client.manager,
        customer_client.status,
        customer_client.currency_code,
        customer_client.time_zone
      FROM customer_client
      WHERE customer_client.status = 'ENABLED'
      ORDER BY customer_client.descriptive_name
    `;

    console.log('Fetching MCC account hierarchy...');

    // Call Google Ads API
    const adsResponse = await fetch(
      `https://googleads.googleapis.com/v22/customers/${loginCustomerId}/googleAds:searchStream`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': developerToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      }
    );

    if (!adsResponse.ok) {
      const errorText = await adsResponse.text();
      console.error('Google Ads API Error:', errorText);
      throw new Error(`Google Ads API error: ${adsResponse.status} - ${errorText}`);
    }

    const adsData = await adsResponse.json();
    console.log('API Response received');

    // Parse results
    const accounts = [];
    
    if (adsData && Array.isArray(adsData)) {
      for (const item of adsData) {
        if (item.results && Array.isArray(item.results)) {
          for (const result of item.results) {
            if (result.customerClient) {
              const client = result.customerClient;
              accounts.push({
                customer_id: client.id || client.clientCustomer,
                name: client.descriptiveName,
                is_manager: client.manager || false,
                status: client.status,
                currency: client.currencyCode,
                timezone: client.timeZone,
              });
            }
          }
        }
      }
    }

    console.log(`Found ${accounts.length} accounts under MCC`);

    // Find the Drystore account
    const drystoreAccount = accounts.find(acc => 
      acc.name && acc.name.toLowerCase().includes('drystore')
    );

    return new Response(
      JSON.stringify({
        success: true,
        mcc_id: loginCustomerId,
        total_accounts: accounts.length,
        accounts: accounts,
        drystore_account: drystoreAccount || null,
        message: drystoreAccount 
          ? `✅ Conta Drystore encontrada: ${drystoreAccount.customer_id}`
          : '⚠️ Nenhuma conta com nome "Drystore" foi encontrada',
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in diagnose-google-ads-accounts:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails,
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
