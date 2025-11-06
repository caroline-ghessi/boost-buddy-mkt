import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLLMEndpoint, getAPIKey, getHeaders, prepareAnthropicRequest, isAnthropicDirect } from "../_shared/llm-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { system_prompt, test_message, model } = await req.json();

    console.log('Test agent prompt request');

    if (!system_prompt || !test_message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: system_prompt, test_message' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Allow testing with any model (default to claude-sonnet-4-5)
    const selectedModel = model || 'claude-sonnet-4-5';
    const endpoint = getLLMEndpoint(selectedModel);
    const apiKey = getAPIKey(selectedModel);
    const headers = getHeaders(selectedModel, apiKey);

    console.log(`Calling ${selectedModel} for prompt testing...`);

    // Prepare request body based on model provider
    let requestBody: any;

    if (isAnthropicDirect(selectedModel)) {
      // Anthropic API format
      const allMessages = [
        { role: 'system', content: system_prompt },
        { role: 'user', content: test_message }
      ];
      const { system, messages: anthropicMessages } = prepareAnthropicRequest(allMessages);
      
      requestBody = {
        model: selectedModel,
        max_tokens: 1000,
        temperature: 0.7,
        system: system,
        messages: anthropicMessages,
      };
    } else {
      // OpenAI/Lovable AI Gateway format
      requestBody = {
        model: selectedModel,
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: test_message }
        ],
        max_tokens: 1000,
        temperature: 0.7
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('LLM API error:', error);
      throw new Error(`LLM API request failed: ${response.status}`);
    }

    const data = await response.json();
    
    // Parse response based on model provider
    let aiResponse: string;
    let tokensUsed: number = 0;
    
    if (isAnthropicDirect(selectedModel)) {
      // Anthropic format
      aiResponse = data.content?.[0]?.text || 'No response generated';
      tokensUsed = (data.usage?.input_tokens || 0) + (data.usage?.output_tokens || 0);
    } else {
      // OpenAI/Lovable AI format
      aiResponse = data.choices?.[0]?.message?.content || 'No response generated';
      tokensUsed = data.usage?.total_tokens || 0;
    }

    console.log('Test completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        test_input: test_message,
        ai_response: aiResponse,
        tokens_used: tokensUsed,
        model: data.model || selectedModel
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in test-agent-prompt:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
