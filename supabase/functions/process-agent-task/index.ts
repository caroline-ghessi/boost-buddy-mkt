import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildAgentContext } from '../_shared/context-builder.ts';
import { getLLMEndpoint, getAPIKey, getHeaders, prepareAnthropicRequest, prepareGeminiRequest, isAnthropicDirect, isGeminiDirect } from '../_shared/llm-router.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { taskId } = await req.json();

    if (!taskId) {
      throw new Error('taskId is required');
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('agent_tasks')
      .select(`
        *,
        campaigns (
          id,
          name,
          user_id,
          objectives,
          channels,
          target_audience,
          budget_total,
          metadata
        )
      `)
      .eq('id', taskId)
      .single();

    if (taskError || !task) {
      throw new Error('Task not found');
    }

    // Check if already processing or completed
    if (task.status === 'in_progress' || task.status === 'completed') {
      return new Response(
        JSON.stringify({ 
          message: 'Task already processed or in progress',
          status: task.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update status to in_progress
    await supabase
      .from('agent_tasks')
      .update({ 
        status: 'in_progress',
        started_at: new Date().toISOString()
      })
      .eq('id', taskId);

    console.log(`Processing task ${taskId} for agent ${task.agent_id}`);

    // Fetch agent configuration
    const { data: agentConfig, error: agentError } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('agent_id', task.agent_id)
      .single();

    if (agentError || !agentConfig) {
      throw new Error(`Agent configuration not found for ${task.agent_id}`);
    }

    // Map agent to preferred categories
    const agentCategoryMap: Record<string, { priority: string[], secondary: string[] }> = {
      'camila': {
        priority: ['Analytics', 'Google Ads', 'Meta Ads'],
        secondary: ['Pesquisa de Mercado']
      },
      'thiago': {
        priority: ['Análise Competitiva', 'Pesquisa de Mercado'],
        secondary: ['Social Media']
      },
      'ana': {
        priority: ['Pesquisa de Mercado', 'Análise Competitiva'],
        secondary: ['Analytics', 'Social Media']
      },
      'renata': {
        priority: ['Diretrizes de Marca', 'Empresa', 'Estratégia de Conteúdo'],
        secondary: ['Social Media']
      },
      'pedro': {
        priority: ['Google Ads', 'SEO'],
        secondary: ['Diretrizes de Marca', 'Estratégia de Conteúdo']
      },
      'marina': {
        priority: ['Meta Ads'],
        secondary: ['Diretrizes de Marca', 'Estratégia de Conteúdo']
      },
      'lucas': {
        priority: ['Social Media', 'Estratégia de Conteúdo'],
        secondary: ['Diretrizes de Marca']
      }
    };

    const agentId = task.agent_id.toLowerCase();
    const categoryPrefs = agentCategoryMap[agentId] || { priority: [], secondary: [] };

    // Build enriched context with category filtering
    const campaign = task.campaigns as any;
    const contextOptions = {
      userId: campaign.user_id,
      taskType: task.context?.task_type || 'general',
      campaignId: task.campaign_id,
      query: `${task.title} ${task.description}`,
      includeRAG: true,
      includeMetrics: true,
      includeCompetitors: true,
      includeSocialMedia: true,
      preferredCategories: categoryPrefs.priority.length > 0 
        ? categoryPrefs.priority 
        : undefined,
    };

    console.log('Building context for task:', contextOptions);
    const contextData = await buildAgentContext(contextOptions, supabase);

    // Prepare messages for LLM
    const systemPrompt = `${agentConfig.system_prompt}

${contextData.fullContext}

# INSTRUÇÕES PARA ESTA TAREFA:
Tarefa: ${task.title}
Descrição: ${task.description}
Prioridade: ${task.priority}

Contexto Adicional: ${JSON.stringify(task.context || {}, null, 2)}

**Importante**: Use os dados fornecidos acima para enriquecer sua análise. Sempre que possível:
- Cite métricas específicas dos anúncios
- Compare com dados de competidores
- Referencie conhecimento da base RAG
- Considere tendências das redes sociais
- Baseie recomendações em dados reais, não em suposições`;

    const userMessage = `Execute a seguinte tarefa:

**${task.title}**

${task.description}

Forneça uma resposta detalhada, acionável e baseada nos dados disponíveis.`;

    // Call LLM based on configured model
    const model = agentConfig.llm_model || 'gpt-4';
    const endpoint = getLLMEndpoint(model);
    const apiKey = getAPIKey(model);
    const headers = getHeaders(model, apiKey);

    let requestBody: any;

    if (isGeminiDirect(model)) {
      const prepared = prepareGeminiRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);
      requestBody = {
        ...prepared,
        generationConfig: {
          temperature: agentConfig.temperature || 0.7,
          maxOutputTokens: agentConfig.max_tokens || 2000,
        }
      };
    } else if (isAnthropicDirect(model)) {
      const prepared = prepareAnthropicRequest([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ]);
      requestBody = {
        model,
        max_tokens: agentConfig.max_tokens || 2000,
        temperature: agentConfig.temperature || 0.7,
        ...prepared
      };
    } else {
      // OpenAI-compatible
      requestBody = {
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: agentConfig.temperature || 0.7,
        max_tokens: agentConfig.max_tokens || 2000,
      };
    }

    console.log(`Calling LLM: ${model} at ${endpoint}`);

    const llmResponse = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error('LLM API error:', llmResponse.status, errorText);
      throw new Error(`LLM API error: ${llmResponse.status}`);
    }

    const llmData = await llmResponse.json();
    
    // Extract response based on model type
    let agentResponse = '';
    if (isGeminiDirect(model)) {
      agentResponse = llmData.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } else if (isAnthropicDirect(model)) {
      agentResponse = llmData.content?.[0]?.text || '';
    } else {
      agentResponse = llmData.choices?.[0]?.message?.content || '';
    }

    if (!agentResponse) {
      throw new Error('No response from LLM');
    }

    // Save result
    const result = {
      response: agentResponse,
      context_used: {
        rag_chunks: contextData.ragContext ? 'yes' : 'no',
        metrics_included: contextData.metricsContext ? 'yes' : 'no',
        competitors_included: contextData.competitorsContext ? 'yes' : 'no',
        social_media_included: contextData.socialMediaContext ? 'yes' : 'no',
      },
      model_used: model,
      processed_at: new Date().toISOString(),
    };

    await supabase
      .from('agent_tasks')
      .update({
        status: 'completed',
        result: result,
        completed_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    console.log(`Task ${taskId} completed successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        taskId,
        result,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error processing task:', error);
    
    // Try to update task status to failed if we have taskId
    try {
      const { taskId } = await req.json();
      if (taskId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);
        
        await supabase
          .from('agent_tasks')
          .update({
            status: 'failed',
            result: { error: error.message },
          })
          .eq('id', taskId);
      }
    } catch (updateError) {
      console.error('Error updating task status:', updateError);
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
