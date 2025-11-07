import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface LogExecutionParams {
  supabase: SupabaseClient;
  agentId: string;
  taskId?: string;
  campaignId?: string;
  toolName: string;
  input?: any;
  output?: any;
  durationMs?: number;
  tokensUsed?: number;
  costUsd?: number;
  status: 'success' | 'failed' | 'timeout';
  errorMessage?: string;
  metadata?: any;
}

/**
 * Registra execução de ferramenta/ação do agente
 */
export async function logExecution(params: LogExecutionParams): Promise<void> {
  const {
    supabase,
    agentId,
    taskId,
    campaignId,
    toolName,
    input,
    output,
    durationMs,
    tokensUsed,
    costUsd,
    status,
    errorMessage,
    metadata
  } = params;

  try {
    await supabase.from('tool_execution_logs').insert({
      agent_id: agentId,
      task_id: taskId,
      campaign_id: campaignId,
      tool_name: toolName,
      input: input ? JSON.parse(JSON.stringify(input)) : null,
      output: output ? JSON.parse(JSON.stringify(output)) : null,
      duration_ms: durationMs,
      tokens_used: tokensUsed,
      cost_usd: costUsd,
      status,
      error_message: errorMessage,
      metadata: metadata || {}
    });
  } catch (error) {
    // Não deixar o log falhar a execução principal
    console.error('Error logging execution:', error);
  }
}

/**
 * Wrapper para executar função e registrar automaticamente
 */
export async function executeAndLog<T>(
  params: {
    supabase: SupabaseClient;
    agentId: string;
    taskId?: string;
    campaignId?: string;
    toolName: string;
    input?: any;
    metadata?: any;
  },
  fn: () => Promise<T>
): Promise<T> {
  const startTime = Date.now();
  
  try {
    const result = await fn();
    const durationMs = Date.now() - startTime;
    
    await logExecution({
      ...params,
      output: result,
      durationMs,
      status: 'success'
    });
    
    return result;
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    
    await logExecution({
      ...params,
      durationMs,
      status: 'failed',
      errorMessage: error.message || 'Unknown error'
    });
    
    throw error;
  }
}

/**
 * Calcula custo aproximado baseado em tokens e modelo
 */
export function calculateCost(tokensUsed: number, model: string): number {
  const costs: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-4-turbo': { input: 0.01 / 1000, output: 0.03 / 1000 },
    'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
    'claude-3-opus': { input: 0.015 / 1000, output: 0.075 / 1000 },
    'claude-3-sonnet': { input: 0.003 / 1000, output: 0.015 / 1000 },
    'claude-3-haiku': { input: 0.00025 / 1000, output: 0.00125 / 1000 },
    'gemini-pro': { input: 0.0005 / 1000, output: 0.0015 / 1000 }
  };

  const modelCosts = costs[model] || costs['gpt-3.5-turbo'];
  // Aproximação: assume 75% input, 25% output
  return (tokensUsed * 0.75 * modelCosts.input) + (tokensUsed * 0.25 * modelCosts.output);
}
