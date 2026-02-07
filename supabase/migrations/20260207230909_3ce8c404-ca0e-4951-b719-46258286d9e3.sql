-- =====================================================
-- SECURITY FIX: Replace public RLS policies with authenticated access
-- =====================================================

-- First, drop all existing overly permissive public policies
-- and replace with authenticated-user-only policies

-- === CONFLICTS TABLE ===
DROP POLICY IF EXISTS "Public read conflicts" ON public.conflicts;
DROP POLICY IF EXISTS "Public write conflicts" ON public.conflicts;
DROP POLICY IF EXISTS "Public update conflicts" ON public.conflicts;
DROP POLICY IF EXISTS "Public delete conflicts" ON public.conflicts;

CREATE POLICY "Authenticated users can read conflicts" ON public.conflicts
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert conflicts" ON public.conflicts
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update conflicts" ON public.conflicts
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete conflicts" ON public.conflicts
  FOR DELETE TO authenticated USING (true);

-- === DECISION_AFFECTED_TEAMS TABLE ===
DROP POLICY IF EXISTS "Public read decision_affected_teams" ON public.decision_affected_teams;
DROP POLICY IF EXISTS "Public write decision_affected_teams" ON public.decision_affected_teams;
DROP POLICY IF EXISTS "Public update decision_affected_teams" ON public.decision_affected_teams;
DROP POLICY IF EXISTS "Public delete decision_affected_teams" ON public.decision_affected_teams;

CREATE POLICY "Authenticated users can read decision_affected_teams" ON public.decision_affected_teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert decision_affected_teams" ON public.decision_affected_teams
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update decision_affected_teams" ON public.decision_affected_teams
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete decision_affected_teams" ON public.decision_affected_teams
  FOR DELETE TO authenticated USING (true);

-- === DECISION_VERSIONS TABLE ===
DROP POLICY IF EXISTS "Public read decision_versions" ON public.decision_versions;
DROP POLICY IF EXISTS "Public write decision_versions" ON public.decision_versions;
DROP POLICY IF EXISTS "Public update decision_versions" ON public.decision_versions;
DROP POLICY IF EXISTS "Public delete decision_versions" ON public.decision_versions;

CREATE POLICY "Authenticated users can read decision_versions" ON public.decision_versions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert decision_versions" ON public.decision_versions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update decision_versions" ON public.decision_versions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete decision_versions" ON public.decision_versions
  FOR DELETE TO authenticated USING (true);

-- === DECISIONS TABLE ===
DROP POLICY IF EXISTS "Public read decisions" ON public.decisions;
DROP POLICY IF EXISTS "Public write decisions" ON public.decisions;
DROP POLICY IF EXISTS "Public update decisions" ON public.decisions;
DROP POLICY IF EXISTS "Public delete decisions" ON public.decisions;

CREATE POLICY "Authenticated users can read decisions" ON public.decisions
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert decisions" ON public.decisions
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update decisions" ON public.decisions
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete decisions" ON public.decisions
  FOR DELETE TO authenticated USING (true);

-- === DOCUMENTS TABLE ===
DROP POLICY IF EXISTS "Public read documents" ON public.documents;
DROP POLICY IF EXISTS "Public write documents" ON public.documents;
DROP POLICY IF EXISTS "Public update documents" ON public.documents;
DROP POLICY IF EXISTS "Public delete documents" ON public.documents;

CREATE POLICY "Authenticated users can read documents" ON public.documents
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert documents" ON public.documents
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update documents" ON public.documents
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete documents" ON public.documents
  FOR DELETE TO authenticated USING (true);

-- === EMBEDDINGS TABLE ===
DROP POLICY IF EXISTS "Public read embeddings" ON public.embeddings;
DROP POLICY IF EXISTS "Public write embeddings" ON public.embeddings;
DROP POLICY IF EXISTS "Public update embeddings" ON public.embeddings;
DROP POLICY IF EXISTS "Public delete embeddings" ON public.embeddings;

CREATE POLICY "Authenticated users can read embeddings" ON public.embeddings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert embeddings" ON public.embeddings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update embeddings" ON public.embeddings
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete embeddings" ON public.embeddings
  FOR DELETE TO authenticated USING (true);

-- === EXPERIMENTS TABLE ===
DROP POLICY IF EXISTS "Public read experiments" ON public.experiments;
DROP POLICY IF EXISTS "Public write experiments" ON public.experiments;
DROP POLICY IF EXISTS "Public update experiments" ON public.experiments;
DROP POLICY IF EXISTS "Public delete experiments" ON public.experiments;

