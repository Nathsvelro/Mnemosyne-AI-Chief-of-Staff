import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SearchRequest {
  query: string;
  match_threshold?: number;
  match_count?: number;
  source_type_filter?: string;
  expand_graph?: boolean; // Whether to expand linked graph nodes
  graph_hops?: number;
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

    const body: SearchRequest = await req.json();
    const {
      query,
      match_threshold = 0.7,
      match_count = 10,
      source_type_filter,
      expand_graph = true,
      graph_hops = 2,
    } = body;

    if (!query) {
      throw new Error("Query is required");
    }

    // Generate embedding for the query
    const embeddingResponse = await fetch("https://ai.gateway.lovable.dev/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: query,
        model: "text-embedding-3-small",
      }),
    });

    if (!embeddingResponse.ok) {
      const errorText = await embeddingResponse.text();
      console.error("Embedding error:", embeddingResponse.status, errorText);
      throw new Error(`Failed to generate query embedding: ${embeddingResponse.status}`);
    }

    const embeddingResult = await embeddingResponse.json();
    const queryEmbedding = embeddingResult.data[0].embedding;

    // Perform semantic search using the database function
    const { data: searchResults, error: searchError } = await supabase.rpc(
      "semantic_search",
      {
        query_embedding: queryEmbedding,
        match_threshold,
        match_count,
        source_type_filter: source_type_filter || null,
      }
    );

    if (searchError) {
      console.error("Search error:", searchError);
      throw new Error(`Semantic search failed: ${searchError.message}`);
    }

    // Collect all linked node IDs from search results
    const linkedNodeIds = new Set<string>();
    searchResults?.forEach((result: { linked_node_ids: string[] }) => {
      result.linked_node_ids?.forEach((id) => linkedNodeIds.add(id));
    });

    // Optionally expand graph context
    let graphContext: Record<string, unknown>[] = [];
    if (expand_graph && linkedNodeIds.size > 0) {
      // For each linked node, get its graph neighborhood
      const graphPromises = Array.from(linkedNodeIds).slice(0, 5).map(async (nodeId) => {
        // First, determine the entity type by checking each table
        const tables = ["persons", "teams", "topics", "decisions", "documents"];
        let entityType: string | null = null;

        for (const table of tables) {
          const { data } = await supabase
            .from(table)
            .select("id")
            .eq("id", nodeId)
            .maybeSingle();
          
          if (data) {
            entityType = table.slice(0, -1); // Remove 's' from table name
            break;
          }
        }

        if (!entityType) return null;

        // Get graph traversal for this node
        const { data: traversalData } = await supabase.rpc("graph_traverse", {
          start_entity_type: entityType,
          start_entity_id: nodeId,
          max_hops: graph_hops,
        });

        return {
          seed_node_id: nodeId,
          entity_type: entityType,
          connected_nodes: traversalData || [],
        };
      });

      const graphResults = await Promise.all(graphPromises);
      graphContext = graphResults.filter(Boolean) as Record<string, unknown>[];
    }

    // Build response with citations
    const response = {
      query,
      results: searchResults?.map((r: {
        id: string;
        source_type: string;
        source_id: string;
        content: string;
        similarity: number;
        metadata: Record<string, unknown>;
        linked_node_ids: string[];
      }) => ({
        id: r.id,
        source_type: r.source_type,
        source_id: r.source_id,
        content: r.content,
        similarity: r.similarity,
        metadata: r.metadata,
        linked_node_ids: r.linked_node_ids,
        // Citation format
        citation: `[${r.source_type}:${r.source_id}]`,
      })) || [],
      graph_context: graphContext,
      total_results: searchResults?.length || 0,
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Semantic search error:", error);
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
