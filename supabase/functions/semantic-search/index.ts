import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  corsHeaders, 
  authenticateRequest, 
  unauthorizedResponse,
  validateString,
  validateNumber
} from "../_shared/auth.ts";

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
    
    // Validate inputs
    const query = validateString(body.query, "query", 2000);
    const match_threshold = validateNumber(body.match_threshold ?? 0.7, "match_threshold", 0, 1);
    const match_count = Math.min(validateNumber(body.match_count ?? 10, "match_count", 1, 50), 50);
    const source_type_filter = body.source_type_filter ? validateString(body.source_type_filter, "source_type_filter", 100) : null;
    const expand_graph = body.expand_graph !== false;
    const graph_hops = Math.min(validateNumber(body.graph_hops ?? 2, "graph_hops", 1, 4), 4);

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
        source_type_filter,
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
      const graphPromises = Array.from(linkedNodeIds).slice(0, 5).map(async (nodeId) => {
        const tables = ["persons", "teams", "topics", "decisions", "documents"];
        let entityType: string | null = null;

        for (const table of tables) {
          const { data } = await supabase
            .from(table)
            .select("id")
            .eq("id", nodeId)
            .maybeSingle();
          
          if (data) {
            entityType = table.slice(0, -1);
            break;
          }
        }

        if (!entityType) return null;

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
