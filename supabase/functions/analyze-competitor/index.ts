import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AnalyzeRequest {
  competitorName: string;
  userId: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { competitorName, userId }: AnalyzeRequest = await req.json();

    console.log(`🐶 Thiago Costa analisando ${competitorName}...`);

    // 1. Buscar dados recentes do concorrente
    const { data: recentData } = await supabase
      .from("competitor_data")
      .select("*")
      .eq("user_id", userId)
      .eq("competitor_name", competitorName)
      .order("scraped_at", { ascending: false })
      .limit(10);

    // 2. Buscar dados históricos (última semana)
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: historicalData } = await supabase
      .from("competitor_data")
      .select("*")
      .eq("user_id", userId)
      .eq("competitor_name", competitorName)
      .gte("scraped_at", oneWeekAgo)
      .order("scraped_at", { ascending: true });

    console.log(`📊 Dados coletados: ${recentData?.length || 0} recentes, ${historicalData?.length || 0} históricos`);

    // 3. Preparar contexto para Thiago
    const analysisPrompt = `Você é Thiago Costa, especialista em Inteligência Competitiva.

DADOS COLETADOS DO CONCORRENTE "${competitorName}":
${JSON.stringify(recentData?.slice(0, 5), null, 2)}

DADOS HISTÓRICOS (última semana):
${JSON.stringify(historicalData?.slice(0, 5), null, 2)}

TAREFAS:
1. Analise profundamente os dados coletados
2. Identifique:
   - Estratégia de precificação (se disponível)
   - Mensagem principal e posicionamento
   - Features e diferenciais
   - Canais de comunicação ativos
   - Estilo visual e tom de voz
3. Compare com dados históricos e detecte MUDANÇAS SIGNIFICATIVAS
4. Classifique cada mudança por IMPACTO (alto/médio/baixo)
5. Sugira AÇÕES ESTRATÉGICAS em resposta

Retorne em formato JSON estruturado com:
{
  "summary": "resumo executivo",
  "pricing": { "strategy": "...", "range": "..." },
  "messaging": { "mainMessage": "...", "tone": "...", "keywords": [...] },
  "features": [...],
  "channels": [...],
  "changes": [
    {
      "description": "...",
      "impact": "alto|médio|baixo",
      "detectedAt": "date",
      "category": "pricing|messaging|features|design"
    }
  ],
  "strategicActions": [...]
}`;

    // 4. Buscar configuração do Thiago
    const { data: agentConfig } = await supabase
      .from("agent_configs")
      .select("system_prompt, temperature, max_tokens")
      .eq("agent_id", "competitive-intel")
      .single();

    // 5. Chamar Lovable AI (Thiago)
    const lovableResponse = await fetch("https://api.lovable.app/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-exp",
        messages: [
          { role: "system", content: agentConfig?.system_prompt || "Você é Thiago Costa, especialista em inteligência competitiva." },
          { role: "user", content: analysisPrompt },
        ],
        temperature: agentConfig?.temperature || 0.7,
        max_tokens: agentConfig?.max_tokens || 2000,
        response_format: { type: "json_object" },
      }),
    });

    if (!lovableResponse.ok) {
      throw new Error(`Lovable API error: ${lovableResponse.statusText}`);
    }

    const aiResponse = await lovableResponse.json();
    const analysis = JSON.parse(aiResponse.choices[0].message.content);

    console.log(`✅ Análise concluída! Mudanças detectadas: ${analysis.changes?.length || 0}`);

    // 6. Salvar análise
    await supabase.from("competitor_data").insert({
      user_id: userId,
      competitor_name: competitorName,
      platform: "analysis",
      data_type: "ai_insights",
      data: {
        analysis,
        analyzedBy: "Thiago Costa",
        analyzedAt: new Date().toISOString(),
        sourceDataCount: recentData?.length || 0,
      },
      scraped_at: new Date().toISOString(),
    });

    // 7. Se houver mudanças de alto impacto, escalar para Ricardo (CMO)
    const highImpactChanges = analysis.changes?.filter((c: any) => c.impact === "alto") || [];

    if (highImpactChanges.length > 0) {
      console.log(`🚨 ${highImpactChanges.length} mudanças de alto impacto detectadas! Escalando para Ricardo...`);

      await supabase.functions.invoke("agent-communication", {
        body: {
          from_agent: "competitive-intel",
          to_agent: "cmo",
          content: `🚨 Mudanças significativas detectadas em ${competitorName}:\n${
            highImpactChanges.map((c: any) => `- ${c.description}`).join("\n")
          }`,
          type: "escalation",
          requires_response: true,
          context: { competitorName, analysis, highImpactChanges },
        },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        competitorName,
        insights: analysis,
        changesDetected: analysis.changes?.length || 0,
        highImpactChanges: highImpactChanges.length,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro na análise:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
