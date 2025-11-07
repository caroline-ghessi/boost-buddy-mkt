import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.76.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      query, 
      matchThreshold = 0.7, 
      matchCount = 5,
      categories = null,
      excludeCategories = null 
    } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    // Generate embedding for query using OpenAI
    console.log("Generating embedding for query:", query);
    
    const embeddingResponse = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: query,
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("OpenAI embedding error:", embeddingResponse.status, errorText);
      throw new Error("Failed to generate embedding");
    }

    const embeddingData = await embeddingResponse.json();
    const queryEmbedding = embeddingData.data[0].embedding;
    
    console.log("Embedding generated, searching similar chunks...");

    // Get user from auth header if available
    let userId = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // Search for similar chunks using the match_rag_chunks function
    let { data: chunks, error } = await supabase.rpc('match_rag_chunks', {
      query_embedding: queryEmbedding,
      match_threshold: matchThreshold,
      match_count: matchCount * 2, // Get more to allow filtering
      filter_user_id: userId
    });

    // Apply category filters if provided
    if (chunks && (categories || excludeCategories)) {
      // Get document IDs and their categories
      const documentIds = [...new Set(chunks.map((c: any) => c.document_id))];
      
      const { data: docs } = await supabase
        .from('rag_documents')
        .select('id, category')
        .in('id', documentIds);

      const docCategoryMap = new Map(docs?.map(d => [d.id, d.category]) || []);

      chunks = chunks.filter((chunk: any) => {
        const docCategory = docCategoryMap.get(chunk.document_id);
        
        // Filter by categories if specified
        if (categories && categories.length > 0) {
          if (!docCategory || !categories.includes(docCategory)) {
            return false;
          }
        }
        
        // Exclude categories if specified
        if (excludeCategories && excludeCategories.length > 0) {
          if (docCategory && excludeCategories.includes(docCategory)) {
            return false;
          }
        }
        
        return true;
      });

      // Limit to original matchCount
      chunks = chunks.slice(0, matchCount);
    }

    if (error) {
      console.error("Error searching chunks:", error);
      throw error;
    }

    console.log(`Found ${chunks?.length || 0} matching chunks`);

    return new Response(JSON.stringify({ 
      chunks: chunks || [],
      query,
      count: chunks?.length || 0 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("query-rag error:", error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error",
      chunks: []
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