CREATE POLICY "Authenticated users can read experiments" ON public.experiments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert experiments" ON public.experiments
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update experiments" ON public.experiments
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete experiments" ON public.experiments
  FOR DELETE TO authenticated USING (true);

-- === GRAPH_EDGES TABLE ===
DROP POLICY IF EXISTS "Public read graph_edges" ON public.graph_edges;
DROP POLICY IF EXISTS "Public write graph_edges" ON public.graph_edges;
DROP POLICY IF EXISTS "Public update graph_edges" ON public.graph_edges;
DROP POLICY IF EXISTS "Public delete graph_edges" ON public.graph_edges;

CREATE POLICY "Authenticated users can read graph_edges" ON public.graph_edges
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert graph_edges" ON public.graph_edges
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update graph_edges" ON public.graph_edges
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete graph_edges" ON public.graph_edges
  FOR DELETE TO authenticated USING (true);

-- === IDEAS TABLE ===
DROP POLICY IF EXISTS "Public read ideas" ON public.ideas;
DROP POLICY IF EXISTS "Public write ideas" ON public.ideas;
DROP POLICY IF EXISTS "Public update ideas" ON public.ideas;
DROP POLICY IF EXISTS "Public delete ideas" ON public.ideas;

CREATE POLICY "Authenticated users can read ideas" ON public.ideas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert ideas" ON public.ideas
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update ideas" ON public.ideas
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete ideas" ON public.ideas
  FOR DELETE TO authenticated USING (true);

-- === MESSAGES TABLE ===
DROP POLICY IF EXISTS "Public read messages" ON public.messages;
DROP POLICY IF EXISTS "Public write messages" ON public.messages;
DROP POLICY IF EXISTS "Public update messages" ON public.messages;
DROP POLICY IF EXISTS "Public delete messages" ON public.messages;

CREATE POLICY "Authenticated users can read messages" ON public.messages
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert messages" ON public.messages
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update messages" ON public.messages
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete messages" ON public.messages
  FOR DELETE TO authenticated USING (true);

-- === ORG_SETTINGS TABLE ===
DROP POLICY IF EXISTS "Public read org_settings" ON public.org_settings;
DROP POLICY IF EXISTS "Public write org_settings" ON public.org_settings;
DROP POLICY IF EXISTS "Public update org_settings" ON public.org_settings;
DROP POLICY IF EXISTS "Public delete org_settings" ON public.org_settings;

CREATE POLICY "Authenticated users can read org_settings" ON public.org_settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert org_settings" ON public.org_settings
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update org_settings" ON public.org_settings
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete org_settings" ON public.org_settings
  FOR DELETE TO authenticated USING (true);

-- === PERSONS TABLE ===
DROP POLICY IF EXISTS "Public read persons" ON public.persons;
DROP POLICY IF EXISTS "Public write persons" ON public.persons;
DROP POLICY IF EXISTS "Public update persons" ON public.persons;
DROP POLICY IF EXISTS "Public delete persons" ON public.persons;

CREATE POLICY "Authenticated users can read persons" ON public.persons
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert persons" ON public.persons
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update persons" ON public.persons
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete persons" ON public.persons
  FOR DELETE TO authenticated USING (true);

-- === ROUTING_LOGS TABLE ===
DROP POLICY IF EXISTS "Public read routing_logs" ON public.routing_logs;
DROP POLICY IF EXISTS "Public write routing_logs" ON public.routing_logs;
DROP POLICY IF EXISTS "Public update routing_logs" ON public.routing_logs;
DROP POLICY IF EXISTS "Public delete routing_logs" ON public.routing_logs;

CREATE POLICY "Authenticated users can read routing_logs" ON public.routing_logs
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert routing_logs" ON public.routing_logs
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update routing_logs" ON public.routing_logs
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete routing_logs" ON public.routing_logs
  FOR DELETE TO authenticated USING (true);

-- === SPRINT_LINKED_NODES TABLE ===
DROP POLICY IF EXISTS "Public read sprint_linked_nodes" ON public.sprint_linked_nodes;
DROP POLICY IF EXISTS "Public write sprint_linked_nodes" ON public.sprint_linked_nodes;
DROP POLICY IF EXISTS "Public update sprint_linked_nodes" ON public.sprint_linked_nodes;
DROP POLICY IF EXISTS "Public delete sprint_linked_nodes" ON public.sprint_linked_nodes;

