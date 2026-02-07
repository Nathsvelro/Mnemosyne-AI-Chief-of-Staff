-- =====================================================
-- MNEMOSYNE DATA LAYER: Graph-RAG Architecture
-- =====================================================

-- 1. Enable pgvector extension for semantic retrieval
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Add new entity types for expanded graph model
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'initiative';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'process';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'risk';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'system';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'kpi';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'idea';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'experiment';
ALTER TYPE entity_type ADD VALUE IF NOT EXISTS 'sprint';

-- 3. Add new edge types for richer relationships
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'aligns_with';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'impacts';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'governs';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'measures';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'blocks';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'derived_from';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'replaces';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'supersedes';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'uses_system';
ALTER TYPE edge_type ADD VALUE IF NOT EXISTS 'risk_of';

-- 4. Create embeddings table for vector storage
CREATE TABLE public.embeddings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  -- What is embedded
  source_type TEXT NOT NULL, -- 'document_chunk', 'node_summary', 'decision_record', 'sprint_artifact'
  source_id UUID NOT NULL,
  chunk_index INTEGER DEFAULT 0, -- for chunked documents
  
  -- The embedding vector (1536 dimensions for OpenAI embeddings)
  embedding vector(1536) NOT NULL,
  
  -- The text content that was embedded
  content TEXT NOT NULL,
  
  -- Metadata for filtering
  metadata JSONB DEFAULT '{}'::jsonb,
  -- Contains: {org_unit, project, access_labels, graph_node_ids[], doc_id, date}
  
  -- Graph linkage
  linked_node_ids UUID[] DEFAULT '{}',
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create index for vector similarity search
CREATE INDEX embeddings_vector_idx ON public.embeddings 
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Create index for source lookups
CREATE INDEX embeddings_source_idx ON public.embeddings (source_type, source_id);

-- Create index for metadata filtering
CREATE INDEX embeddings_metadata_idx ON public.embeddings USING gin (metadata);

-- 5. Create Innovation Sprints tables
CREATE TYPE sprint_status AS ENUM ('draft', 'active', 'review', 'completed', 'cancelled');
CREATE TYPE sprint_source AS ENUM ('trend', 'pain_point', 'conflict', 'crisis', 'opportunity', 'strategic');
CREATE TYPE idea_status AS ENUM ('proposed', 'exploring', 'validated', 'rejected', 'implemented');

-- Sprints table
CREATE TABLE public.sprints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status sprint_status NOT NULL DEFAULT 'draft',
  source sprint_source NOT NULL DEFAULT 'opportunity',
  
  -- Ownership
  owner_person_id UUID REFERENCES public.persons(id),
  
  -- Structured content (from wizard)
  problem_statement TEXT,
  stakeholder_impact TEXT,
  risks_assumptions TEXT,
  strategic_alignment TEXT,
  
  -- AI analysis results
  ai_analysis JSONB DEFAULT '{}'::jsonb,
  -- Contains: {second_order_effects[], tradeoffs[], related_decisions[], confidence}
  
  -- Metrics
  votes INTEGER DEFAULT 0,
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sprint linked nodes (many-to-many)
CREATE TABLE public.sprint_linked_nodes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID NOT NULL REFERENCES public.sprints(id) ON DELETE CASCADE,
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  link_reason TEXT, -- Why this node is linked
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(sprint_id, entity_type, entity_id)
);

