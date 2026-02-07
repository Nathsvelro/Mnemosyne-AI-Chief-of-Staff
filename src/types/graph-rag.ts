// Extended database types for the Graph-RAG architecture
// These extend the auto-generated Supabase types

import type { Database } from "@/integrations/supabase/types";

// Extended entity types (includes new graph model entities)
export type ExtendedEntityType = 
  | 'person' 
  | 'team' 
  | 'topic' 
  | 'decision' 
  | 'document'
  | 'initiative'
  | 'process'
  | 'risk'
  | 'system'
  | 'kpi'
  | 'idea'
  | 'experiment'
  | 'sprint';

// Extended edge types for richer relationships
export type ExtendedEdgeType = 
  | 'communicates_with' 
  | 'owns' 
  | 'depends_on' 
  | 'references' 
  | 'contradicts'
  | 'aligns_with'
  | 'impacts'
  | 'governs'
  | 'measures'
  | 'blocks'
  | 'derived_from'
  | 'replaces'
  | 'supersedes'
  | 'uses_system'
  | 'risk_of';

// Sprint types
export type SprintStatus = 'draft' | 'active' | 'review' | 'completed' | 'cancelled';
export type SprintSource = 'trend' | 'pain_point' | 'conflict' | 'crisis' | 'opportunity' | 'strategic';
export type IdeaStatus = 'proposed' | 'exploring' | 'validated' | 'rejected' | 'implemented';

// Proposal types
export type ProposalStatus = 'draft' | 'pending_review' | 'approved' | 'rejected' | 'implemented';
export type ProposalType = 'optimization' | 'governance' | 'role' | 'process' | 'redundancy' | 'automation';

// Timeline event types
export type TimelineEventType = 
  | 'decision_created' | 'decision_updated' | 'decision_deprecated'
  | 'conflict_opened' | 'conflict_resolved'
  | 'initiative_started' | 'initiative_ended'
  | 'sprint_created' | 'sprint_completed'
  | 'idea_proposed' | 'experiment_completed'
  | 'team_change' | 'knowledge_update' | 'system_event';

// Sprint entity
export interface Sprint {
  id: string;
  title: string;
  description: string | null;
  status: SprintStatus;
  source: SprintSource;
  owner_person_id: string | null;
  problem_statement: string | null;
  stakeholder_impact: string | null;
  risks_assumptions: string | null;
  strategic_alignment: string | null;
  ai_analysis: {
    second_order_effects?: string[];
    tradeoffs?: string[];
    related_decisions?: string[];
    confidence?: number;
  };
  votes: number;
  progress: number;
  created_at: string;
  updated_at: string;
  // Joined data
  owner?: Person;
  linked_nodes?: SprintLinkedNode[];
}

export interface SprintLinkedNode {
  id: string;
  sprint_id: string;
  entity_type: ExtendedEntityType;
  entity_id: string;
  link_reason: string | null;
  created_at: string;
}

// Idea entity
export interface Idea {
  id: string;
  sprint_id: string | null;
  title: string;
  description: string | null;
  status: IdeaStatus;
  proposer_person_id: string | null;
  hypothesis: string | null;
  success_criteria: string | null;
  measurement_plan: string | null;
  upvotes: number;
  downvotes: number;
  created_at: string;
  updated_at: string;
  // Joined
  proposer?: Person;
  sprint?: Sprint;
}

// Experiment entity
export interface Experiment {
  id: string;
  idea_id: string | null;
  sprint_id: string | null;
  title: string;
  hypothesis: string;
  methodology: string | null;
  success_metrics: unknown[];
  status: string;
  results_summary: string | null;
  outcome: 'validated' | 'invalidated' | 'inconclusive' | null;
  data_collected: Record<string, unknown>;
  start_date: string | null;
  end_date: string | null;
  created_at: string;
  updated_at: string;
}

// Timeline event entity
export interface TimelineEvent {
  id: string;
  event_type: TimelineEventType;
  title: string;
  description: string | null;
  actor_person_id: string | null;
  actor_name: string | null;
  entity_type: ExtendedEntityType;
  entity_id: string;
  details: {
    previous_value?: string;
    new_value?: string;
    reason?: string;
    outcome?: 'success' | 'failure' | 'partial';
    linked_entities?: string[];
  };
  ai_insight: string | null;
  created_at: string;
}

// Workflow proposal entity
export interface WorkflowProposal {
  id: string;
  proposal_type: ProposalType;
  title: string;
  description: string;
  reasoning: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  confidence: number;
  alternatives: string[];
  affected_node_ids: string[];
  status: ProposalStatus;
  reviewed_by_person_id: string | null;
  review_notes: string | null;
  implementation_plan: string | null;
  rollback_plan: string | null;
  created_at: string;
  updated_at: string;
}

// Embedding entity
export interface Embedding {
  id: string;
  source_type: 'document_chunk' | 'node_summary' | 'decision_record' | 'sprint_artifact';
  source_id: string;
  chunk_index: number;
  content: string;
  metadata: {
    org_unit?: string;
    project?: string;
    access_labels?: string[];
    graph_node_ids?: string[];
    doc_id?: string;
    date?: string;
  };
  linked_node_ids: string[];
  created_at: string;
  updated_at: string;
}

// Graph traversal result
export interface GraphTraversalNode {
  hop_level: number;
  entity_type: ExtendedEntityType;
  entity_id: string;
  via_edge_type: ExtendedEdgeType | null;
  via_edge_id: string | null;
}

// Semantic search result
export interface SemanticSearchResult {
  id: string;
  source_type: string;
  source_id: string;
  chunk_index: number;
  content: string;
  metadata: Record<string, unknown>;
  linked_node_ids: string[];
  similarity: number;
  citation: string;
}

// Graph-RAG response
export interface GraphRAGResponse {
  query: string;
  answer: string;
  sources: {
    vector_results: number;
    entity_matches: number;
    graph_expansions: number;
  };
  evidence: {
    documents: {
      source_id: string;
      similarity: number;
      excerpt: string;
    }[];
    entities: {
      type: string;
      id: string;
      name: string;
    }[];
    graph_connections: number;
  };
  metadata: {
    model: string;
    graph_hops: number;
    timestamp: string;
  };
}

// Re-export base types
export type { Database };

// Import from database.ts for backwards compatibility
import type { 
  Person, 
  Team, 
  Topic, 
  Decision, 
  Document as OrgDocument,
  UpdateEvent,
  Conflict,
  GraphEdge,
  RoutingLog,
} from './database';

export type { 
  Person, 
  Team, 
  Topic, 
  Decision, 
  OrgDocument,
  UpdateEvent,
  Conflict,
  GraphEdge,
  RoutingLog,
};
