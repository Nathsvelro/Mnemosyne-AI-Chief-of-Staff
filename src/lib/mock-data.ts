// Mock data for the organizational intelligence system
import type { 
  Person, Team, Decision, UpdateEvent, Conflict, 
  RoutingLog, Topic, BriefItem, ActionItem, GraphEdge,
  Document
} from "@/types/database";

// Teams
export const mockTeams: Team[] = [
  { id: "team-1", name: "Engineering", lead_person_id: "person-1", description: "Core product development", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "team-2", name: "Product", lead_person_id: "person-2", description: "Product strategy and roadmap", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "team-3", name: "Design", lead_person_id: "person-3", description: "UX and visual design", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "team-4", name: "Marketing", lead_person_id: "person-4", description: "Growth and brand", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "team-5", name: "Sales", lead_person_id: "person-5", description: "Revenue and partnerships", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Persons
export const mockPersons: Person[] = [
  { id: "person-1", name: "Sarah Chen", role: "VP Engineering", team_id: "team-1", email: "sarah@company.com", avatar_url: null, load_score: 85, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-2", name: "Marcus Johnson", role: "Head of Product", team_id: "team-2", email: "marcus@company.com", avatar_url: null, load_score: 72, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-3", name: "Emily Rodriguez", role: "Design Director", team_id: "team-3", email: "emily@company.com", avatar_url: null, load_score: 45, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-4", name: "David Kim", role: "CMO", team_id: "team-4", email: "david@company.com", avatar_url: null, load_score: 92, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-5", name: "Lisa Thompson", role: "VP Sales", team_id: "team-5", email: "lisa@company.com", avatar_url: null, load_score: 68, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-6", name: "James Wilson", role: "Senior Engineer", team_id: "team-1", email: "james@company.com", avatar_url: null, load_score: 55, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-7", name: "Ana Martinez", role: "Product Manager", team_id: "team-2", email: "ana@company.com", avatar_url: null, load_score: 78, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "person-8", name: "Nathaniel Velazquez", role: "CEO", team_id: null, email: "nathaniel@company.com", avatar_url: null, load_score: 95, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Topics
export const mockTopics: Topic[] = [
  { id: "topic-1", name: "Q1 Launch", description: "Product launch for Q1 2025", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "topic-2", name: "AI Integration", description: "Integrating AI capabilities into core product", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "topic-3", name: "Enterprise Sales", description: "Enterprise sales strategy and pipeline", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "topic-4", name: "User Onboarding", description: "Improving user onboarding experience", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "topic-5", name: "Infrastructure", description: "Platform infrastructure and scalability", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];

// Decisions
export const mockDecisions: Decision[] = [
  { 
    id: "decision-1", 
    title: "Adopt Next.js for frontend rewrite", 
    canonical_text: "We will migrate the frontend from Create React App to Next.js 14 to improve performance and SEO. This decision was made after evaluating Remix and Astro as alternatives.",
    status: "confirmed", 
    owner_person_id: "person-1", 
    confidence: 0.92,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: "decision-2", 
    title: "Launch date pushed to March 15", 
    canonical_text: "The Q1 launch has been moved from February 28 to March 15 to accommodate additional security testing requirements from enterprise clients.",
    status: "proposed", 
    owner_person_id: "person-2", 
    confidence: 0.75,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: "decision-3", 
    title: "Use OpenAI GPT-4 for AI features", 
    canonical_text: "After evaluating Claude, Gemini, and GPT-4, we've decided to use GPT-4 as our primary AI provider due to better consistency in outputs and enterprise support.",
    status: "confirmed", 
    owner_person_id: "person-1", 
    confidence: 0.88,
    created_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: "decision-4", 
    title: "Pricing tier restructure", 
    canonical_text: "Restructure pricing from 3 tiers to 4 tiers, adding an 'Enterprise Plus' tier with dedicated support and custom SLAs.",
    status: "proposed", 
    owner_person_id: "person-5", 
    confidence: 0.65,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: "decision-5", 
    title: "Deprecate legacy API v1", 
    canonical_text: "API v1 will be deprecated by April 30, 2025. All clients must migrate to v2. Migration guides will be provided by February 15.",
    status: "confirmed", 
    owner_person_id: "person-1", 
    confidence: 0.95,
    created_at: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(), 
    updated_at: new Date().toISOString() 
  },
  { 
    id: "decision-6", 
    title: "Hire 5 additional engineers", 
    canonical_text: "Expand engineering team by 5 senior engineers to support Q2 product roadmap. Budget approved.",
    status: "deprecated", 
    owner_person_id: "person-8", 
    confidence: 0.50,
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), 
    updated_at: new Date().toISOString() 
  },
];

// Update Events
export const mockUpdateEvents: UpdateEvent[] = [
  { id: "update-1", type: "decision", summary: "Launch date moved to March 15", why_it_matters: "Affects marketing campaign timing and enterprise client demos", impact_score: 8, created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "update-2", type: "risk", summary: "Engineering capacity at 92% utilization", why_it_matters: "May impact ability to handle unexpected issues before launch", impact_score: 7, created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: "update-3", type: "knowledge", summary: "New enterprise security requirements documented", why_it_matters: "Required reading for all engineers before Q1 launch", impact_score: 6, created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: "update-4", type: "stakeholder", summary: "David Kim flagged as overloaded (92% capacity)", why_it_matters: "Marketing decisions may be delayed without support", impact_score: 5, created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString() },
  { id: "update-5", type: "decision", summary: "Pricing restructure proposal needs review", why_it_matters: "Sales team waiting for final pricing to close Q1 deals", impact_score: 9, created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: "update-6", type: "knowledge", summary: "API migration guide v1 published", why_it_matters: "Clients can now begin planning their migration", impact_score: 4, created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
];

// Conflicts
export const mockConflicts: Conflict[] = [
  { id: "conflict-1", entity_type: "decision", entity_id: "decision-2", description: "Marketing says February date is locked for campaign. Engineering says March is necessary.", severity: 8, status: "open", created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), resolved_at: null },
  { id: "conflict-2", entity_type: "decision", entity_id: "decision-4", description: "Sales wants simpler pricing. Product wants feature differentiation.", severity: 6, status: "open", created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), resolved_at: null },
  { id: "conflict-3", entity_type: "person", entity_id: "person-4", description: "Overloaded stakeholder - 3 teams requesting David's time simultaneously", severity: 7, status: "open", created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), resolved_at: null },
];

// Routing Logs
export const mockRoutingLogs: RoutingLog[] = [
  { id: "route-1", entity_type: "decision", entity_id: "decision-2", to_person_id: "person-4", reason: "You own the marketing campaign affected by this date change", action_required: "confirm_decision", is_read: false, sent_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: "route-2", entity_type: "decision", entity_id: "decision-4", to_person_id: "person-5", reason: "You proposed this decision - needs clarification", action_required: "resolve_conflict", is_read: false, sent_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: "route-3", entity_type: "topic", entity_id: "topic-1", to_person_id: "person-1", reason: "Your team depends on the Q1 Launch timeline", action_required: null, is_read: true, sent_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() },
  { id: "route-4", entity_type: "decision", entity_id: "decision-5", to_person_id: "person-6", reason: "You maintain the API - migration guide needs your input", action_required: "assign_owner", is_read: false, sent_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
];

// Brief Items (derived from updates)
export const mockBriefItems: BriefItem[] = [
  { id: "brief-1", changeType: "decision", summary: "Launch date moved from Feb 28 to March 15", impactedTeams: ["Engineering", "Marketing", "Sales"], impactedOwners: ["Marcus Johnson", "David Kim"], confidence: 0.75, entityId: "decision-2", entityType: "decision", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
  { id: "brief-2", changeType: "risk", summary: "Engineering capacity at 92% - near overload", impactedTeams: ["Engineering"], impactedOwners: ["Sarah Chen"], confidence: 0.88, entityId: "person-1", entityType: "person", createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString() },
  { id: "brief-3", changeType: "question", summary: "Pricing tier restructure awaiting final approval", impactedTeams: ["Sales", "Product"], impactedOwners: ["Lisa Thompson", "Marcus Johnson"], confidence: 0.65, entityId: "decision-4", entityType: "decision", createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: "brief-4", changeType: "update", summary: "Enterprise security requirements now documented", impactedTeams: ["Engineering"], impactedOwners: ["James Wilson"], confidence: 0.95, entityId: "topic-3", entityType: "topic", createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString() },
  { id: "brief-5", changeType: "decision", summary: "API v1 deprecation timeline confirmed for April 30", impactedTeams: ["Engineering", "Sales"], impactedOwners: ["Sarah Chen"], confidence: 0.95, entityId: "decision-5", entityType: "decision", createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString() },
];

// Action Items
export const mockActionItems: ActionItem[] = [
  { id: "action-1", type: "confirm_decision", title: "Confirm launch date change", description: "Verify Marketing can adjust campaign for March 15 date", entityId: "decision-2", entityType: "decision", priority: "high", createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString() },
  { id: "action-2", type: "resolve_conflict", title: "Resolve pricing tier conflict", description: "Sales and Product have conflicting requirements for tier structure", entityId: "decision-4", entityType: "decision", priority: "medium", createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  { id: "action-3", type: "assign_owner", title: "Assign API migration guide owner", description: "Documentation needs an engineering owner for client migration", entityId: "decision-5", entityType: "decision", priority: "medium", createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
];

// Graph Edges
export const mockGraphEdges: GraphEdge[] = [
  // Person to Team
  { id: "edge-1", from_entity_type: "person", from_entity_id: "person-1", to_entity_type: "team", to_entity_id: "team-1", edge_type: "owns", weight: 1.0, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "edge-2", from_entity_type: "person", from_entity_id: "person-2", to_entity_type: "team", to_entity_id: "team-2", edge_type: "owns", weight: 1.0, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Person to Person (communication)
  { id: "edge-3", from_entity_type: "person", from_entity_id: "person-1", to_entity_type: "person", to_entity_id: "person-2", edge_type: "communicates_with", weight: 0.9, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "edge-4", from_entity_type: "person", from_entity_id: "person-2", to_entity_type: "person", to_entity_id: "person-4", edge_type: "communicates_with", weight: 0.75, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Team dependencies
  { id: "edge-5", from_entity_type: "team", from_entity_id: "team-2", to_entity_type: "team", to_entity_id: "team-1", edge_type: "depends_on", weight: 0.85, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "edge-6", from_entity_type: "team", from_entity_id: "team-4", to_entity_type: "team", to_entity_id: "team-2", edge_type: "depends_on", weight: 0.7, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Decision ownership
  { id: "edge-7", from_entity_type: "person", from_entity_id: "person-1", to_entity_type: "decision", to_entity_id: "decision-1", edge_type: "owns", weight: 1.0, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "edge-8", from_entity_type: "person", from_entity_id: "person-2", to_entity_type: "decision", to_entity_id: "decision-2", edge_type: "owns", weight: 1.0, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Topic references
  { id: "edge-9", from_entity_type: "decision", from_entity_id: "decision-1", to_entity_type: "topic", to_entity_id: "topic-2", edge_type: "references", weight: 0.8, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  { id: "edge-10", from_entity_type: "decision", from_entity_id: "decision-2", to_entity_type: "topic", to_entity_id: "topic-1", edge_type: "references", weight: 0.95, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
  // Conflicts (contradicts)
  { id: "edge-11", from_entity_type: "decision", from_entity_id: "decision-2", to_entity_type: "decision", to_entity_id: "decision-4", edge_type: "contradicts", weight: 0.6, last_seen_at: new Date().toISOString(), created_at: new Date().toISOString() },
];

// Documents
export const mockDocuments: Document[] = [
  { id: "doc-1", title: "Q1 Launch Plan", content: "Detailed launch plan for Q1 2025", url: "https://docs.company.com/q1-launch", owner_person_id: "person-2", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "doc-2", title: "API Migration Guide", content: "Guide for migrating from API v1 to v2", url: "https://docs.company.com/api-migration", owner_person_id: "person-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: "doc-3", title: "Enterprise Security Requirements", content: "Security requirements for enterprise clients", url: "https://docs.company.com/security", owner_person_id: "person-1", created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
