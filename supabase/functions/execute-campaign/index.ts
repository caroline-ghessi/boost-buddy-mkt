import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { getLLMEndpoint, getAPIKey, getHeaders, prepareAnthropicRequest, prepareGeminiRequest, isAnthropicDirect, isGeminiDirect } from "../_shared/llm-router.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CampaignBrief {
  campaignId?: string;
  name: string;
  objectives: string[];
  channels: string[];
  budget: {
    total: number;
    distribution: Record<string, number>;
  };
  targetAudience: {
    demographics: Record<string, any>;
    interests: string[];
    behaviors: string[];
  };
  creativeBrief: {
    mainMessage: string;
    toneOfVoice: string;
    keywords: string[];
    avoidWords: string[];
  };
  timeline: {
    startDate: string;
    endDate: string;
  };
  kpis: Record<string, number>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { brief }: { brief: CampaignBrief } = await req.json();

    console.log("🚀 Iniciando execução de campanha:", brief.name);

    // 1. Criar ou atualizar campanha no banco
    let campaignId = brief.campaignId;
    
    if (!campaignId) {
      const { data: campaign, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          name: brief.name,
          objectives: brief.objectives,
          channels: brief.channels,
          budget_total: brief.budget.total,
          target_audience: brief.targetAudience,
          metadata: {
            creativeBrief: brief.creativeBrief,
            budgetDistribution: brief.budget.distribution,
            timeline: brief.timeline,
            kpis: brief.kpis,
          },
          status: "executing",
        })
        .select()
        .single();

      if (campaignError) throw campaignError;
      campaignId = campaign.id;
      console.log("✅ Campanha criada:", campaignId);
    } else {
      await supabase
        .from("campaigns")
        .update({ status: "executing" })
        .eq("id", campaignId);
      console.log("✅ Campanha atualizada:", campaignId);
    }

    // 2. Ricardo (CMO) analisa o brief
    console.log("🤔 Ricardo analisando brief...");
    
    // Buscar prompt e modelo do Ricardo
    const { data: agentConfig } = await supabase
      .from("agent_configs")
      .select("system_prompt, llm_model")
      .eq("agent_id", "cmo_ricardo")
      .single();

    const model = agentConfig?.llm_model || 'google/gemini-2.5-flash';
    const endpoint = getLLMEndpoint(model);
    const apiKey = getAPIKey(model);
    const headers = getHeaders(model, apiKey);

    const ricardoPrompt = `${agentConfig?.system_prompt || ""}\n\nAnalise este brief de campanha e crie uma estratégia de execução detalhada:

Campanha: ${brief.name}
Objetivos: ${brief.objectives.join(", ")}
Canais: ${brief.channels.join(", ")}
Orçamento: R$ ${brief.budget.total.toLocaleString()}
Público: ${JSON.stringify(brief.targetAudience, null, 2)}
Mensagem: ${brief.creativeBrief.mainMessage}
Tom: ${brief.creativeBrief.toneOfVoice}

Forneça uma estratégia incluindo:
1. Fases de execução
2. Agentes necessários
3. Prioridades
4. Timeline estimado`;

    // Prepare request body based on model provider
    let requestBody: any;
    let fullEndpoint: string;
    const systemMessage = agentConfig?.system_prompt || "";

    if (isGeminiDirect(model)) {
      // Google Gemini API format
      const geminiRequest = prepareGeminiRequest([
        { role: "system", content: systemMessage },
        { role: "user", content: ricardoPrompt }
      ]);
      
      requestBody = {
        ...geminiRequest,
        generationConfig: {
          maxOutputTokens: 4096,
        }
      };
      
      fullEndpoint = `${endpoint}/${model}:generateContent?key=${apiKey}`;
      
    } else if (isAnthropicDirect(model)) {
      // Anthropic API format
      const allMessages = [
        { role: "system", content: systemMessage },
        { role: "user", content: ricardoPrompt }
      ];
      const { system, messages: anthropicMessages } = prepareAnthropicRequest(allMessages);
      
      requestBody = {
        model: model,
        max_tokens: 4096,
        system: system,
        messages: anthropicMessages,
      };
      fullEndpoint = endpoint;
      
    } else {
      // OpenAI format
      requestBody = {
        model: model,
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: ricardoPrompt }
        ],
        stream: false,
      };
      fullEndpoint = endpoint;
    }

    const lovableResponse = await fetch(fullEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    const lovableData = await lovableResponse.json();
    
    // Parse response based on model provider
    let ricardoAnalysis: string;
    if (isAnthropicDirect(model)) {
      ricardoAnalysis = lovableData.content[0].text;
    } else {
      ricardoAnalysis = lovableData.choices[0].message.content;
    }
    
    console.log("✅ Ricardo finalizou análise");

    // 3. Criar task master de orquestração
    console.log("📋 Criando tasks hierárquicas...");

    // Determinar tipos de tasks baseado nos canais e objetivos
    const taskTypes: string[] = [];
    
    if (brief.channels.includes("Google Ads") || brief.channels.includes("Meta Ads")) {
      taskTypes.push("paid_media_strategy");
    }
    
    if (brief.objectives.includes("Awareness") || brief.objectives.includes("Engagement")) {
      taskTypes.push("content_creation");
    }
    
    if (brief.objectives.includes("Leads") || brief.objectives.includes("Sales")) {
      taskTypes.push("landing_page_optimization");
    }

    // Sempre incluir análise de mercado
    taskTypes.unshift("market_research");

    const createdTasks = [];

    // Criar tasks para cada tipo usando hierarchical-task-router
    for (const taskType of taskTypes) {
      try {
        const routerResponse = await fetch(`${supabaseUrl}/functions/v1/hierarchical-task-router`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            campaign_id: campaignId,
            task_type: taskType,
            title: `${taskType.replace(/_/g, " ")} - ${brief.name}`,
            description: `Executar ${taskType} para campanha ${brief.name}`,
            context: {
              brief,
              ricardoAnalysis,
              phase: "execution"
            }
          }),
        });

        if (routerResponse.ok) {
          const routerData = await routerResponse.json();
          createdTasks.push(routerData);
          console.log(`✅ Tasks criadas para ${taskType}`);
        }
      } catch (error) {
        console.error(`❌ Erro ao criar task ${taskType}:`, error);
      }
    }

    // 4. Monitorar progresso inicial
    const { data: allTasks } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("campaign_id", campaignId);

    // 5. Atualizar campanha com sumário de execução
    await supabase
      .from("campaigns")
      .update({
        metadata: {
          ...(brief.creativeBrief && { creativeBrief: brief.creativeBrief }),
          ...(brief.budget.distribution && { budgetDistribution: brief.budget.distribution }),
          ...(brief.timeline && { timeline: brief.timeline }),
          ...(brief.kpis && { kpis: brief.kpis }),
          ricardoAnalysis,
          executionStarted: new Date().toISOString(),
          tasksCreated: allTasks?.length || 0,
        }
      })
      .eq("id", campaignId);

    console.log("✅ Campanha em execução com", allTasks?.length || 0, "tasks");

    return new Response(
      JSON.stringify({
        success: true,
        campaignId,
        executionSummary: {
          tasksCreated: allTasks?.length || 0,
          taskTypes,
          agentsInvolved: createdTasks.length,
          ricardoAnalysis,
          status: "executing",
          nextSteps: [
            "Aguardar conclusão das análises de nível 2",
            "Criação de conteúdo será iniciada automaticamente",
            "Assets serão gerados pelos especialistas de nível 3"
          ]
        },
        tasks: allTasks,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ Erro na execução da campanha:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
