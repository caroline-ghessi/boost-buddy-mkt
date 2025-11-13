import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { getLLMEndpoint, getAPIKey, getHeaders, prepareAnthropicRequest, prepareGeminiRequest, isAnthropicDirect, isGeminiDirect } from "../_shared/llm-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Ferramentas de orquestração do CMO
const orchestrationTools = [
  {
    type: 'function',
    function: {
      name: 'delegate_to_agent',
      description: 'Delega uma tarefa específica para um agente da equipe Buddy AI. Use quando precisar que um especialista trabalhe em algo.',
      parameters: {
        type: 'object',
        properties: {
          agent_name: {
            type: 'string',
            enum: ['Luna Bright', 'Tracker Max', 'Honey Heart', 'Alpha Zeus', 'Bella Flow', 'Scout Parker', 'Dash Creative', 'Pixel Paws', 'Inky Scribe', 'Frame Fury', 'Byte Boss', 'Viral Vibe', 'Echo Reach', 'Cloud Paws', 'Tiny Hawk', 'Dash Data', 'Trust Guard'],
            description: 'Nome do agente especialista'
          },
          task_title: {
            type: 'string',
            description: 'Título claro da tarefa'
          },
          task_description: {
            type: 'string',
            description: 'Descrição detalhada do que precisa ser feito'
          },
          priority: {
            type: 'string',
            enum: ['low', 'medium', 'high', 'urgent'],
            description: 'Prioridade da tarefa'
          },
          dependencies: {
            type: 'array',
            items: { type: 'string' },
            description: 'IDs de outras tarefas que devem ser completadas antes desta (opcional)'
          }
        },
        required: ['agent_name', 'task_title', 'task_description', 'priority']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'create_execution_plan',
      description: 'Cria um plano de execução estruturado com múltiplas tarefas e dependências. Use no início de projetos complexos.',
      parameters: {
        type: 'object',
        properties: {
          plan_name: {
            type: 'string',
            description: 'Nome do plano de execução'
          },
          tasks: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                agent_name: { type: 'string' },
                title: { type: 'string' },
                description: { type: 'string' },
                priority: { type: 'string' },
                depends_on: { type: 'array', items: { type: 'string' } }
              }
            },
            description: 'Lista de tarefas no plano'
          }
        },
        required: ['plan_name', 'tasks']
      }
    }
  }
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, conversationId } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Get user
    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    let userId = null;
    
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }
    
    // Get Ricardo's config
    const { data: agentConfig } = await supabase
      .from('agent_configs')
      .select('*')
      .eq('name', 'Ricardo Mendes')
      .single();
    
    // Get all agents for orchestration
    const { data: allAgents } = await supabase
      .from('agent_configs')
      .select('name, agent_id, role, specialty, level')
      .order('level');
    
    const agentsContext = allAgents?.map(a => 
      `- ${a.name} (${a.agent_id}): ${a.role} - Especialidades: ${a.specialty?.join(', ')}`
    ).join('\n') || '';
    
    const systemPrompt = `${agentConfig?.system_prompt || "Você é Ricardo Mendes, CMO experiente e líder do Buddy AI."}

## 🎯 CAPACIDADES DE ORQUESTRAÇÃO

Você é o ORQUESTRADOR da equipe Buddy AI. Você pode:

1. **Delegar tarefas** para especialistas usando \`delegate_to_agent\`
2. **Criar planos de execução** complexos com \`create_execution_plan\`
3. **Coordenar múltiplos agentes** em paralelo ou sequencial

## 👥 EQUIPE DISPONÍVEL:

${agentsContext}

## 📐 QUANDO ORQUESTRAR:

- Solicitações complexas que requerem múltiplas áreas
- Projetos que precisam de especialistas diferentes
- Campanhas que envolvem pesquisa, estratégia, criação e análise

## 🎬 COMO ORQUESTRAR:

1. **Analise** o pedido do usuário
2. **Identifique** quais agentes são necessários
3. **Crie um plano** se for complexo, ou **delegue diretamente** se for simples
4. **Defina dependências** entre tarefas (quem precisa esperar quem)
5. **Acompanhe** e consolide resultados

**IMPORTANTE**: Use as ferramentas! Não apenas descreva o que fazer, DELEGUE de verdade.`;

    const lastUserMessage = messages[messages.length - 1];
    
    // Query RAG for relevant context
    let ragContext = "";
    if (lastUserMessage?.content) {
      const { data: ragData } = await supabase.functions.invoke('query-rag', {
        body: { query: lastUserMessage.content, matchCount: 3 }
      });
      
      if (ragData?.chunks?.length > 0) {
        ragContext = "\n\n=== CONTEXTO DA BASE DE CONHECIMENTO ===\n" +
          ragData.chunks.map((chunk: any) => chunk.content).join("\n\n") +
          "\n=== FIM DO CONTEXTO ===\n\n";
      }
    }

    const model = agentConfig?.llm_model || 'google/gemini-2.5-flash';
    const endpoint = getLLMEndpoint(model);
    const apiKey = getAPIKey(model);
    const headers = getHeaders(model, apiKey);

    // Prepare conversation with tools
    let conversationMessages = [
      { role: "system", content: systemPrompt + ragContext },
      ...messages,
    ];

    let requestBody: any;
    let fullEndpoint: string;

    if (isGeminiDirect(model)) {
      const geminiRequest = prepareGeminiRequest(conversationMessages);
      requestBody = {
        ...geminiRequest,
        tools: [{ functionDeclarations: orchestrationTools.map(t => t.function) }],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
        }
      };
      fullEndpoint = `${endpoint}/${model}:generateContent?key=${apiKey}`;
      
    } else if (isAnthropicDirect(model)) {
      const { system, messages: anthropicMessages } = prepareAnthropicRequest(conversationMessages);
      requestBody = {
        model: model,
        max_tokens: 4096,
        system: system,
        messages: anthropicMessages,
        tools: orchestrationTools,
        stream: false
      };
      fullEndpoint = endpoint;
      
    } else {
      // OpenAI format
      requestBody = {
        model: model,
        messages: conversationMessages,
        tools: orchestrationTools,
        stream: false,
      };
      fullEndpoint = endpoint;
    }

    // Call LLM
    const response = await fetch(fullEndpoint, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit excedido. Tente novamente em alguns segundos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos insuficientes. Adicione créditos ao workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "Erro na API de AI" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await response.json();
    
    // Process tool calls if any
    let toolCalls: any[] = [];
    let assistantMessage = '';
    
    if (isGeminiDirect(model)) {
      const candidate = result.candidates?.[0];
      const content = candidate?.content;
      
      if (content?.parts) {
        for (const part of content.parts) {
          if (part.text) {
            assistantMessage += part.text;
          }
          if (part.functionCall) {
            toolCalls.push({
              name: part.functionCall.name,
              args: part.functionCall.args
            });
          }
        }
      }
    } else if (isAnthropicDirect(model)) {
      for (const block of result.content || []) {
        if (block.type === 'text') {
          assistantMessage += block.text;
        }
        if (block.type === 'tool_use') {
          toolCalls.push({
            id: block.id,
            name: block.name,
            args: block.input
          });
        }
      }
    } else {
      // OpenAI
      const message = result.choices?.[0]?.message;
      assistantMessage = message?.content || '';
      if (message?.tool_calls) {
        toolCalls = message.tool_calls.map((tc: any) => ({
          id: tc.id,
          name: tc.function.name,
          args: JSON.parse(tc.function.arguments)
        }));
      }
    }

    // Execute tool calls
    const toolResults = [];
    if (toolCalls.length > 0 && userId) {
      console.log('🔧 Executing tool calls:', toolCalls);
      
      for (const toolCall of toolCalls) {
        try {
          if (toolCall.name === 'delegate_to_agent') {
            const { agent_name, task_title, task_description, priority } = toolCall.args;
            
            // Find agent
            const agent = allAgents?.find(a => a.name === agent_name);
            if (!agent) {
              toolResults.push({ tool: toolCall.name, error: 'Agent not found' });
              continue;
            }
            
            // Create campaign if needed (use existing or create new)
            let campaignId = conversationId; // Use conversation as campaign context
            
            // Create task
            const { data: task, error: taskError } = await supabase
              .from('agent_tasks')
              .insert({
                campaign_id: campaignId,
                agent_id: agent.agent_id,
                title: task_title,
                description: task_description,
                priority: priority,
                status: 'pending',
                assigned_by: 'cmo',
                context: { delegated_from_cmo: true }
              })
              .select()
              .single();
            
            if (taskError) {
              console.error('Error creating task:', taskError);
              toolResults.push({ tool: toolCall.name, error: taskError.message });
              continue;
            }
            
            // Send communication
            await supabase.from('agent_communications').insert({
              from_agent: 'cmo',
              to_agent: agent.agent_id,
              type: 'delegation',
              content: `Nova tarefa delegada: ${task_title}\n\n${task_description}`,
              task_id: task.id,
              campaign_id: campaignId,
              requires_response: true,
              context: { priority }
            });
            
            // Create job
            await supabase.from('agent_jobs').insert({
              agent_id: agent.agent_id,
              task_id: task.id,
              campaign_id: campaignId,
              job_type: 'task_execution',
              priority: priority === 'urgent' ? 10 : priority === 'high' ? 7 : priority === 'medium' ? 5 : 3,
              payload: { task_id: task.id },
              status: 'pending'
            });
            
            toolResults.push({
              tool: toolCall.name,
              result: `✅ Tarefa "${task_title}" delegada para ${agent_name} (ID: ${task.id})`
            });
            
          } else if (toolCall.name === 'create_execution_plan') {
            const { plan_name, tasks } = toolCall.args;
            
            const createdTasks = [];
            
            for (const taskDef of tasks) {
              const agent = allAgents?.find(a => a.name === taskDef.agent_name);
              if (!agent) continue;
              
              const { data: task } = await supabase
                .from('agent_tasks')
                .insert({
                  campaign_id: conversationId,
                  agent_id: agent.agent_id,
                  title: taskDef.title,
                  description: taskDef.description,
                  priority: taskDef.priority || 'medium',
                  status: 'pending',
                  assigned_by: 'cmo',
                  context: { 
                    plan_name,
                    dependencies: taskDef.depends_on || []
                  }
                })
                .select()
                .single();
              
              if (task) {
                await supabase.from('agent_communications').insert({
                  from_agent: 'cmo',
                  to_agent: agent.agent_id,
                  type: 'delegation',
                  content: `Tarefa do plano "${plan_name}": ${taskDef.title}`,
                  task_id: task.id,
                  campaign_id: conversationId,
                  requires_response: true
                });
                
                await supabase.from('agent_jobs').insert({
                  agent_id: agent.agent_id,
                  task_id: task.id,
                  campaign_id: conversationId,
                  job_type: 'task_execution',
                  priority: taskDef.priority === 'urgent' ? 10 : 5,
                  payload: { task_id: task.id },
                  status: 'pending'
                });
                
                createdTasks.push(`${taskDef.agent_name}: ${taskDef.title}`);
              }
            }
            
            toolResults.push({
              tool: toolCall.name,
              result: `✅ Plano "${plan_name}" criado com ${createdTasks.length} tarefas:\n${createdTasks.join('\n')}`
            });
          }
        } catch (error) {
          console.error('Error executing tool:', error);
          toolResults.push({
            tool: toolCall.name,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Build final response
    let finalMessage = assistantMessage;
    
    if (toolResults.length > 0) {
      finalMessage += '\n\n---\n\n';
      finalMessage += toolResults.map(r => 
        r.error ? `❌ ${r.tool}: ${r.error}` : `${r.result}`
      ).join('\n\n');
    }

    // Save conversation if conversationId exists
    if (conversationId && userId) {
      await supabase.from('cmo_conversations').insert([
        {
          id: conversationId,
          user_id: userId,
          role: 'user',
          content: lastUserMessage.content
        },
        {
          id: crypto.randomUUID(),
          user_id: userId,
          role: 'assistant',
          content: finalMessage,
          campaign_id: conversationId
        }
      ]);
    }

    return new Response(JSON.stringify({ 
      message: finalMessage,
      tool_calls: toolCalls.length,
      delegations: toolResults.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("cmo-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
