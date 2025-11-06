/**
 * LLM Router - Determines the correct API endpoint and key based on model
 */

export type LLMModel =
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
  | 'claude-3-haiku-20240307'
  // Google Gemini Direct
  | 'gemini-2.5-pro'
  | 'gemini-2.5-flash'
  | 'gemini-2.0-flash-exp'
  | 'gemini-1.5-pro'
  | 'gemini-1.5-flash';

/**
 * Get the appropriate API endpoint based on the model
 */
export function getLLMEndpoint(model: string): string {
  // Anthropic Direct models (check first - most specific)
  if (isAnthropicDirect(model)) {
    return 'https://api.anthropic.com/v1/messages';
  }
  
  // OpenAI Direct models
  if (model.startsWith('gpt-') || 
      model.startsWith('o3-') || 
      model.startsWith('o4-')) {
    return 'https://api.openai.com/v1/chat/completions';
  }
  
  // Google Gemini Direct models
  if (isGeminiDirect(model)) {
    return 'https://generativelanguage.googleapis.com/v1beta/models';
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
  
  // OpenAI Direct models
  if (model.startsWith('gpt-') || 
      model.startsWith('o3-') || 
      model.startsWith('o4-')) {
    const key = Deno.env.get('OPENAI_API_KEY');
    if (!key) throw new Error('OPENAI_API_KEY not configured');
    return key;
  }
  
  // Google Gemini Direct models
  if (isGeminiDirect(model)) {
    const key = Deno.env.get('GOOGLE_AI_API_KEY');
    if (!key) throw new Error('GOOGLE_AI_API_KEY not configured');
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
 * Check if model is Google Gemini Direct API
 */
export function isGeminiDirect(model: string): boolean {
  return model.startsWith('gemini-');
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
 * Convert OpenAI-style messages to Google Gemini format
 */
export function prepareGeminiRequest(messages: any[]): {
  contents: any[];
  systemInstruction?: { parts: { text: string }[] };
} {
  let systemPrompt: string | undefined;
  const geminiContents: any[] = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      systemPrompt = msg.content;
    } else {
      geminiContents.push({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      });
    }
  }

  const result: any = { contents: geminiContents };
  if (systemPrompt) {
    result.systemInstruction = { parts: [{ text: systemPrompt }] };
  }

  return result;
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
  
  // Google Gemini - API key goes in URL, not header
  if (isGeminiDirect(model)) {
    return {
      'Content-Type': 'application/json',
    };
  }
  
  // OpenAI uses standard Authorization header
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
      return 'claude-sonnet-4-20250514'; // Leadership - Claude 4 Sonnet
    case 'level_2':
      return 'gpt-5-2025-08-07'; // Strategy - GPT-5
    case 'level_3':
      return 'gemini-2.5-flash'; // Execution - Gemini Flash
    case 'level_4':
      return 'gemini-2.0-flash-exp'; // QA - Gemini Experimental (fast)
    default:
      return 'gemini-2.5-flash';
  }
}
