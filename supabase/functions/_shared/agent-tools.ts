import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { sendMessage, sendAndWaitForResponse } from './agent-messenger.ts';
import { storeMemory } from './memory-manager.ts';

/**
 * Definições das ferramentas disponíveis para os agentes
 */
export const agentTools = [
  {
    type: 'function',
    function: {
      name: 'ask_agent',
      description: 'Faz uma pergunta para outro agente e aguarda resposta. Use quando precisar de expertise específica de outro membro da equipe.',
      parameters: {
        type: 'object',
        properties: {
          target_agent: {
            type: 'string',
            enum: ['camila', 'thiago', 'ana', 'renata', 'pedro', 'marina', 'lucas'],
            description: 'O agente que deve responder a pergunta. Escolha baseado na expertise: Camila (Analytics), Thiago (Pesquisa), Ana (Insights), Renata (Estratégia), Pedro (Google Ads), Marina (Meta Ads), Lucas (Social Media)'
          },
          question: {
            type: 'string',
            description: 'A pergunta clara e específica que você quer fazer ao agente'
          },
          context: {
            type: 'string',
            description: 'Contexto adicional relevante para a pergunta (opcional)'
          }
        },
        required: ['target_agent', 'question']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'store_insight',
      description: 'Armazena um insight importante na memória compartilhada da campanha para que outros agentes possam acessá-lo. Use para descobertas, decisões ou dados importantes.',
      parameters: {
        type: 'object',
        properties: {
          key: {
            type: 'string',
            description: 'Identificador único e descritivo para o insight (ex: "target_audience_analysis", "budget_recommendation")'
          },
          value: {
            type: 'object',
            description: 'O conteúdo do insight. Pode conter qualquer estrutura de dados relevante.'
          },
          type: {
            type: 'string',
            enum: ['insight', 'decision', 'data', 'fact'],
            description: 'Tipo do conteúdo sendo armazenado'
          },
          relevance: {
            type: 'number',
            description: 'Score de relevância de 0 a 1 (quanto mais alto, mais importante)',
            minimum: 0,
            maximum: 1
          },
          summary: {
            type: 'string',
            description: 'Resumo breve do insight para facilitar a recuperação'
          }
        },
        required: ['key', 'value', 'type']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'delegate_task',
      description: 'Delega uma subtarefa específica para outro agente. Use quando uma tarefa requer expertise de outro membro da equipe.',
      parameters: {
        type: 'object',
        properties: {
          target_agent: {
            type: 'string',
            enum: ['camila', 'thiago', 'ana', 'renata', 'pedro', 'marina', 'lucas'],
            description: 'O agente que deve executar a tarefa'
          },
          task_title: {
            type: 'string',
            description: 'Título claro da tarefa a ser delegada'
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
          context: {
            type: 'object',
            description: 'Contexto adicional relevante para a tarefa'
          }
        },
        required: ['target_agent', 'task_title', 'task_description', 'priority']
      }
    }
  }
];

/**
 * Executa uma ferramenta chamada pelo LLM
 */
export async function executeAgentTool(
  supabase: SupabaseClient,
  toolName: string,
  toolArgs: any,
  context: {
    agentId: string;
    taskId: string;
    campaignId: string;
  }
): Promise<{ success: boolean; result: any; error?: string }> {
  console.log(`Executing tool: ${toolName}`, toolArgs);

  try {
    switch (toolName) {
      case 'ask_agent': {
        const { target_agent, question, context: questionContext } = toolArgs;
        
        const fullQuestion = questionContext 
          ? `${question}\n\nContexto: ${questionContext}`
          : question;

        console.log(`Asking ${target_agent}: ${fullQuestion}`);

        try {
          // Enviar pergunta e aguardar resposta (timeout 30s)
          const response = await sendAndWaitForResponse(
            {
              supabase,
              fromAgent: context.agentId,
              toAgent: target_agent,
              content: fullQuestion,
              type: 'question',
              campaignId: context.campaignId,
              relatedTaskId: context.taskId,
              metadata: {
                asked_at: new Date().toISOString()
              }
            },
            { timeoutMs: 30000, pollIntervalMs: 2000 }
          );

          return {
            success: true,
            result: {
              agent: target_agent,
              question: question,
              answer: response
            }
          };
        } catch (error) {
          console.error('Error asking agent:', error);
          return {
            success: false,
            result: null,
            error: error instanceof Error ? error.message : 'Failed to get response from agent'
          };
        }
      }

      case 'store_insight': {
        const { key, value, type, relevance, summary } = toolArgs;
        
        await storeMemory(supabase, context.campaignId, context.agentId, {
          key: key,
          value: {
            ...value,
            summary: summary || '',
            stored_by: context.agentId,
            stored_at: new Date().toISOString(),
            related_task: context.taskId
          },
          type: type,
          relevanceScore: relevance || 0.7
        });

        return {
          success: true,
          result: {
            stored: true,
            key: key,
            type: type
          }
        };
      }

      case 'delegate_task': {
        const { target_agent, task_title, task_description, priority, context: taskContext } = toolArgs;

        // Criar nova tarefa para o agente alvo
        const { data: newTask, error: taskError } = await supabase
          .from('agent_tasks')
          .insert({
            agent_id: target_agent,
            campaign_id: context.campaignId,
            title: task_title,
            description: task_description,
            priority: priority,
            status: 'pending',
            context: {
              ...taskContext,
              delegated_by: context.agentId,
              parent_task_id: context.taskId,
              delegated_at: new Date().toISOString()
            }
          })
          .select()
          .single();

        if (taskError) {
          throw new Error(`Failed to create delegated task: ${taskError.message}`);
        }

        // Enviar mensagem informando sobre delegação
        await sendMessage({
          supabase,
          fromAgent: context.agentId,
          toAgent: target_agent,
          content: `Nova tarefa delegada: ${task_title}`,
          type: 'delegation',
          campaignId: context.campaignId,
          relatedTaskId: newTask.id,
          metadata: {
            parent_task_id: context.taskId,
            priority: priority
          }
        });

        return {
          success: true,
          result: {
            delegated: true,
            task_id: newTask.id,
            assigned_to: target_agent,
            title: task_title
          }
        };
      }

      default:
        return {
          success: false,
          result: null,
          error: `Unknown tool: ${toolName}`
        };
    }
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return {
      success: false,
      result: null,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Prepara as tools para diferentes formatos de API
 */
export function prepareToolsForAPI(provider: string, tools: any[]) {
  if (provider === 'anthropic' || provider.startsWith('claude')) {
    // Anthropic format
    return tools.map(tool => ({
      name: tool.function.name,
      description: tool.function.description,
      input_schema: tool.function.parameters
    }));
  }
  
  // OpenAI format (default)
  return tools;
}
