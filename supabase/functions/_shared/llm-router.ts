/**
 * LLM Router - Determines the correct API endpoint and key based on model
 */

export type LLMModel =
  // Lovable AI - Gemini
  | 'google/gemini-2.5-pro'
  | 'google/gemini-2.5-flash'
  | 'google/gemini-2.5-flash-lite'
  | 'google/gemini-2.0-flash-exp'
  | 'google/gemini-2.5-flash-image'
  // Lovable AI - OpenAI
  | 'openai/gpt-5'
  | 'openai/gpt-5-mini'
  | 'openai/gpt-5-nano'
  // Lovable AI - Claude
  | 'claude-sonnet-4-5'
  | 'claude-opus-4-1-20250805'
  | 'claude-3-5-sonnet-20241022'
  // OpenAI Direct
  | 'gpt-5-2025-08-07'
  | 'gpt-5-mini-2025-08-07'
  | 'gpt-5-nano-2025-08-07'
  | 'o3-2025-04-16'
  | 'o4-mini-2025-04-16'
  // Anthropic Direct - Latest Models
  | 'claude-sonnet-4-20250514'
  | 'claude-opus-4-20250514'
  | 'claude-3-7-sonnet-20250219'
  | 'claude-3-5-haiku-20241022'
  // Anthropic Direct - Legacy Models
  | 'claude-3-5-sonnet-20241022-direct'
  | 'claude-3-opus-20240229'
  | 'claude-3-haiku-20240307';

/**
 * Get the appropriate API endpoint based on the model
 */
export function getLLMEndpoint(model: string): string {
  // Anthropic Direct models (check first - most specific)
  if (isAnthropicDirect(model)) {
    return 'https://api.anthropic.com/v1/messages';
  }
  
  // Lovable AI Gateway models
  if (model.startsWith('google/') || 
      model.startsWith('openai/') || 
      model.startsWith('claude-')) {
    return 'https://ai.gateway.lovable.dev/v1/chat/completions';
  }
  
  // OpenAI Direct models
  if (model.startsWith('gpt-') || 
      model.startsWith('o3-') || 
      model.startsWith('o4-')) {
    return 'https://api.openai.com/v1/chat/completions';
  }
  
  throw new Error(`Unknown model provider for: ${model}`);
}

/**
 * Get the appropriate API key based on the model
 */
export function getAPIKey(model: string): string {
  // Anthropic Direct models (check first)
  if (isAnthropicDirect(model)) {
    const key = Deno.env.get('ANTHROPIC_API_KEY');
    if (!key) throw new Error('ANTHROPIC_API_KEY not configured');
    return key;
  }
  
  // Lovable AI Gateway models
  if (model.startsWith('google/') || 
      model.startsWith('openai/') || 
      model.startsWith('claude-')) {
    const key = Deno.env.get('LOVABLE_API_KEY');
    if (!key) throw new Error('LOVABLE_API_KEY not configured');
    return key;
  }
  
  // OpenAI Direct models
  if (model.startsWith('gpt-') || 
      model.startsWith('o3-') || 
      model.startsWith('o4-')) {
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) throw new Error('OPENAI_API_KEY not configured');
    return key;
  }
  
  throw new Error(`Unknown model provider for: ${model}`);
}

/**
 * Check if model is Anthropic Direct API
 */
export function isAnthropicDirect(model: string): boolean {
  // Anthropic Direct models have date format (YYYYMMDD) in their name
  return model.startsWith('claude-') && (
    /claude-.*-\d{8}/.test(model) ||  // claude-sonnet-4-20250514
    model.endsWith('-direct')          // claude-3-5-sonnet-20241022-direct
  );
}

/**
 * Convert OpenAI-style messages to Anthropic format
 */
export function prepareAnthropicRequest(messages: any[]): { 
  system?: string; 
  messages: any[] 
} {
  let systemPrompt: string | undefined;
  const anthropicMessages: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      // Anthropic uses separate system field
      systemPrompt = msg.content;
    } else {
      anthropicMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      });
    }
  }

  return { system: systemPrompt, messages: anthropicMessages };
}

/**
 * Get the correct headers based on the model
 */
export function getHeaders(model: string, apiKey: string): Record<string, string> {
  // Anthropic requires special headers
  if (isAnthropicDirect(model)) {
    return {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'Content-Type': 'application/json',
    };
  }
  
  // OpenAI and Lovable AI use standard Authorization header
  return {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Get recommended model for agent level
 */
export function getRecommendedModel(level: string): LLMModel {
  switch (level) {
    case 'level_1':
      return 'claude-sonnet-4-5'; // Leadership - superior reasoning
    case 'level_2':
      return 'openai/gpt-5'; // Strategy/Intelligence - powerful analysis
    case 'level_3':
      return 'google/gemini-2.5-flash'; // Execution - balanced
    case 'level_4':
      return 'google/gemini-2.5-flash-lite'; // QA - fast and efficient
    default:
      return 'google/gemini-2.5-flash';
  }
}
