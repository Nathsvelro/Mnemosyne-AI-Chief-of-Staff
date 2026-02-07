import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Sprint, Idea } from "@/types/graph-rag";

type EntityType = "person" | "team" | "topic" | "decision" | "document" | "initiative" | "process" | "risk" | "system" | "kpi" | "idea" | "experiment" | "sprint";

interface CreateSprintParams {
  title: string;
  description?: string;
  source: Sprint["source"];
  owner_person_id?: string;
  problem_statement?: string;
  stakeholder_impact?: string;
  risks_assumptions?: string;
  strategic_alignment?: string;
  linked_nodes?: { entity_type: EntityType; entity_id: string; link_reason?: string }[];
}

interface UpdateSprintParams extends Partial<CreateSprintParams> {
  status?: Sprint["status"];
  progress?: number;
  ai_analysis?: Sprint["ai_analysis"];
}

interface CreateIdeaParams {
  title: string;
  description?: string;
  sprint_id?: string;
  proposer_person_id?: string;
  hypothesis?: string;
  success_criteria?: string;
  measurement_plan?: string;
}

/**
 * Hook for managing Innovation Sprints
 */
export function useSprints() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all sprints with optional filters
   */
  const fetchSprints = useCallback(async (filters?: {
    status?: Sprint["status"];
    source?: Sprint["source"];
    owner_person_id?: string;
  }) => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from("sprints")
        .select(`
          *,
          owner:persons!sprints_owner_person_id_fkey(id, name, role, avatar_url)
        `)
        .order("created_at", { ascending: false });

      if (filters?.status) {
        query = query.eq("status", filters.status);
      }
      if (filters?.source) {
        query = query.eq("source", filters.source);
      }
      if (filters?.owner_person_id) {
        query = query.eq("owner_person_id", filters.owner_person_id);
      }

      const { data, error: queryError } = await query;

      if (queryError) {
        throw new Error(queryError.message);
      }

      // Fetch linked nodes for each sprint
      const sprintsWithNodes = await Promise.all(
        (data || []).map(async (sprint) => {
          const { data: linkedNodes } = await supabase
            .from("sprint_linked_nodes")
            .select("*")
            .eq("sprint_id", sprint.id);
          
          return {
            ...sprint,
            linked_nodes: linkedNodes || [],
          };
        })
      );

      return sprintsWithNodes as Sprint[];
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch sprints";
      setError(errorMessage);
      toast.error(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create a new sprint
   */
  const createSprint = useCallback(async (params: CreateSprintParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { linked_nodes, ...sprintData } = params;

      const { data: sprint, error: insertError } = await supabase
        .from("sprints")
        .insert(sprintData)
        .select()
        .single();

      if (insertError) {
        throw new Error(insertError.message);
      }

      // Add linked nodes if provided
      if (linked_nodes && linked_nodes.length > 0) {
        const nodeInserts = linked_nodes.map((node) => ({
          sprint_id: sprint.id,
          entity_type: node.entity_type,
          entity_id: node.entity_id,
          link_reason: node.link_reason,
        }));

        const { error: linkError } = await supabase
          .from("sprint_linked_nodes")
          .insert(nodeInserts);

        if (linkError) {
          console.error("Failed to link nodes:", linkError);
        }
      }

      // Create timeline event
      await supabase.from("timeline_events").insert({
        event_type: "sprint_created",
        title: `Sprint created: ${sprint.title}`,
        description: sprint.description,
        entity_type: "sprint",
        entity_id: sprint.id,
        details: { source: sprint.source },
      });

      toast.success("Sprint created successfully");
      return sprint as Sprint;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create sprint";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Update a sprint
   */
  const updateSprint = useCallback(async (sprintId: string, params: UpdateSprintParams) => {
    setIsLoading(true);
    setError(null);

    try {
      const { linked_nodes, ...updateData } = params;

      const { data: sprint, error: updateError } = await supabase
        .from("sprints")
        .update(updateData)
        .eq("id", sprintId)
        .select()
        .single();

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Update linked nodes if provided
      if (linked_nodes !== undefined) {
        // Remove existing links
        await supabase.from("sprint_linked_nodes").delete().eq("sprint_id", sprintId);

        // Add new links
        if (linked_nodes.length > 0) {
          const nodeInserts = linked_nodes.map((node) => ({
            sprint_id: sprintId,
            entity_type: node.entity_type,
            entity_id: node.entity_id,
            link_reason: node.link_reason,
          }));

          await supabase.from("sprint_linked_nodes").insert(nodeInserts);
        }
      }

      toast.success("Sprint updated successfully");
      return sprint as Sprint;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update sprint";
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Delete a sprint
   */
  const deleteSprint = useCallback(async (sprintId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const { error: deleteError } = await supabase
        .from("sprints")
        .delete()
        .eq("id", sprintId);

      if (deleteError) {
        throw new Error(deleteError.message);
      }

      toast.success("Sprint deleted successfully");
      return true;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete sprint";
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Vote on a sprint
   */
  const voteSprint = useCallback(async (sprintId: string, increment: number = 1) => {
    try {
      const { data: current } = await supabase
        .from("sprints")
        .select("votes")
        .eq("id", sprintId)
        .single();

      if (current) {
        await supabase
          .from("sprints")
          .update({ votes: (current.votes || 0) + increment })
          .eq("id", sprintId);
      }

      return true;
    } catch (err) {
      console.error("Failed to vote:", err);
      return false;
    }
  }, []);

  // Ideas management
  const fetchIdeas = useCallback(async (sprintId?: string) => {
    try {
      let query = supabase
        .from("ideas")
        .select(`
          *,
          proposer:persons!ideas_proposer_person_id_fkey(id, name, role)
        `)
        .order("created_at", { ascending: false });

      if (sprintId) {
        query = query.eq("sprint_id", sprintId);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data as Idea[];
    } catch (err) {
      console.error("Failed to fetch ideas:", err);
      return [];
    }
  }, []);

  const createIdea = useCallback(async (params: CreateIdeaParams) => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("ideas")
        .insert(params)
        .select()
        .single();

      if (error) throw error;

      // Create timeline event
      await supabase.from("timeline_events").insert({
        event_type: "idea_proposed",
        title: `Idea proposed: ${data.title}`,
        description: data.description,
        entity_type: "idea",
        entity_id: data.id,
      });

      toast.success("Idea proposed successfully");
      return data as Idea;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create idea";
      toast.error(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const voteIdea = useCallback(async (ideaId: string, isUpvote: boolean) => {
    try {
      const field = isUpvote ? "upvotes" : "downvotes";
      const { data: current } = await supabase
        .from("ideas")
        .select(`${field}`)
        .eq("id", ideaId)
        .single();

      if (current) {
        await supabase
          .from("ideas")
          .update({ [field]: ((current as Record<string, number>)[field] || 0) + 1 })
          .eq("id", ideaId);
      }

      return true;
    } catch (err) {
      console.error("Failed to vote on idea:", err);
      return false;
    }
  }, []);

  return {
    isLoading,
    error,
    // Sprints
    fetchSprints,
    createSprint,
    updateSprint,
    deleteSprint,
    voteSprint,
    // Ideas
    fetchIdeas,
    createIdea,
    voteIdea,
  };
}
