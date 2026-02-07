// Database types for the organizational intelligence system

export type DecisionStatus = 'proposed' | 'confirmed' | 'deprecated';
export type UpdateEventType = 'decision' | 'knowledge' | 'stakeholder' | 'risk';
export type EdgeType = 'communicates_with' | 'owns' | 'depends_on' | 'references' | 'contradicts';
export type ConflictStatus = 'open' | 'resolved' | 'dismissed';
export type EntityType = 'person' | 'team' | 'topic' | 'decision' | 'document';

export interface Team {
  id: string;
  name: string;
  lead_person_id: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Person {
  id: string;
  name: string;
  role: string | null;
  team_id: string | null;
  email: string | null;
  avatar_url: string | null;
  load_score: number;
  created_at: string;
  updated_at: string;
  team?: Team;
}

export interface Topic {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Decision {
  id: string;
  title: string;
  canonical_text: string;
  status: DecisionStatus;
  owner_person_id: string | null;
  confidence: number;
  created_at: string;
  updated_at: string;
  owner?: Person;
  affected_teams?: Team[];
  versions?: DecisionVersion[];
}

export interface DecisionVersion {
  id: string;
  decision_id: string;
  version_num: number;
  text: string;
  changed_by: string | null;
  change_reason: string | null;
  created_at: string;
  changed_by_person?: Person;
}

export interface UpdateEvent {
  id: string;
  type: UpdateEventType;
  summary: string;
  why_it_matters: string | null;
  impact_score: number;
  created_at: string;
}

export interface Conflict {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  description: string;
  severity: number;
  status: ConflictStatus;
  created_at: string;
  resolved_at: string | null;
}

export interface RoutingLog {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  to_person_id: string;
  reason: string;
  action_required: string | null;
  is_read: boolean;
  sent_at: string;
  to_person?: Person;
}

export interface GraphEdge {
  id: string;
  from_entity_type: EntityType;
  from_entity_id: string;
  to_entity_type: EntityType;
  to_entity_id: string;
  edge_type: EdgeType;
  weight: number;
  last_seen_at: string;
  created_at: string;
}

export interface Document {
  id: string;
  title: string;
  content: string | null;
  url: string | null;
  owner_person_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrgSettings {
  id: string;
  org_name: string;
  ceo_name: string;
  ceo_view_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// Graph node for visualization
export interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  data: Person | Team | Topic | Decision | Document;
}

// Brief item for Today's Brief
export interface BriefItem {
  id: string;
  changeType: 'decision' | 'update' | 'risk' | 'question';
  summary: string;
  impactedTeams: string[];
  impactedOwners: string[];
  confidence: number;
  entityId: string;
  entityType: EntityType;
  createdAt: string;
}

// Action item for Action Queue
export interface ActionItem {
  id: string;
  type: 'confirm_decision' | 'resolve_conflict' | 'assign_owner';
  title: string;
  description: string;
  entityId: string;
  entityType: EntityType;
  priority: 'high' | 'medium' | 'low';
  createdAt: string;
}
