-- Create enums
CREATE TYPE public.decision_status AS ENUM ('proposed', 'confirmed', 'deprecated');
CREATE TYPE public.update_event_type AS ENUM ('decision', 'knowledge', 'stakeholder', 'risk');
CREATE TYPE public.edge_type AS ENUM ('communicates_with', 'owns', 'depends_on', 'references', 'contradicts');
CREATE TYPE public.conflict_status AS ENUM ('open', 'resolved', 'dismissed');
CREATE TYPE public.entity_type AS ENUM ('person', 'team', 'topic', 'decision', 'document');

-- Teams table
CREATE TABLE public.teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    lead_person_id UUID,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Persons table
CREATE TABLE public.persons (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    role TEXT,
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    email TEXT UNIQUE,
    avatar_url TEXT,
    load_score INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key for team lead after persons exists
ALTER TABLE public.teams ADD CONSTRAINT fk_teams_lead_person FOREIGN KEY (lead_person_id) REFERENCES public.persons(id) ON DELETE SET NULL;

-- Topics table (without vector for now)
CREATE TABLE public.topics (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decisions table
CREATE TABLE public.decisions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    canonical_text TEXT NOT NULL,
    status public.decision_status NOT NULL DEFAULT 'proposed',
    owner_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    confidence DECIMAL(3,2) DEFAULT 0.8,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Decision versions table
CREATE TABLE public.decision_versions (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
    version_num INTEGER NOT NULL,
    text TEXT NOT NULL,
    changed_by UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(decision_id, version_num)
);

-- Decision affected teams junction table
CREATE TABLE public.decision_affected_teams (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    decision_id UUID NOT NULL REFERENCES public.decisions(id) ON DELETE CASCADE,
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(decision_id, team_id)
);

-- Update events table
CREATE TABLE public.update_events (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    type public.update_event_type NOT NULL,
    summary TEXT NOT NULL,
    why_it_matters TEXT,
    impact_score INTEGER DEFAULT 5,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Update event impacted entities
CREATE TABLE public.update_event_entities (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    update_event_id UUID NOT NULL REFERENCES public.update_events(id) ON DELETE CASCADE,
    entity_type public.entity_type NOT NULL,
    entity_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Messages table (without vector for now)
CREATE TABLE public.messages (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    source TEXT NOT NULL,
    author_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    raw_text TEXT NOT NULL,
    parsed_json JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Graph edges table
CREATE TABLE public.graph_edges (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    from_entity_type public.entity_type NOT NULL,
    from_entity_id UUID NOT NULL,
    to_entity_type public.entity_type NOT NULL,
    to_entity_id UUID NOT NULL,
    edge_type public.edge_type NOT NULL,
    weight DECIMAL(3,2) DEFAULT 1.0,
    last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Conflicts table
CREATE TABLE public.conflicts (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type public.entity_type NOT NULL,
    entity_id UUID NOT NULL,
    description TEXT NOT NULL,
    severity INTEGER DEFAULT 5 CHECK (severity >= 1 AND severity <= 10),
    status public.conflict_status NOT NULL DEFAULT 'open',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Routing logs table
CREATE TABLE public.routing_logs (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    entity_type public.entity_type NOT NULL,
    entity_id UUID NOT NULL,
    to_person_id UUID NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    action_required TEXT,
    is_read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    url TEXT,
    owner_person_id UUID REFERENCES public.persons(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Organization settings table
CREATE TABLE public.org_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    org_name TEXT NOT NULL DEFAULT 'My Organization',
    ceo_name TEXT DEFAULT 'Nathaniel Velazquez',
    ceo_view_enabled BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.decision_affected_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.update_event_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.graph_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.routing_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_settings ENABLE ROW LEVEL SECURITY;

-- Public access policies (demo mode - no auth required)
CREATE POLICY "Public read teams" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Public write teams" ON public.teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update teams" ON public.teams FOR UPDATE USING (true);
CREATE POLICY "Public delete teams" ON public.teams FOR DELETE USING (true);

CREATE POLICY "Public read persons" ON public.persons FOR SELECT USING (true);
CREATE POLICY "Public write persons" ON public.persons FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update persons" ON public.persons FOR UPDATE USING (true);
CREATE POLICY "Public delete persons" ON public.persons FOR DELETE USING (true);

CREATE POLICY "Public read topics" ON public.topics FOR SELECT USING (true);
CREATE POLICY "Public write topics" ON public.topics FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update topics" ON public.topics FOR UPDATE USING (true);
CREATE POLICY "Public delete topics" ON public.topics FOR DELETE USING (true);

CREATE POLICY "Public read decisions" ON public.decisions FOR SELECT USING (true);
CREATE POLICY "Public write decisions" ON public.decisions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update decisions" ON public.decisions FOR UPDATE USING (true);
CREATE POLICY "Public delete decisions" ON public.decisions FOR DELETE USING (true);

CREATE POLICY "Public read decision_versions" ON public.decision_versions FOR SELECT USING (true);
CREATE POLICY "Public write decision_versions" ON public.decision_versions FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update decision_versions" ON public.decision_versions FOR UPDATE USING (true);
CREATE POLICY "Public delete decision_versions" ON public.decision_versions FOR DELETE USING (true);

CREATE POLICY "Public read decision_affected_teams" ON public.decision_affected_teams FOR SELECT USING (true);
CREATE POLICY "Public write decision_affected_teams" ON public.decision_affected_teams FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update decision_affected_teams" ON public.decision_affected_teams FOR UPDATE USING (true);
CREATE POLICY "Public delete decision_affected_teams" ON public.decision_affected_teams FOR DELETE USING (true);

CREATE POLICY "Public read update_events" ON public.update_events FOR SELECT USING (true);
CREATE POLICY "Public write update_events" ON public.update_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update update_events" ON public.update_events FOR UPDATE USING (true);
CREATE POLICY "Public delete update_events" ON public.update_events FOR DELETE USING (true);

CREATE POLICY "Public read update_event_entities" ON public.update_event_entities FOR SELECT USING (true);
CREATE POLICY "Public write update_event_entities" ON public.update_event_entities FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update update_event_entities" ON public.update_event_entities FOR UPDATE USING (true);
CREATE POLICY "Public delete update_event_entities" ON public.update_event_entities FOR DELETE USING (true);

CREATE POLICY "Public read messages" ON public.messages FOR SELECT USING (true);
CREATE POLICY "Public write messages" ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update messages" ON public.messages FOR UPDATE USING (true);
CREATE POLICY "Public delete messages" ON public.messages FOR DELETE USING (true);

CREATE POLICY "Public read graph_edges" ON public.graph_edges FOR SELECT USING (true);
CREATE POLICY "Public write graph_edges" ON public.graph_edges FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update graph_edges" ON public.graph_edges FOR UPDATE USING (true);
CREATE POLICY "Public delete graph_edges" ON public.graph_edges FOR DELETE USING (true);

CREATE POLICY "Public read conflicts" ON public.conflicts FOR SELECT USING (true);
CREATE POLICY "Public write conflicts" ON public.conflicts FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update conflicts" ON public.conflicts FOR UPDATE USING (true);
CREATE POLICY "Public delete conflicts" ON public.conflicts FOR DELETE USING (true);

CREATE POLICY "Public read routing_logs" ON public.routing_logs FOR SELECT USING (true);
CREATE POLICY "Public write routing_logs" ON public.routing_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update routing_logs" ON public.routing_logs FOR UPDATE USING (true);
CREATE POLICY "Public delete routing_logs" ON public.routing_logs FOR DELETE USING (true);

CREATE POLICY "Public read documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Public write documents" ON public.documents FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update documents" ON public.documents FOR UPDATE USING (true);
CREATE POLICY "Public delete documents" ON public.documents FOR DELETE USING (true);

CREATE POLICY "Public read org_settings" ON public.org_settings FOR SELECT USING (true);
CREATE POLICY "Public write org_settings" ON public.org_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update org_settings" ON public.org_settings FOR UPDATE USING (true);
CREATE POLICY "Public delete org_settings" ON public.org_settings FOR DELETE USING (true);

-- Create indexes
CREATE INDEX idx_decisions_status ON public.decisions(status);
CREATE INDEX idx_decisions_owner ON public.decisions(owner_person_id);
CREATE INDEX idx_conflicts_status ON public.conflicts(status);
CREATE INDEX idx_routing_logs_person ON public.routing_logs(to_person_id);
CREATE INDEX idx_graph_edges_from ON public.graph_edges(from_entity_type, from_entity_id);
CREATE INDEX idx_graph_edges_to ON public.graph_edges(to_entity_type, to_entity_id);
CREATE INDEX idx_update_events_created ON public.update_events(created_at DESC);

-- Full-text search indexes
CREATE INDEX idx_decisions_search ON public.decisions USING gin(to_tsvector('english', title || ' ' || canonical_text));
CREATE INDEX idx_topics_search ON public.topics USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Add triggers
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_persons_updated_at BEFORE UPDATE ON public.persons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_topics_updated_at BEFORE UPDATE ON public.topics FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_decisions_updated_at BEFORE UPDATE ON public.decisions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_org_settings_updated_at BEFORE UPDATE ON public.org_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE public.decisions;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conflicts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.update_events;
ALTER PUBLICATION supabase_realtime ADD TABLE public.routing_logs;