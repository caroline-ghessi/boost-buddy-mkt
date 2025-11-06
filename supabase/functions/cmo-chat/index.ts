import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";
import { getLLMEndpoint, getAPIKey, getHeaders, prepareAnthropicRequest, prepareGeminiRequest, isAnthropicDirect, isGeminiDirect } from "../_shared/llm-router.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    
    // Get Ricardo's system prompt and model from agent_configs
    const { data: agentConfig } = await supabase
      .from('agent_configs')
      .select('system_prompt, llm_model')
      .eq('name', 'Ricardo Mendes')
      .single();
    
    const systemPrompt = agentConfig?.system_prompt || 
      "Você é Ricardo Mendes, CMO experiente e líder do Buddy AI. Seja estratégico, analítico e oriente campanhas de marketing com excelência.";
    
    const model = agentConfig?.llm_model || 'google/gemini-2.5-flash';
    const endpoint = getLLMEndpoint(model);
    const apiKey = getAPIKey(model);
    const headers = getHeaders(model, apiKey);

    // Query RAG for relevant context if user message exists
    let ragContext = "";
    const lastUserMessage = messages[messages.length - 1];
    
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

    // Prepare request body based on model provider
    let requestBody: any;
    let response: Response;
    let fullEndpoint: string;

    if (isGeminiDirect(model)) {
      // Google Gemini API format
      const geminiRequest = prepareGeminiRequest([
        { role: "system", content: systemPrompt + ragContext },
        ...messages,
      ]);
      
      requestBody = {
        ...geminiRequest,
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.7,
        }
      };
      
      // Google Gemini uses API key in URL
      fullEndpoint = `${endpoint}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
      
    } else if (isAnthropicDirect(model)) {
      // Anthropic API format
      const allMessages = [
        { role: "system", content: systemPrompt + ragContext },
        ...messages,
      ];
      const { system, messages: anthropicMessages } = prepareAnthropicRequest(allMessages);
      
      requestBody = {
        model: model,
        max_tokens: 4096,
        system: system,
        messages: anthropicMessages,
        stream: true
      };
      fullEndpoint = endpoint;
      
    } else {
      // OpenAI format
      requestBody = {
        model: model,
        messages: [
          { role: "system", content: systemPrompt + ragContext },
          ...messages,
        ],
        stream: true,
      };
      fullEndpoint = endpoint;
    }

    // Call LLM API
    response = await fetch(fullEndpoint, {
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

    // Save conversation asynchronously (don't wait)
    if (conversationId) {
      const authHeader = req.headers.get('authorization');
      const token = authHeader?.replace('Bearer ', '');
      
      if (token) {
        const { data: { user } } = await supabase.auth.getUser(token);
        
        if (user) {
          // Save user message
          await supabase.from('cmo_conversations').insert({
            id: conversationId,
            user_id: user.id,
            role: 'user',
            content: lastUserMessage.content
          });
        }
      }
    }

    // Return streaming response
    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("cmo-chat error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