-- Ideas table (proposals within or outside sprints)
CREATE TABLE public.ideas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL, -- Optional sprint association
  title TEXT NOT NULL,
  description TEXT,
  status idea_status NOT NULL DEFAULT 'proposed',
  
  -- Ownership
  proposer_person_id UUID REFERENCES public.persons(id),
  
  -- Structured content
  hypothesis TEXT,
  success_criteria TEXT,
  measurement_plan TEXT,
  
  -- Voting
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Experiments table (validation activities)
CREATE TABLE public.experiments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  idea_id UUID REFERENCES public.ideas(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  
  title TEXT NOT NULL,
  hypothesis TEXT NOT NULL,
  methodology TEXT,
  success_metrics JSONB DEFAULT '[]'::jsonb,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'planned', -- planned, running, completed, abandoned
  
  -- Results
  results_summary TEXT,
  outcome TEXT, -- 'validated', 'invalidated', 'inconclusive'
  data_collected JSONB DEFAULT '{}'::jsonb,
  
  -- Timeline
  start_date DATE,
  end_date DATE,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 6. Create timeline/history events table
CREATE TYPE timeline_event_type AS ENUM (
  'decision_created', 'decision_updated', 'decision_deprecated',
  'conflict_opened', 'conflict_resolved',
  'initiative_started', 'initiative_ended',
  'sprint_created', 'sprint_completed',
  'idea_proposed', 'experiment_completed',
  'team_change', 'knowledge_update', 'system_event'
);

CREATE TABLE public.timeline_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type timeline_event_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  -- Who triggered this event
  actor_person_id UUID REFERENCES public.persons(id),
  actor_name TEXT, -- Denormalized for display
  
  -- What entity this relates to
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  
  -- Event details
  details JSONB DEFAULT '{}'::jsonb,
  -- Contains: {previous_value, new_value, reason, outcome, linked_entities[]}
  
  -- AI insight
  ai_insight TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX timeline_events_entity_idx ON public.timeline_events (entity_type, entity_id);
CREATE INDEX timeline_events_created_idx ON public.timeline_events (created_at DESC);

-- 7. Create workflow proposals table (for Workflow Agent)
CREATE TYPE proposal_status AS ENUM ('draft', 'pending_review', 'approved', 'rejected', 'implemented');
CREATE TYPE proposal_type AS ENUM ('optimization', 'governance', 'role', 'process', 'redundancy', 'automation');

CREATE TABLE public.workflow_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_type proposal_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- AI analysis
  reasoning TEXT NOT NULL,
  impact TEXT NOT NULL DEFAULT 'medium', -- high, medium, low
  effort TEXT NOT NULL DEFAULT 'medium',
  confidence INTEGER DEFAULT 75, -- 0-100
  
  -- Alternatives
  alternatives TEXT[] DEFAULT '{}',
  
  -- Affected entities (graph nodes)
  affected_node_ids UUID[] DEFAULT '{}',
  
  -- Status and approval
  status proposal_status NOT NULL DEFAULT 'pending_review',
  reviewed_by_person_id UUID REFERENCES public.persons(id),
  review_notes TEXT,
  
  -- Implementation
  implementation_plan TEXT,
  rollback_plan TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 8. Enable RLS on new tables
ALTER TABLE public.embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprint_linked_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_proposals ENABLE ROW LEVEL SECURITY;

-- 9. Create public read/write policies (adjust for production with proper auth)
CREATE POLICY "Public read embeddings" ON public.embeddings FOR SELECT USING (true);
CREATE POLICY "Public write embeddings" ON public.embeddings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update embeddings" ON public.embeddings FOR UPDATE USING (true);
CREATE POLICY "Public delete embeddings" ON public.embeddings FOR DELETE USING (true);

CREATE POLICY "Public read sprints" ON public.sprints FOR SELECT USING (true);
CREATE POLICY "Public write sprints" ON public.sprints FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sprints" ON public.sprints FOR UPDATE USING (true);
CREATE POLICY "Public delete sprints" ON public.sprints FOR DELETE USING (true);

CREATE POLICY "Public read sprint_linked_nodes" ON public.sprint_linked_nodes FOR SELECT USING (true);
CREATE POLICY "Public write sprint_linked_nodes" ON public.sprint_linked_nodes FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update sprint_linked_nodes" ON public.sprint_linked_nodes FOR UPDATE USING (true);
CREATE POLICY "Public delete sprint_linked_nodes" ON public.sprint_linked_nodes FOR DELETE USING (true);

CREATE POLICY "Public read ideas" ON public.ideas FOR SELECT USING (true);
CREATE POLICY "Public write ideas" ON public.ideas FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update ideas" ON public.ideas FOR UPDATE USING (true);
CREATE POLICY "Public delete ideas" ON public.ideas FOR DELETE USING (true);

CREATE POLICY "Public read experiments" ON public.experiments FOR SELECT USING (true);
CREATE POLICY "Public write experiments" ON public.experiments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update experiments" ON public.experiments FOR UPDATE USING (true);
CREATE POLICY "Public delete experiments" ON public.experiments FOR DELETE USING (true);

CREATE POLICY "Public read timeline_events" ON public.timeline_events FOR SELECT USING (true);
CREATE POLICY "Public write timeline_events" ON public.timeline_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update timeline_events" ON public.timeline_events FOR UPDATE USING (true);
CREATE POLICY "Public delete timeline_events" ON public.timeline_events FOR DELETE USING (true);

CREATE POLICY "Public read workflow_proposals" ON public.workflow_proposals FOR SELECT USING (true);
CREATE POLICY "Public write workflow_proposals" ON public.workflow_proposals FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update workflow_proposals" ON public.workflow_proposals FOR UPDATE USING (true);
CREATE POLICY "Public delete workflow_proposals" ON public.workflow_proposals FOR DELETE USING (true);

-- 10. Create triggers for updated_at
CREATE TRIGGER update_embeddings_updated_at
  BEFORE UPDATE ON public.embeddings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ideas_updated_at
  BEFORE UPDATE ON public.ideas
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_experiments_updated_at
  BEFORE UPDATE ON public.experiments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workflow_proposals_updated_at
  BEFORE UPDATE ON public.workflow_proposals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 11. Create graph traversal function for k-hop expansion
CREATE OR REPLACE FUNCTION public.graph_traverse(
  start_entity_type entity_type,
  start_entity_id UUID,
  max_hops INTEGER DEFAULT 2,
  edge_filter edge_type[] DEFAULT NULL
)
RETURNS TABLE (
  hop_level INTEGER,
  entity_type entity_type,
  entity_id UUID,
  via_edge_type edge_type,
  via_edge_id UUID
) AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE traversal AS (
    -- Base case: starting node
    SELECT 
      0 AS hop_level,
      start_entity_type AS entity_type,
      start_entity_id AS entity_id,
      NULL::edge_type AS via_edge_type,
      NULL::UUID AS via_edge_id
    
    UNION
    
    -- Recursive case: follow edges
    SELECT 
      t.hop_level + 1,
      CASE 
        WHEN e.from_entity_id = t.entity_id AND e.from_entity_type = t.entity_type 
        THEN e.to_entity_type 
        ELSE e.from_entity_type 
      END AS entity_type,
      CASE 
        WHEN e.from_entity_id = t.entity_id AND e.from_entity_type = t.entity_type 
        THEN e.to_entity_id 
        ELSE e.from_entity_id 
      END AS entity_id,
      e.edge_type AS via_edge_type,
      e.id AS via_edge_id
    FROM traversal t
    JOIN graph_edges e ON (
      (e.from_entity_id = t.entity_id AND e.from_entity_type = t.entity_type)
      OR 
      (e.to_entity_id = t.entity_id AND e.to_entity_type = t.entity_type)
    )
    WHERE t.hop_level < max_hops
      AND (edge_filter IS NULL OR e.edge_type = ANY(edge_filter))
  )
  SELECT DISTINCT ON (traversal.entity_type, traversal.entity_id)
    traversal.hop_level,
    traversal.entity_type,
    traversal.entity_id,
    traversal.via_edge_type,
    traversal.via_edge_id
  FROM traversal
  ORDER BY traversal.entity_type, traversal.entity_id, traversal.hop_level;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 12. Create semantic search function
CREATE OR REPLACE FUNCTION public.semantic_search(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INTEGER DEFAULT 10,
  source_type_filter TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  source_type TEXT,
  source_id UUID,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  linked_node_ids UUID[],
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.source_type,
    e.source_id,
    e.chunk_index,
    e.content,
    e.metadata,
    e.linked_node_ids,
    1 - (e.embedding <=> query_embedding) AS similarity
  FROM embeddings e
  WHERE 
    (source_type_filter IS NULL OR e.source_type = source_type_filter)
    AND 1 - (e.embedding <=> query_embedding) > match_threshold
  ORDER BY e.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 13. Create function to get entity details by type
CREATE OR REPLACE FUNCTION public.get_entity_details(
  p_entity_type entity_type,
  p_entity_id UUID
)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  CASE p_entity_type
    WHEN 'person' THEN
      SELECT jsonb_build_object(
        'id', id, 'name', name, 'role', role, 'email', email, 
        'load_score', load_score, 'team_id', team_id
      ) INTO result FROM persons WHERE id = p_entity_id;
    WHEN 'team' THEN
      SELECT jsonb_build_object(
        'id', id, 'name', name, 'description', description, 
        'lead_person_id', lead_person_id
      ) INTO result FROM teams WHERE id = p_entity_id;
    WHEN 'topic' THEN
      SELECT jsonb_build_object(
        'id', id, 'name', name, 'description', description
      ) INTO result FROM topics WHERE id = p_entity_id;
    WHEN 'decision' THEN
      SELECT jsonb_build_object(
        'id', id, 'title', title, 'canonical_text', canonical_text, 
        'status', status, 'confidence', confidence, 'owner_person_id', owner_person_id
      ) INTO result FROM decisions WHERE id = p_entity_id;
    WHEN 'document' THEN
      SELECT jsonb_build_object(
        'id', id, 'title', title, 'content', LEFT(content, 500), 
        'url', url, 'owner_person_id', owner_person_id
      ) INTO result FROM documents WHERE id = p_entity_id;
    ELSE
      result := jsonb_build_object('id', p_entity_id, 'type', p_entity_type);
  END CASE;
  
  RETURN COALESCE(result, jsonb_build_object('id', p_entity_id, 'not_found', true));
END;
$$ LANGUAGE plpgsql SET search_path = public;