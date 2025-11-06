import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getLLMEndpoint, getAPIKey } from "../_shared/llm-router.ts";

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

Você receberá dados de um concorrente contendo:
1. PERFIL do Instagram (bio, followers, etc)
2. POSTS recentes (conteúdo, engajamento, hashtags)
3. MÉTRICAS agregadas

DADOS COLETADOS DO CONCORRENTE "${competitorName}":
${JSON.stringify(recentData?.slice(0, 5), null, 2)}

DADOS HISTÓRICOS (última semana):
${JSON.stringify(historicalData?.slice(0, 5), null, 2)}

TAREFAS:
1. Analise profundamente PERFIL + POSTS
2. Identifique:
   - Posicionamento (baseado na bio e perfil)
   - Tamanho e crescimento da audiência
   - Nível de autoridade (verificado, followers, engajamento)
   - Temas principais de conteúdo
   - Frequência de postagem
   - Tipos de conteúdo que geram mais engajamento
   - Estratégia de hashtags
   - Taxa de engajamento e tendência
   - Como interagem com a comunidade
3. Compare com dados históricos e detecte MUDANÇAS SIGNIFICATIVAS
4. Classifique cada mudança por IMPACTO (alto|médio|baixo)
5. Sugira AÇÕES ESTRATÉGICAS e OPORTUNIDADES DE DIFERENCIAÇÃO

Retorne em formato JSON estruturado:
{
  "summary": "Resumo executivo da análise em 2-3 frases",
  
  "profile_analysis": {
    "positioning": "Como o concorrente se posiciona (baseado na bio e perfil)",
    "audience_size": "Análise do tamanho e crescimento da audiência",
    "authority": "Nível de autoridade (verificado, followers, engajamento)"
  },
  
  "content_strategy": {
    "themes": ["tema1", "tema2", "tema3"],
    "posting_frequency": "Análise da frequência de postagem",
    "best_performing_content": "Tipo de conteúdo que gera mais engajamento",
    "hashtag_strategy": "Como usam hashtags"
  },
  
  "engagement_analysis": {
    "avg_engagement_rate": "Taxa média de engajamento em %",
    "engagement_trend": "Tendência de engajamento (crescendo/estável/caindo)",
    "community_interaction": "Como interagem com a comunidade"
  },
  
  "opportunities": [
    "Oportunidade 1 de diferenciação",
    "Oportunidade 2 de diferenciação",
    "Oportunidade 3 de diferenciação"
  ],
  
  "threats": [
    "Ameaça 1 ou ponto forte do concorrente",
    "Ameaça 2 ou ponto forte do concorrente"
  ],
  
  "changes": [
    {
      "description": "...",
      "impact": "alto|médio|baixo",
      "detectedAt": "date",
      "category": "profile|content|engagement|strategy"
    }
  ],
  
  "recommended_actions": [
    "Ação estratégica 1",
    "Ação estratégica 2",
    "Ação estratégica 3"
  ],
  
  "impact_level": "low|medium|high",
  "confidence": 0.0
}`;

    // 4. Buscar configuração do Thiago
    const { data: agentConfig } = await supabase
      .from("agent_configs")
      .select("system_prompt, temperature, max_tokens, llm_model")
      .eq("agent_id", "competitive-intel")
      .single();

    const model = agentConfig?.llm_model || 'google/gemini-2.5-flash';
    const endpoint = getLLMEndpoint(model);
    const apiKey = getAPIKey(model);

    // 5. Chamar LLM API (Thiago)
    const lovableResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
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
