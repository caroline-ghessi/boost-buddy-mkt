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

    console.log(`🔄 Iniciando monitoramento periódico de concorrentes...`);

    // Buscar concorrentes ativos (com scraping nos últimos 30 dias)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    
    const { data: activeCompetitors } = await supabase
      .from("competitor_data")
      .select("competitor_name, user_id, platform, data")
      .eq("data_type", "monitoring_config")
      .gte("scraped_at", thirtyDaysAgo)
      .order("scraped_at", { ascending: true });

    if (!activeCompetitors || activeCompetitors.length === 0) {
      console.log("ℹ️ Nenhum concorrente ativo para monitorar");
      return new Response(
        JSON.stringify({ success: true, message: "No active competitors to monitor" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`📋 ${activeCompetitors.length} concorrentes ativos encontrados`);

    // Processar cada concorrente
    const processed = [];
    for (const competitor of activeCompetitors.slice(0, 5)) { // Max 5 por execução
      try {
        const config = competitor.data as any;
        const platforms = config?.platforms || {};

        console.log(`🔍 Scraping ${competitor.competitor_name}...`);

        const { data, error } = await supabase.functions.invoke("scrape-competitor", {
          body: {
            competitorName: competitor.competitor_name,
            platforms,
            scrapeType: "quick",
            userId: competitor.user_id,
          },
        });

        if (error) {
          console.error(`❌ Erro ao scrape ${competitor.competitor_name}:`, error);
        } else {
          processed.push(competitor.competitor_name);
          console.log(`✅ ${competitor.competitor_name} atualizado`);
        }

        // Wait 10s entre cada para não sobrecarregar
        await new Promise(resolve => setTimeout(resolve, 10000));
      } catch (error) {
        console.error(`❌ Error processing ${competitor.competitor_name}:`, error);
      }
    }

    console.log(`✅ Monitoramento concluído. ${processed.length} concorrentes atualizados.`);

    return new Response(
      JSON.stringify({
        success: true,
        competitorsProcessed: processed.length,
        processedList: processed,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro no monitoramento:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
