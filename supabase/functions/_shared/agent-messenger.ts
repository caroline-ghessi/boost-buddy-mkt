import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface SendMessageParams {
  supabase: SupabaseClient;
  fromAgent: string;
  toAgent: string;
  content: string;
  type: 'question' | 'response' | 'info' | 'delegation';
  campaignId?: string;
  relatedTaskId?: string;
  parentMessageId?: string;
  metadata?: any;
}

interface MessageResponse {
  messageId: string;
  status: 'sent' | 'waiting' | 'responded';
}

/**
 * Envia uma mensagem de um agente para outro
 */
export async function sendMessage(params: SendMessageParams): Promise<MessageResponse> {
  const {
    supabase,
    fromAgent,
    toAgent,
    content,
    type,
    campaignId,
    relatedTaskId,
    parentMessageId,
    metadata
  } = params;

  const { data, error } = await supabase
    .from('agent_communications')
    .insert({
      from_agent: fromAgent,
      to_agent: toAgent,
      content,
      type,
      campaign_id: campaignId,
      related_task_id: relatedTaskId,
      parent_message_id: parentMessageId,
      status: 'sent',
      metadata: metadata || {}
    })
    .select()
    .single();

  if (error) {
    console.error('Error sending message:', error);
    throw new Error(`Failed to send message: ${error.message}`);
  }

  return {
    messageId: data.id,
    status: data.status as 'sent' | 'waiting' | 'responded'
  };
}

/**
 * Envia uma pergunta e aguarda resposta (polling)
 */
export async function sendAndWaitForResponse(
  params: SendMessageParams,
  options: {
    timeoutMs?: number;
    pollIntervalMs?: number;
  } = {}
): Promise<string> {
  const { timeoutMs = 60000, pollIntervalMs = 2000 } = options;

  // Enviar mensagem com status 'waiting'
  const { data: message, error: sendError } = await params.supabase
    .from('agent_communications')
    .insert({
      from_agent: params.fromAgent,
      to_agent: params.toAgent,
      content: params.content,
      type: params.type,
      campaign_id: params.campaignId,
      related_task_id: params.relatedTaskId,
      parent_message_id: params.parentMessageId,
      status: 'waiting',
      metadata: params.metadata || {}
    })
    .select()
    .single();

  if (sendError) {
    console.error('Error sending message:', sendError);
    throw new Error(`Failed to send message: ${sendError.message}`);
  }

  const messageId = message.id;
  const startTime = Date.now();

  // Polling para aguardar resposta
  while (Date.now() - startTime < timeoutMs) {
    // Buscar respostas para esta mensagem
    const { data: responses, error: responseError } = await params.supabase
      .from('agent_communications')
      .select('*')
      .eq('parent_message_id', messageId)
      .eq('type', 'response')
      .order('created_at', { ascending: false })
      .limit(1);

    if (responseError) {
      console.error('Error checking for response:', responseError);
      throw new Error(`Failed to check for response: ${responseError.message}`);
    }

    if (responses && responses.length > 0) {
      // Marcar mensagem original como respondida
      await params.supabase
        .from('agent_communications')
        .update({ status: 'responded' })
        .eq('id', messageId);

      return responses[0].content;
    }

    // Aguardar antes de próxima verificação
    await new Promise(resolve => setTimeout(resolve, pollIntervalMs));
  }

  // Timeout - marcar como timeout
  await params.supabase
    .from('agent_communications')
    .update({ status: 'timeout' })
    .eq('id', messageId);

  throw new Error('Timeout waiting for response');
}

/**
 * Busca perguntas pendentes para um agente
 */
export async function getPendingQuestions(
  supabase: SupabaseClient,
  agentId: string,
  campaignId?: string
): Promise<Array<{
  id: string;
  from_agent: string;
  content: string;
  type: string;
  campaign_id: string | null;
  related_task_id: string | null;
  created_at: string;
  metadata: any;
}>> {
  let query = supabase
    .from('agent_communications')
    .select('*')
    .eq('to_agent', agentId)
    .eq('type', 'question')
    .in('status', ['sent', 'waiting'])
    .order('created_at', { ascending: true });

  if (campaignId) {
    query = query.eq('campaign_id', campaignId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching pending questions:', error);
    throw new Error(`Failed to fetch pending questions: ${error.message}`);
  }

  return data || [];
}

/**
 * Responde a uma mensagem
 */
export async function respondToMessage(
  supabase: SupabaseClient,
  messageId: string,
  fromAgent: string,
  responseContent: string,
  metadata?: any
): Promise<void> {
  // Buscar mensagem original
  const { data: originalMessage, error: fetchError } = await supabase
    .from('agent_communications')
    .select('*')
    .eq('id', messageId)
    .single();

  if (fetchError) {
    console.error('Error fetching original message:', fetchError);
    throw new Error(`Failed to fetch original message: ${fetchError.message}`);
  }

  // Criar resposta
  const { error: responseError } = await supabase
    .from('agent_communications')
    .insert({
      from_agent: fromAgent,
      to_agent: originalMessage.from_agent,
      content: responseContent,
      type: 'response',
      campaign_id: originalMessage.campaign_id,
      related_task_id: originalMessage.related_task_id,
      parent_message_id: messageId,
      status: 'sent',
      metadata: metadata || {}
    });

  if (responseError) {
    console.error('Error sending response:', responseError);
    throw new Error(`Failed to send response: ${responseError.message}`);
  }

  // Atualizar status da mensagem original
  const { error: updateError } = await supabase
    .from('agent_communications')
    .update({ status: 'responded' })
    .eq('id', messageId);

  if (updateError) {
    console.error('Error updating message status:', updateError);
    // Não falhar aqui, resposta já foi enviada
  }
}
