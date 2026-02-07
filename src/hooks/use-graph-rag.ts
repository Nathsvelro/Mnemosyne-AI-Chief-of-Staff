import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { GraphRAGResponse, SemanticSearchResult } from "@/types/graph-rag";

interface EmbedContentParams {
  content: string;
  source_type: 'document_chunk' | 'node_summary' | 'decision_record' | 'sprint_artifact';
  source_id: string;
  chunk_index?: number;
  metadata?: Record<string, unknown>;
  linked_node_ids?: string[];
}

interface SemanticSearchParams {
  query: string;
  match_threshold?: number;
  match_count?: number;
  source_type_filter?: string;
  expand_graph?: boolean;
  graph_hops?: number;
}

interface GraphRAGParams {
  query: string;
  max_chunks?: number;
  graph_hops?: number;
  include_reasoning?: boolean;
}

interface SemanticSearchResponse {
  query: string;
  results: SemanticSearchResult[];
  graph_context: Record<string, unknown>[];
  total_results: number;
}

/**
 * Hook for Graph-RAG operations:
 * - Embedding content for semantic search
 * - Semantic search with optional graph expansion
 * - Full Graph-RAG queries (vector + graph + LLM synthesis)
 */
export function useGraphRAG() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Embed content for later semantic retrieval
   */
  const embedContent = useCallback(async (params: EmbedContentParams | EmbedContentParams[]) => {
    setIsLoading(true);
    setError(null);

    try {
      const items = Array.isArray(params) ? params : [params];
      
      const { data, error: funcError } = await supabase.functions.invoke("embed-content", {
        body: { items },
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      toast.success(`Embedded ${data.embedded_count} item(s) successfully`);
      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to embed content";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Semantic search with optional graph expansion
   */
  const semanticSearch = useCallback(async (params: SemanticSearchParams): Promise<SemanticSearchResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("semantic-search", {
        body: params,
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as SemanticSearchResponse;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Semantic search failed";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Full Graph-RAG query: vector search + graph grounding + LLM synthesis
   */
  const queryGraphRAG = useCallback(async (params: GraphRAGParams): Promise<GraphRAGResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: funcError } = await supabase.functions.invoke("graph-rag", {
        body: params,
      });

      if (funcError) {
        throw new Error(funcError.message);
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as GraphRAGResponse;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Graph-RAG query failed";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Graph traversal - get connected nodes k-hops from a starting node
   */
  const traverseGraph = useCallback(async (
    entityType: string,
    entityId: string,
    maxHops: number = 2,
    edgeFilter?: string[]
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use raw SQL via RPC since types are complex
      const { data, error: queryError } = await supabase.rpc("graph_traverse", {
        start_entity_type: entityType as "person" | "team" | "topic" | "decision" | "document" | "initiative" | "process" | "risk" | "system" | "kpi" | "idea" | "experiment" | "sprint",
        start_entity_id: entityId,
        max_hops: maxHops,
        edge_filter: edgeFilter as ("communicates_with" | "owns" | "depends_on" | "references" | "contradicts" | "aligns_with" | "impacts" | "governs" | "measures" | "blocks" | "derived_from" | "replaces" | "supersedes" | "uses_system" | "risk_of")[] | null,
      });

      if (queryError) {
        throw new Error(queryError.message);
      }

      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Graph traversal failed";
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get entity details by type and ID
   */
  const getEntityDetails = useCallback(async (entityType: string, entityId: string) => {
    try {
      const { data, error: queryError } = await supabase.rpc("get_entity_details", {
        p_entity_type: entityType as "person" | "team" | "topic" | "decision" | "document" | "initiative" | "process" | "risk" | "system" | "kpi" | "idea" | "experiment" | "sprint",
        p_entity_id: entityId,
      });

      if (queryError) {
        throw new Error(queryError.message);
      }

      return data;
    } catch (err: unknown) {
      console.error("Failed to get entity details:", err);
      return null;
    }
  }, []);

  return {
    isLoading,
    error,
    embedContent,
    semanticSearch,
    queryGraphRAG,
    traverseGraph,
    getEntityDetails,
  };
}
