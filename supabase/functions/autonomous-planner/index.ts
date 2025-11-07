import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildAgentContext } from '../_shared/context-builder.ts';
import { logExecution } from '../_shared/execution-logger.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PerceptionEvent {
  event_type: 'new_competitor_data' | 'metrics_alert' | 'campaign_created' | 'daily_review' | 'performance_degradation';
  entity_id?: string; // campaign_id, competitor_name, etc.
  user_id: string;
  metadata?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiKey = Deno.env.get('OPENAI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const event: PerceptionEvent = await req.json();
    
    console.log(`[Autonomous Planner] Processing event:`, event);

    // 1. PERCEPTION: Gather context about the event
    const perceptionStartTime = Date.now();
    const contextData = await buildAgentContext({
      userId: event.user_id,
      taskType: event.event_type,
      campaignId: event.entity_id,
      includeRAG: true,
      includeMetrics: true,
      includeCompetitors: true,
      includeSocialMedia: true
    }, supabase);

    await logExecution({
      supabase,
      agentId: 'autonomous-planner',
      campaignId: event.entity_id,
      toolName: 'perception',
      input: event,
      output: { context_gathered: 'success' },
      durationMs: Date.now() - perceptionStartTime,
      status: 'success'
    });

    // 2. PLANNING: Analyze and decide what actions are needed
    const planningStartTime = Date.now();
    
    const systemPrompt = `Você é o Planejador Autônomo do Buddy AI, responsável por analisar eventos e decidir ações proativas.

# SEU PAPEL
Você analisa situações e decide quais tarefas os agentes da matilha devem executar proativamente.

# EVENTO ATUAL
Tipo: ${event.event_type}
Metadados: ${JSON.stringify(event.metadata || {}, null, 2)}

# CONTEXTO DISPONÍVEL
${contextData.fullContext}

# TAREFAS DISPONÍVEIS
Você pode criar tarefas dos seguintes tipos:
- market_research: Pesquisa de mercado e análise de tendências
- competitive_intelligence: Análise de competidores
- data_analysis: Análise de métricas e performance
- brand_strategy: Estratégia de marca
- content_creation: Criação de conteúdo
- paid_media: Estratégias de mídia paga
- organic_growth: Crescimento orgânico
- quality_assurance: Garantia de qualidade

# INSTRUÇÕES
1. Analise o evento e o contexto
2. Identifique oportunidades ou problemas que exigem ação
3. Decida quais tarefas devem ser criadas (0 a 3 tarefas)
4. Para cada tarefa, defina:
   - task_type: tipo da tarefa
   - title: título claro e acionável
   - description: descrição detalhada do que precisa ser feito
   - priority: high, medium, low
   - reason: por que essa tarefa é necessária agora

# RESPOSTA
Responda APENAS com JSON válido no formato:
{
  "analysis": "Sua análise breve da situação (1-2 frases)",
  "tasks": [
    {
      "task_type": "tipo_da_tarefa",
      "title": "Título da tarefa",
      "description": "Descrição detalhada",
      "priority": "high|medium|low",
      "reason": "Justificativa"
    }
  ]
}

Se nenhuma ação for necessária, retorne tasks como array vazio.`;

    const llmResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Analise o evento e decida as ações necessárias.' }
        ],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!llmResponse.ok) {
      throw new Error(`OpenAI API error: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    const responseText = llmData.choices[0].message.content;
    
    // Parse JSON response
    let planningResult;
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = responseText.replace(/```json\n?|\n?```/g, '').trim();
      planningResult = JSON.parse(cleanedResponse);
    } catch (parseError) {
      console.error('Failed to parse LLM response:', responseText);
      throw new Error('Invalid JSON response from planner');
    }

    const tokensUsed = llmData.usage?.total_tokens || 0;

    await logExecution({
      supabase,
      agentId: 'autonomous-planner',
      campaignId: event.entity_id,
      toolName: 'planning_decision',
      input: { event_type: event.event_type },
      output: planningResult,
      durationMs: Date.now() - planningStartTime,
      tokensUsed,
      costUsd: (tokensUsed * 0.015) / 1000, // gpt-4o cost
      status: 'success'
    });

    console.log(`[Autonomous Planner] Decision:`, planningResult);

    // 3. ACTION: Create tasks and enqueue jobs
    const createdTasks = [];
    const actionStartTime = Date.now();

    if (planningResult.tasks && planningResult.tasks.length > 0) {
      for (const taskPlan of planningResult.tasks) {
        try {
          // Route task through hierarchical-task-router
          const { data: routingResult, error: routingError } = await supabase.functions.invoke(
            'hierarchical-task-router',
            {
              body: {
                campaign_id: event.entity_id,
                task_type: taskPlan.task_type,
                title: taskPlan.title,
                description: taskPlan.description,
                priority: taskPlan.priority,
                assigned_by: 'autonomous-planner',
                context: {
                  event_type: event.event_type,
                  reason: taskPlan.reason,
                  autonomous: true
                }
              }
            }
          );

          if (routingError) {
            console.error(`Error routing task:`, routingError);
            continue;
          }

          createdTasks.push({
            task_plan: taskPlan,
            routing_result: routingResult
          });

          console.log(`[Autonomous Planner] Created task: ${taskPlan.title}`);
        } catch (error) {
          console.error(`Error creating task:`, error);
        }
      }
    }

    await logExecution({
      supabase,
      agentId: 'autonomous-planner',
      campaignId: event.entity_id,
      toolName: 'action_execution',
      input: { tasks_planned: planningResult.tasks?.length || 0 },
      output: { tasks_created: createdTasks.length },
      durationMs: Date.now() - actionStartTime,
      status: 'success'
    });

    const totalDuration = Date.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        event_type: event.event_type,
        analysis: planningResult.analysis,
        tasks_planned: planningResult.tasks?.length || 0,
        tasks_created: createdTasks.length,
        duration_ms: totalDuration,
        details: createdTasks
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error: any) {
    console.error('[Autonomous Planner] Error:', error);
    
    return new Response(
      JSON.stringify({ 
        error: error.message,
        stack: error.stack 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
