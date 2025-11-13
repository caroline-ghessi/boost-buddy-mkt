import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { buildAgentContext } from '../_shared/context-builder.ts';
import { getLLMEndpoint, getAPIKey, getHeaders, prepareAnthropicRequest, prepareGeminiRequest, isAnthropicDirect, isGeminiDirect } from '../_shared/llm-router.ts';
import { logExecution, calculateCost } from '../_shared/execution-logger.ts';
import { retrieveMemory, storeMemory, formatMemoryForContext } from '../_shared/memory-manager.ts';

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
    
    // Log context building
    const contextStartTime = Date.now();
    const contextData = await buildAgentContext(contextOptions, supabase);
    const contextDuration = Date.now() - contextStartTime;

    // Carregar memória compartilhada da campanha
    console.log('Loading shared memory for campaign:', task.campaign_id);
    const sharedMemories = await retrieveMemory(
      supabase,
      task.campaign_id,
      task.agent_id,
      { minRelevance: 0.5 }
    );
    const memoryContext = formatMemoryForContext(sharedMemories);
    
    await logExecution({
      supabase,
      agentId: task.agent_id,
      taskId: task.id,
      campaignId: task.campaign_id,
      toolName: 'context_build',
      input: contextOptions,
      output: {
        rag_chunks: contextData.ragContext ? 'included' : 'none',
        metrics: contextData.metricsContext ? 'included' : 'none',
        competitors: contextData.competitorsContext ? 'included' : 'none',
        social_media: contextData.socialMediaContext ? 'included' : 'none'
      },
      durationMs: contextDuration,
      status: 'success'
    });

    // Prepare messages for LLM
    const systemPrompt = `${agentConfig.system_prompt}

${contextData.fullContext}
${memoryContext}

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
- Use insights da memória compartilhada se disponíveis
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

    const llmStartTime = Date.now();
    let llmResponse;
    let llmData;
    let agentResponse = '';
    let tokensUsed = 0;
    
    try {
      llmResponse = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestBody),
      });

      if (!llmResponse.ok) {
        const errorText = await llmResponse.text();
        console.error('LLM API error:', llmResponse.status, errorText);
        
        // Log failed LLM call
        await logExecution({
          supabase,
          agentId: task.agent_id,
          taskId: task.id,
          campaignId: task.campaign_id,
          toolName: 'llm_call',
          input: { model, prompt_length: systemPrompt.length + userMessage.length },
          durationMs: Date.now() - llmStartTime,
          status: 'failed',
          errorMessage: `HTTP ${llmResponse.status}: ${errorText}`,
          metadata: { model, endpoint }
        });
        
        throw new Error(`LLM API error: ${llmResponse.status}`);
      }

      llmData = await llmResponse.json();
      
      // Extract response and tokens based on model type
      if (isGeminiDirect(model)) {
        agentResponse = llmData.candidates?.[0]?.content?.parts?.[0]?.text || '';
        tokensUsed = llmData.usageMetadata?.totalTokenCount || 0;
      } else if (isAnthropicDirect(model)) {
        agentResponse = llmData.content?.[0]?.text || '';
        tokensUsed = (llmData.usage?.input_tokens || 0) + (llmData.usage?.output_tokens || 0);
      } else {
        agentResponse = llmData.choices?.[0]?.message?.content || '';
        tokensUsed = llmData.usage?.total_tokens || 0;
      }

      if (!agentResponse) {
        throw new Error('No response from LLM');
      }
      
      const llmDuration = Date.now() - llmStartTime;
      const costUsd = calculateCost(tokensUsed, model);
      
      // Log successful LLM call
      await logExecution({
        supabase,
        agentId: task.agent_id,
        taskId: task.id,
        campaignId: task.campaign_id,
        toolName: 'llm_call',
        input: { 
          model, 
          prompt_length: systemPrompt.length + userMessage.length,
          temperature: agentConfig.temperature,
          max_tokens: agentConfig.max_tokens
        },
        output: { 
          response_length: agentResponse.length,
          model_used: model
        },
        durationMs: llmDuration,
        tokensUsed,
        costUsd,
        status: 'success',
        metadata: { endpoint }
      });
      
    } catch (error: any) {
      // Log failed LLM call
      await logExecution({
        supabase,
        agentId: task.agent_id,
        taskId: task.id,
        campaignId: task.campaign_id,
        toolName: 'llm_call',
        input: { model, prompt_length: systemPrompt.length + userMessage.length },
        durationMs: Date.now() - llmStartTime,
        status: 'failed',
        errorMessage: error.message,
        metadata: { model, endpoint }
      });
      throw error;
    }

    // Extrair e salvar insights importantes na memória compartilhada
    if (agentResponse && agentResponse.length > 100) {
      console.log('Storing insights in shared memory...');
      await storeMemory(supabase, task.campaign_id, task.agent_id, {
        key: `${task.agent_id}_insight_${Date.now()}`,
        value: {
          task_id: task.id,
          task_title: task.title,
          summary: agentResponse.substring(0, 500), // Primeiros 500 chars
          full_response_length: agentResponse.length
        },
        type: 'insight',
        relevanceScore: 0.8
      });
    }

    // Save result
    const result = {
      response: agentResponse,
      context_used: {
        rag_chunks: contextData.ragContext ? 'yes' : 'no',
        metrics_included: contextData.metricsContext ? 'yes' : 'no',
        competitors_included: contextData.competitorsContext ? 'yes' : 'no',
        social_media_included: contextData.socialMediaContext ? 'yes' : 'no',
        shared_memory_used: sharedMemories.length > 0 ? 'yes' : 'no',
        shared_memory_count: sharedMemories.length
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
