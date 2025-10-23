import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🔄 Syncing Apify results...");

    // Buscar todos os concorrentes ativos com configuração de monitoramento
    const { data: configs, error: configError } = await supabase
      .from("competitor_data")
      .select("user_id, competitor_name, platform, data")
      .eq("data_type", "monitoring_config");

    if (configError) throw configError;

    if (!configs || configs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active competitors to sync" }),
        { 
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200 
        }
      );
    }

    const syncResults = [];

    // Para cada concorrente, buscar últimos resultados
    for (const config of configs) {
      const platforms = config.data?.platforms || {};
      
      if (platforms.instagram) {
        try {
          console.log(`🔄 Syncing ${config.competitor_name}...`);
          
          // Chamar scrape-competitor em modo "fetch"
          const { error } = await supabase.functions.invoke("scrape-competitor", {
            body: {
              competitorName: config.competitor_name,
              platforms: { instagram: platforms.instagram },
              scrapeType: "quick",
              userId: config.user_id,
              mode: "fetch"
            }
          });

          if (error) throw error;

          syncResults.push({
            competitor: config.competitor_name,
            status: "success"
          });

          console.log(`✅ Synced ${config.competitor_name}`);
        } catch (error) {
          console.error(`❌ Error syncing ${config.competitor_name}:`, error);
          syncResults.push({
            competitor: config.competitor_name,
            status: "error",
            error: (error as Error).message
          });
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        synced: syncResults.length,
        results: syncResults
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200 
      }
    );
  } catch (error) {
    console.error("❌ Sync error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { 
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
