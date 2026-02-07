import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  corsHeaders, 
  authenticateRequest, 
  unauthorizedResponse,
  validateString,
  validateUUID,
  validateNumber,
  validateArray
} from "../_shared/auth.ts";

interface EmbedRequest {
  content: string;
  source_type: string;
  source_id: string;
  chunk_index?: number;
  metadata?: Record<string, unknown>;
  linked_node_ids?: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate the request
    const auth = await authenticateRequest(req);
    if (!auth) {
      return unauthorizedResponse();
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const body = await req.json();
    
    // Support both single item and batch
    let items: EmbedRequest[] = [];
    if (body.items) {
      items = validateArray<EmbedRequest>(body.items, "items", 50);
    } else if (body.content) {
      items = [body];
    }

    if (items.length === 0) {
      throw new Error("No content to embed");
    }

    // Validate each item
    const validatedItems = items.map((item, i) => ({
      content: validateString(item.content, `items[${i}].content`, 50000),
      source_type: validateString(item.source_type, `items[${i}].source_type`, 100),
      source_id: validateUUID(item.source_id, `items[${i}].source_id`),
      chunk_index: item.chunk_index !== undefined ? validateNumber(item.chunk_index, `items[${i}].chunk_index`, 0, 10000) : 0,
      metadata: item.metadata || {},
      linked_node_ids: item.linked_node_ids ? item.linked_node_ids.map((id, j) => validateUUID(id, `items[${i}].linked_node_ids[${j}]`)) : [],
    }));

    // Generate embeddings using Lovable AI Gateway
    const embeddingResponses = await Promise.all(
      validatedItems.map(async (item) => {
        const response = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            input: item.content,
            model: "text-embedding-3-small",
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
      chunk_index: item.chunk_index,
      embedding: embedding,
      content: item.content,
      metadata: item.metadata,
      linked_node_ids: item.linked_node_ids,
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
