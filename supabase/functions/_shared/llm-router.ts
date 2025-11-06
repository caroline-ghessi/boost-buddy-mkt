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
  | 'o4-mini-2025-04-16';

/**
 * Get the appropriate API endpoint based on the model
 */
export function getLLMEndpoint(model: string): string {
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
