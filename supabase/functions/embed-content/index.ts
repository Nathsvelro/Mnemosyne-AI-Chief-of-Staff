import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmbedRequest {
  content: string;
  source_type: string; // 'document_chunk', 'node_summary', 'decision_record', 'sprint_artifact'
  source_id: string;
  chunk_index?: number;
  metadata?: Record<string, unknown>;
  linked_node_ids?: string[];
}

interface BatchEmbedRequest {
  items: EmbedRequest[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    const items: EmbedRequest[] = body.items || [body];

    if (items.length === 0) {
      throw new Error("No content to embed");
    }

    // Generate embeddings using Lovable AI Gateway
    const embeddingResponses = await Promise.all(
      items.map(async (item) => {
        // Use the embedding-compatible endpoint
        const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: item.content,
            model: "text-embedding-3-small", // OpenAI-compatible embedding model
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Embedding error:", response.status, errorText);
          throw new Error(`Embedding failed: ${response.status}`);
        }

        const result = await response.json();
        return {
          embedding: result.data[0].embedding,
          item,
        };
      })
    );

    // Store embeddings in database
    const insertData = embeddingResponses.map(({ embedding, item }) => ({
      source_type: item.source_type,
      source_id: item.source_id,
      chunk_index: item.chunk_index || 0,
      embedding: embedding,
      content: item.content,
      metadata: item.metadata || {},
      linked_node_ids: item.linked_node_ids || [],
    }));

    const { data, error } = await supabase
      .from("embeddings")
      .insert(insertData)
      .select("id, source_id, source_type");

    if (error) {
      console.error("Database error:", error);
      throw new Error(`Failed to store embeddings: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        embedded_count: data.length,
        embeddings: data,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Embed content error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
