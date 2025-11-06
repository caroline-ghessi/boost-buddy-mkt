import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { getLLMEndpoint, getAPIKey } from "../_shared/llm-router.ts";

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

    console.log(`Calling ${selectedModel} for prompt testing...`);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: selectedModel,
        messages: [
          {
            role: 'system',
            content: system_prompt
          },
          {
            role: 'user',
            content: test_message
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Lovable AI error:', error);
      throw new Error(`Lovable AI request failed: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || 'No response generated';

    console.log('Test completed successfully');

    return new Response(
      JSON.stringify({
        success: true,
        test_input: test_message,
        ai_response: aiResponse,
        tokens_used: data.usage?.total_tokens || 0,
        model: data.model
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
