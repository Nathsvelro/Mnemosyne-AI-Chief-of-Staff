import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { 
  corsHeaders, 
  authenticateRequest, 
  unauthorizedResponse,
  validateString,
  validateNumber,
  sanitizeForLike
} from "../_shared/auth.ts";

/**
 * Graph-RAG: Hybrid retrieval combining vector search + graph traversal
 * 
 * Stage 1: Candidate recall via semantic search
 * Stage 2: Graph grounding - expand k-hops from retrieved chunks
 * Stage 3: Answer synthesis with citations
 */

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
    const max_chunks = Math.min(validateNumber(body.max_chunks ?? 5, "max_chunks", 1, 20), 20);
    const graph_hops = Math.min(validateNumber(body.graph_hops ?? 2, "graph_hops", 1, 4), 4);
    const include_reasoning = body.include_reasoning !== false;

    console.log(`[Graph-RAG] Processing query: "${query}"`);

    // ========================================
    // STAGE 1: Vector Candidate Recall
    // ========================================
    
    // Generate query embedding
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

    let vectorResults: { content: string; source_id: string; linked_node_ids: string[]; similarity: number }[] = [];
    
    if (embeddingResponse.ok) {
      const embeddingResult = await embeddingResponse.json();
      const queryEmbedding = embeddingResult.data[0].embedding;

      // Semantic search
      const { data: searchData } = await supabase.rpc("semantic_search", {
        query_embedding: queryEmbedding,
        match_threshold: 0.6,
        match_count: max_chunks,
      });
      
      vectorResults = searchData || [];
      console.log(`[Graph-RAG] Stage 1: Found ${vectorResults.length} vector matches`);
    }

    // ========================================
    // STAGE 2: Graph Grounding
    // ========================================

    // Collect seed nodes from vector results + keyword search
    const seedNodeIds = new Set<string>();
    vectorResults.forEach((r) => {
      r.linked_node_ids?.forEach((id) => seedNodeIds.add(id));
    });

    // Also do keyword search on organizational entities (sanitized)
    const keywords = query.toLowerCase().split(/\s+/).filter((w) => w.length > 3).slice(0, 5);
    const sanitizedKeywords = keywords.map(sanitizeForLike);
    
    const [personsResult, teamsResult, topicsResult, decisionsResult] = await Promise.all([
      supabase.from("persons").select("id, name, role").or(
        sanitizedKeywords.map((k) => `name.ilike.%${k}%,role.ilike.%${k}%`).join(",")
      ).limit(5),
      supabase.from("teams").select("id, name, description").or(
        sanitizedKeywords.map((k) => `name.ilike.%${k}%,description.ilike.%${k}%`).join(",")
      ).limit(5),
      supabase.from("topics").select("id, name, description").or(
        sanitizedKeywords.map((k) => `name.ilike.%${k}%,description.ilike.%${k}%`).join(",")
      ).limit(5),
      supabase.from("decisions").select("id, title, canonical_text, status, confidence, owner_person_id").or(
        sanitizedKeywords.map((k) => `title.ilike.%${k}%,canonical_text.ilike.%${k}%`).join(",")
      ).limit(5),
    ]);

    // Build entity context
    const entityContext: Record<string, unknown>[] = [];
    
    personsResult.data?.forEach((p) => {
      seedNodeIds.add(p.id);
      entityContext.push({ type: "person", ...p });
    });
    teamsResult.data?.forEach((t) => {
      seedNodeIds.add(t.id);
      entityContext.push({ type: "team", ...t });
    });
    topicsResult.data?.forEach((t) => {
      seedNodeIds.add(t.id);
      entityContext.push({ type: "topic", ...t });
    });
    decisionsResult.data?.forEach((d) => {
      seedNodeIds.add(d.id);
      entityContext.push({ type: "decision", ...d });
    });

    console.log(`[Graph-RAG] Stage 2: ${seedNodeIds.size} seed nodes, ${entityContext.length} direct matches`);

    // Expand graph from seed nodes (limit to 10 to prevent excessive queries)
    const graphExpansions: { seed_id: string; connections: unknown[] }[] = [];
    
    for (const nodeId of Array.from(seedNodeIds).slice(0, 10)) {
      let entityType = null;
      const entity = entityContext.find((e) => (e as { id: string }).id === nodeId);
      if (entity) {
        entityType = (entity as { type: string }).type;
      } else {
        for (const table of ["persons", "teams", "topics", "decisions", "documents"]) {
          const { data } = await supabase.from(table).select("id").eq("id", nodeId).maybeSingle();
          if (data) {
            entityType = table.slice(0, -1);
            break;
          }
        }
      }

      if (entityType) {
        const { data: traversal } = await supabase.rpc("graph_traverse", {
          start_entity_type: entityType,
          start_entity_id: nodeId,
          max_hops: graph_hops,
        });

        if (traversal && traversal.length > 1) {
          graphExpansions.push({
            seed_id: nodeId,
            connections: traversal,
          });
        }
      }
    }

    // Get details for expanded nodes
    const expandedNodeDetails: unknown[] = [];
    for (const expansion of graphExpansions) {
      for (const conn of expansion.connections as { entity_type: string; entity_id: string; hop_level: number }[]) {
        if (conn.hop_level > 0) {
          const { data } = await supabase.rpc("get_entity_details", {
            p_entity_type: conn.entity_type,
            p_entity_id: conn.entity_id,
          });
          if (data && !data.not_found) {
            expandedNodeDetails.push({
              type: conn.entity_type,
              hop_level: conn.hop_level,
              ...data,
            });
          }
        }
      }
    }

    console.log(`[Graph-RAG] Stage 2: Graph expanded to ${expandedNodeDetails.length} connected nodes`);

    // ========================================
    // STAGE 3: Answer Synthesis
    // ========================================

    const contextParts: string[] = [];

    if (vectorResults.length > 0) {
      contextParts.push("=== Retrieved Documents ===");
      vectorResults.forEach((r, i) => {
        contextParts.push(`[Doc ${i + 1}] (similarity: ${(r.similarity * 100).toFixed(1)}%)\n${r.content}`);
      });
    }

    if (entityContext.length > 0) {
      contextParts.push("\n=== Organizational Entities ===");
      entityContext.forEach((e) => {
        const type = (e as { type: string }).type;
        contextParts.push(`[${type.toUpperCase()}] ${JSON.stringify(e, null, 2)}`);
      });
    }

    if (expandedNodeDetails.length > 0) {
      contextParts.push("\n=== Connected Entities (via Graph) ===");
      expandedNodeDetails.slice(0, 15).forEach((n) => {
        const node = n as { type: string; hop_level: number };
        contextParts.push(`[${node.type.toUpperCase()} - ${node.hop_level} hop(s) away] ${JSON.stringify(n, null, 2)}`);
      });
    }

    const systemPrompt = `You are Mnemosyne AI, the organizational memory and intelligence layer.
Your role is to answer questions using the organization's internal knowledge graph and documents.

Key principles:
1. EXPLAIN WHY things are connected, not just WHAT exists
2. Provide HISTORICAL CONTEXT behind decisions and initiatives
3. Detect and flag CONTRADICTIONS, SILOS, or OUTDATED assumptions
4. Always CITE your sources using [Doc X] or [ENTITY_TYPE: name] format
5. If evidence is INSUFFICIENT, say so explicitly - don't hallucinate
6. Use a clear, strategic, and reflective tone

When answering:
- Start with the direct answer
- Follow with supporting evidence and citations
- Explain relationships and dependencies
- Flag any conflicts or concerns
- Suggest related topics to explore`;

    const userPrompt = `User Question: ${query}

Context from organizational knowledge:
${contextParts.join("\n\n")}

${include_reasoning ? "Include your reasoning about how the entities are connected." : ""}

Answer the question based on the above context. If you cannot find sufficient information, say so clearly.`;

    const llmResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    });

    if (!llmResponse.ok) {
      const errorText = await llmResponse.text();
      console.error("LLM error:", llmResponse.status, errorText);
      throw new Error(`LLM generation failed: ${llmResponse.status}`);
    }

    const llmResult = await llmResponse.json();
    const answer = llmResult.choices[0].message.content;

    const response = {
      query,
      answer,
      sources: {
        vector_results: vectorResults.length,
        entity_matches: entityContext.length,
        graph_expansions: expandedNodeDetails.length,
      },
      evidence: {
        documents: vectorResults.map((r) => ({
          source_id: r.source_id,
          similarity: r.similarity,
          excerpt: r.content.substring(0, 200) + "...",
        })),
        entities: entityContext.map((e) => ({
          type: (e as { type: string }).type,
          id: (e as { id: string }).id,
          name: (e as { name?: string; title?: string }).name || (e as { title?: string }).title,
        })),
        graph_connections: graphExpansions.length,
      },
      metadata: {
        model: "google/gemini-3-flash-preview",
        graph_hops,
        timestamp: new Date().toISOString(),
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Graph-RAG error:", error);
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
