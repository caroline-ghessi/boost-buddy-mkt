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
    const { documentId } = await req.json();
    
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) throw new Error("Supabase not configured");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    console.log("Processing document:", documentId);

    // Get document
    const { data: document, error: docError } = await supabase
      .from('rag_documents')
      .select('*')
      .eq('id', documentId)
      .single();

    if (docError || !document) {
      throw new Error("Document not found");
    }

    // Update status to processing
    await supabase
      .from('rag_documents')
      .update({ status: 'processing' })
      .eq('id', documentId);

    // For now, create simple chunks from the title and description
    // In a real implementation, you would parse file_url content
    const content = `${document.title}\n\n${document.description || ''}`;
    
    // Simple chunking: split by paragraphs or max 1000 chars
    const chunks = chunkText(content, 1000, 200);
    console.log(`Created ${chunks.length} chunks`);

    // Process chunks in batches
    const batchSize = 20;
    let totalChunks = 0;

    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      
      // Generate embeddings for batch
      const embeddings = await generateEmbeddings(batch, OPENAI_API_KEY);
      
      // Insert chunks and embeddings
      for (let j = 0; j < batch.length; j++) {
        const chunkIndex = i + j;
        const chunkContent = batch[j];
        const embedding = embeddings[j];

        // Insert chunk
        const { data: chunkData, error: chunkError } = await supabase
          .from('rag_chunks')
          .insert({
            document_id: documentId,
            user_id: document.user_id,
            content: chunkContent,
            chunk_index: chunkIndex,
            token_count: estimateTokens(chunkContent),
            metadata: {
              document_title: document.title,
              category: document.category
            }
          })
          .select()
          .single();

        if (chunkError) {
          console.error("Error inserting chunk:", chunkError);
          continue;
        }

        // Insert embedding
        const { error: embError } = await supabase
          .from('rag_embeddings')
          .insert({
            chunk_id: chunkData.id,
            user_id: document.user_id,
            embedding
          });

        if (embError) {
          console.error("Error inserting embedding:", embError);
        } else {
          totalChunks++;
        }
      }

      console.log(`Processed batch ${i / batchSize + 1}`);
    }

    // Update document status
    await supabase
      .from('rag_documents')
      .update({ 
        status: 'ready',
        chunk_count: totalChunks,
        updated_at: new Date().toISOString()
      })
      .eq('id', documentId);

    console.log("Document processing complete:", documentId);

    return new Response(JSON.stringify({ 
      success: true,
      documentId,
      chunksCreated: totalChunks
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("ingest-documents error:", error);
    
    // Try to update document status to error
    const { documentId } = await req.json().catch(() => ({}));
    if (documentId) {
      const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
      const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
        await supabase
          .from('rag_documents')
          .update({ status: 'error' })
          .eq('id', documentId);
      }
    }

    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

// Helper functions
function chunkText(text: string, maxChunkSize: number, overlap: number): string[] {
  const chunks: string[] = [];
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  let currentChunk = '';
  
  for (const paragraph of paragraphs) {
    if (currentChunk.length + paragraph.length > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.trim());
        // Keep overlap from end of current chunk
        const words = currentChunk.split(' ');
        const overlapWords = words.slice(-Math.floor(overlap / 5));
        currentChunk = overlapWords.join(' ') + ' ';
      }
    }
    currentChunk += paragraph + '\n\n';
  }
  
  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : [text];
}

function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(text.length / 4);
}

async function generateEmbeddings(texts: string[], apiKey: string): Promise<number[][]> {
  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input: texts,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("OpenAI embedding error:", response.status, errorText);
    throw new Error("Failed to generate embeddings");
  }

  const data = await response.json();
  return data.data.map((item: any) => item.embedding);
}
