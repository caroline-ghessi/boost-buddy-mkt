import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

export interface MemoryItem {
  key: string;
  value: any;
  type: 'fact' | 'decision' | 'insight' | 'data' | 'context';
  relevanceScore?: number;
  accessibleTo?: string[];
  expiresAt?: Date;
}

/**
 * Armazena um item na memória compartilhada
 */
export async function storeMemory(
  supabase: SupabaseClient,
  campaignId: string,
  agentId: string,
  memory: MemoryItem
) {
  try {
    const { data, error } = await supabase
      .from('agent_shared_memory')
      .insert({
        campaign_id: campaignId,
        memory_key: memory.key,
        memory_value: memory.value,
        memory_type: memory.type,
        created_by_agent: agentId,
        accessible_to_agents: memory.accessibleTo,
        expires_at: memory.expiresAt?.toISOString(),
        relevance_score: memory.relevanceScore || 1.0
      })
      .select()
      .single();

    if (error) {
      console.error('Error storing memory:', error);
      throw error;
    }

    console.log(`✓ Memory stored: ${memory.key} by ${agentId}`);
    return data;
  } catch (error) {
    console.error('Failed to store memory:', error);
    // Não falhar a task inteira por erro de memória
    return null;
  }
}

/**
 * Recupera memórias da campanha
 */
export async function retrieveMemory(
  supabase: SupabaseClient,
  campaignId: string,
  agentId: string,
  filters?: {
    keys?: string[];
    types?: string[];
    minRelevance?: number;
  }
) {
  try {
    let query = supabase
      .from('agent_shared_memory')
      .select('*')
      .eq('campaign_id', campaignId)
      .or(`accessible_to_agents.is.null,accessible_to_agents.cs.{${agentId}}`)
      .or('expires_at.is.null,expires_at.gt.now()')
      .order('relevance_score', { ascending: false });

    if (filters?.keys?.length) {
      query = query.in('memory_key', filters.keys);
    }

    if (filters?.types?.length) {
      query = query.in('memory_type', filters.types);
    }

    if (filters?.minRelevance) {
      query = query.gte('relevance_score', filters.minRelevance);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error retrieving memory:', error);
      return [];
    }

    // Incrementar contador de acesso (fazer em background, não bloquear)
    if (data && data.length > 0) {
      const ids = data.map((m: any) => m.id);
      // Atualizar acesso em background
      supabase
        .from('agent_shared_memory')
        .update({
          last_accessed_at: new Date().toISOString()
        })
        .in('id', ids)
        .then(() => console.log(`✓ Updated access tracking for ${ids.length} memories`));
      
      console.log(`✓ Retrieved ${data.length} memories for ${agentId}`);
    }

    return data || [];
  } catch (error) {
    console.error('Failed to retrieve memory:', error);
    return [];
  }
}

/**
 * Atualiza uma memória existente
 */
export async function updateMemory(
  supabase: SupabaseClient,
  memoryId: string,
  updates: Partial<MemoryItem>
) {
  try {
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (updates.value !== undefined) {
      updateData.memory_value = updates.value;
    }

    if (updates.relevanceScore !== undefined) {
      updateData.relevance_score = updates.relevanceScore;
    }

    const { data, error } = await supabase
      .from('agent_shared_memory')
      .update(updateData)
      .eq('id', memoryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Failed to update memory:', error);
    return null;
  }
}

/**
 * Formata memórias para inclusão no contexto do LLM
 */
export function formatMemoryForContext(memories: any[]): string {
  if (!memories.length) return '';

  const grouped = memories.reduce((acc: Record<string, any[]>, m: any) => {
    if (!acc[m.memory_type]) acc[m.memory_type] = [];
    acc[m.memory_type].push(m);
    return acc;
  }, {} as Record<string, any[]>);

  let context = '\n## 🧠 MEMÓRIA COMPARTILHADA DA CAMPANHA:\n\n';

  if (grouped.fact) {
    context += '### 📌 Fatos Estabelecidos:\n';
    grouped.fact.forEach((m: any) => {
      context += `- **${m.memory_key}**: ${JSON.stringify(m.memory_value)}\n`;
    });
    context += '\n';
  }

  if (grouped.decision) {
    context += '### ✅ Decisões Tomadas:\n';
    grouped.decision.forEach((m: any) => {
      context += `- **${m.memory_key}** (por ${m.created_by_agent}): ${JSON.stringify(m.memory_value)}\n`;
    });
    context += '\n';
  }

  if (grouped.insight) {
    context += '### 💡 Insights Importantes:\n';
    grouped.insight.forEach((m: any) => {
      context += `- **${m.memory_key}**: ${JSON.stringify(m.memory_value)}\n`;
    });
    context += '\n';
  }

  if (grouped.data) {
    context += '### 📊 Dados Relevantes:\n';
    grouped.data.forEach((m: any) => {
      context += `- **${m.memory_key}**: ${JSON.stringify(m.memory_value)}\n`;
    });
    context += '\n';
  }

  if (grouped.context) {
    context += '### 🔍 Contexto Adicional:\n';
    grouped.context.forEach((m: any) => {
      context += `- **${m.memory_key}**: ${JSON.stringify(m.memory_value)}\n`;
    });
    context += '\n';
  }

  return context;
}