CREATE POLICY "Authenticated users can read sprint_linked_nodes" ON public.sprint_linked_nodes
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sprint_linked_nodes" ON public.sprint_linked_nodes
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sprint_linked_nodes" ON public.sprint_linked_nodes
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sprint_linked_nodes" ON public.sprint_linked_nodes
  FOR DELETE TO authenticated USING (true);

-- === SPRINTS TABLE ===
DROP POLICY IF EXISTS "Public read sprints" ON public.sprints;
DROP POLICY IF EXISTS "Public write sprints" ON public.sprints;
DROP POLICY IF EXISTS "Public update sprints" ON public.sprints;
DROP POLICY IF EXISTS "Public delete sprints" ON public.sprints;

CREATE POLICY "Authenticated users can read sprints" ON public.sprints
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert sprints" ON public.sprints
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update sprints" ON public.sprints
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete sprints" ON public.sprints
  FOR DELETE TO authenticated USING (true);

-- === TEAMS TABLE ===
DROP POLICY IF EXISTS "Public read teams" ON public.teams;
DROP POLICY IF EXISTS "Public write teams" ON public.teams;
DROP POLICY IF EXISTS "Public update teams" ON public.teams;
DROP POLICY IF EXISTS "Public delete teams" ON public.teams;

CREATE POLICY "Authenticated users can read teams" ON public.teams
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert teams" ON public.teams
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update teams" ON public.teams
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete teams" ON public.teams
  FOR DELETE TO authenticated USING (true);

-- === TIMELINE_EVENTS TABLE ===
DROP POLICY IF EXISTS "Public read timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "Public write timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "Public update timeline_events" ON public.timeline_events;
DROP POLICY IF EXISTS "Public delete timeline_events" ON public.timeline_events;

CREATE POLICY "Authenticated users can read timeline_events" ON public.timeline_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert timeline_events" ON public.timeline_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update timeline_events" ON public.timeline_events
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete timeline_events" ON public.timeline_events
  FOR DELETE TO authenticated USING (true);

-- === TOPICS TABLE ===
DROP POLICY IF EXISTS "Public read topics" ON public.topics;
DROP POLICY IF EXISTS "Public write topics" ON public.topics;
DROP POLICY IF EXISTS "Public update topics" ON public.topics;
DROP POLICY IF EXISTS "Public delete topics" ON public.topics;

CREATE POLICY "Authenticated users can read topics" ON public.topics
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert topics" ON public.topics
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update topics" ON public.topics
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete topics" ON public.topics
  FOR DELETE TO authenticated USING (true);

-- === UPDATE_EVENT_ENTITIES TABLE ===
DROP POLICY IF EXISTS "Public read update_event_entities" ON public.update_event_entities;
DROP POLICY IF EXISTS "Public write update_event_entities" ON public.update_event_entities;
DROP POLICY IF EXISTS "Public update update_event_entities" ON public.update_event_entities;
DROP POLICY IF EXISTS "Public delete update_event_entities" ON public.update_event_entities;

CREATE POLICY "Authenticated users can read update_event_entities" ON public.update_event_entities
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert update_event_entities" ON public.update_event_entities
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update update_event_entities" ON public.update_event_entities
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete update_event_entities" ON public.update_event_entities
  FOR DELETE TO authenticated USING (true);

-- === UPDATE_EVENTS TABLE ===
DROP POLICY IF EXISTS "Public read update_events" ON public.update_events;
DROP POLICY IF EXISTS "Public write update_events" ON public.update_events;
DROP POLICY IF EXISTS "Public update update_events" ON public.update_events;
DROP POLICY IF EXISTS "Public delete update_events" ON public.update_events;

CREATE POLICY "Authenticated users can read update_events" ON public.update_events
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert update_events" ON public.update_events
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update update_events" ON public.update_events
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete update_events" ON public.update_events
  FOR DELETE TO authenticated USING (true);

-- === WORKFLOW_PROPOSALS TABLE ===
DROP POLICY IF EXISTS "Public read workflow_proposals" ON public.workflow_proposals;
DROP POLICY IF EXISTS "Public write workflow_proposals" ON public.workflow_proposals;
DROP POLICY IF EXISTS "Public update workflow_proposals" ON public.workflow_proposals;
DROP POLICY IF EXISTS "Public delete workflow_proposals" ON public.workflow_proposals;

CREATE POLICY "Authenticated users can read workflow_proposals" ON public.workflow_proposals
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated users can insert workflow_proposals" ON public.workflow_proposals
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Authenticated users can update workflow_proposals" ON public.workflow_proposals
  FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Authenticated users can delete workflow_proposals" ON public.workflow_proposals
  FOR DELETE TO authenticated USING (true);