import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Clock, 
  GitBranch, 
  FileText, 
  Users, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Filter,
  Calendar,
  Link2,
  MessageSquare,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TimelineEvent {
  id: string;
  type: "decision_created" | "decision_updated" | "decision_deprecated" | "conflict_opened" | "conflict_resolved" | "initiative_started" | "initiative_ended" | "team_change" | "knowledge_update";
  title: string;
  description: string;
  date: string;
  actor: string;
  entityId: string;
  entityType: "decision" | "conflict" | "initiative" | "team" | "topic";
  linkedEntities: string[];
  details?: {
    previousValue?: string;
    newValue?: string;
    reason?: string;
    outcome?: "success" | "failure" | "partial";
  };
}

const mockEvents: TimelineEvent[] = [
  {
    id: "evt-1",
    type: "decision_created",
    title: "Adopt Next.js for frontend",
    description: "Engineering proposed migrating from Create React App to Next.js for improved performance and SEO.",
    date: "2025-02-06T14:30:00Z",
    actor: "Sarah Chen",
    entityId: "decision-nextjs",
    entityType: "decision",
    linkedEntities: ["team-eng", "topic-infra"],
    details: {
      reason: "Performance improvements and better developer experience",
    },
  },
  {
    id: "evt-2",
    type: "conflict_opened",
    title: "Launch date disagreement",
    description: "Marketing and Engineering have conflicting views on March 15 launch feasibility.",
    date: "2025-02-05T10:15:00Z",
    actor: "System",
    entityId: "conflict-launch",
    entityType: "conflict",
    linkedEntities: ["team-eng", "team-mktg", "decision-launch"],
  },
  {
    id: "evt-3",
    type: "decision_updated",
    title: "API v3 Architecture revision",
    description: "Updated API design to include GraphQL federation support.",
    date: "2025-02-04T16:45:00Z",
    actor: "Priya Patel",
    entityId: "decision-api",
    entityType: "decision",
    linkedEntities: ["team-platform", "doc-api"],
    details: {
      previousValue: "REST-only architecture",
      newValue: "Hybrid REST + GraphQL federation",
      reason: "Enterprise customer requirements",
    },
  },
  {
    id: "evt-4",
    type: "initiative_ended",
    title: "Q4 Platform Redesign completed",
    description: "Successfully launched new platform UI with 40% improvement in user engagement.",
    date: "2025-02-01T09:00:00Z",
    actor: "Emily Rodriguez",
    entityId: "initiative-redesign",
    entityType: "initiative",
    linkedEntities: ["team-design", "team-eng", "topic-onboarding"],
    details: {
      outcome: "success",
    },
  },
  {
    id: "evt-5",
    type: "initiative_ended",
    title: "Blockchain Integration pilot",
    description: "Pilot program concluded without moving forward - low customer interest.",
    date: "2025-01-28T11:30:00Z",
    actor: "Marcus Johnson",
    entityId: "initiative-blockchain",
    entityType: "initiative",
    linkedEntities: ["team-eng", "topic-enterprise"],
    details: {
      outcome: "failure",
      reason: "Market validation showed insufficient demand",
    },
  },
  {
    id: "evt-6",
    type: "decision_deprecated",
    title: "Microservices-first architecture",
    description: "Deprecated in favor of modular monolith approach for faster iteration.",
    date: "2025-01-25T14:00:00Z",
    actor: "Sarah Chen",
    entityId: "decision-microservices",
    entityType: "decision",
    linkedEntities: ["team-eng", "team-platform"],
    details: {
      reason: "Operational complexity outweighed benefits at current scale",
    },
  },
  {
    id: "evt-7",
    type: "conflict_resolved",
    title: "Pricing model alignment",
    description: "Sales and Product aligned on 4-tier pricing with enterprise custom option.",
    date: "2025-01-20T16:30:00Z",
    actor: "Nathaniel Velazquez",
    entityId: "conflict-pricing",
    entityType: "conflict",
    linkedEntities: ["team-sales", "team-prod", "decision-pricing"],
  },
  {
    id: "evt-8",
    type: "knowledge_update",
    title: "AI Strategy documentation updated",
    description: "Added guidelines for LLM model selection and responsible AI practices.",
    date: "2025-01-18T10:00:00Z",
    actor: "Alex Turner",
    entityId: "topic-ai",
    entityType: "topic",
    linkedEntities: ["team-eng", "decision-ai-model"],
  },
];

const eventTypeConfig: Record<TimelineEvent["type"], { icon: typeof Clock; color: string; bgColor: string }> = {
  decision_created: { icon: FileText, color: "text-success", bgColor: "bg-success/20" },
  decision_updated: { icon: GitBranch, color: "text-info", bgColor: "bg-info/20" },
  decision_deprecated: { icon: XCircle, color: "text-muted-foreground", bgColor: "bg-muted" },
  conflict_opened: { icon: AlertTriangle, color: "text-destructive", bgColor: "bg-destructive/20" },
  conflict_resolved: { icon: CheckCircle2, color: "text-success", bgColor: "bg-success/20" },
  initiative_started: { icon: Zap, color: "text-primary", bgColor: "bg-primary/20" },
  initiative_ended: { icon: CheckCircle2, color: "text-info", bgColor: "bg-info/20" },
  team_change: { icon: Users, color: "text-warning", bgColor: "bg-warning/20" },
  knowledge_update: { icon: MessageSquare, color: "text-purple-400", bgColor: "bg-purple-400/20" },
};

interface HistoricalTimelineProps {
  className?: string;
  entityFilter?: string;
  onNavigateToEntity?: (entityId: string, entityType: string) => void;
}

export function HistoricalTimeline({ className, entityFilter, onNavigateToEntity }: HistoricalTimelineProps) {
  const [timeRange, setTimeRange] = useState("30d");
  const [typeFilter, setTypeFilter] = useState("all");
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleExpand = (eventId: string) => {
    setExpandedEvents(prev => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  const filteredEvents = mockEvents.filter(event => {
    if (entityFilter && !event.linkedEntities.includes(entityFilter) && event.entityId !== entityFilter) {
      return false;
    }
    if (typeFilter !== "all" && event.type !== typeFilter) {
      return false;
    }
    return true;
  });

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  };

  // Group events by date
  const groupedEvents = filteredEvents.reduce((groups, event) => {
    const date = new Date(event.date).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(event);
    return groups;
  }, {} as Record<string, TimelineEvent[]>);

  return (
    <div className={cn("flex flex-col h-full bg-card rounded-xl border border-border", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-semibold text-foreground">Historical Context</h3>
              <p className="text-xs text-muted-foreground">Organizational memory & decision evolution</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="h-8 w-[130px]">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
              <SelectItem value="all">All time</SelectItem>
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-8 flex-1">
              <Filter className="w-3 h-3 mr-1" />
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All events</SelectItem>
              <SelectItem value="decision_created">Decisions created</SelectItem>
              <SelectItem value="decision_updated">Decisions updated</SelectItem>
              <SelectItem value="decision_deprecated">Decisions deprecated</SelectItem>
              <SelectItem value="conflict_opened">Conflicts opened</SelectItem>
              <SelectItem value="conflict_resolved">Conflicts resolved</SelectItem>
              <SelectItem value="initiative_ended">Initiatives completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {Object.entries(groupedEvents).map(([date, events]) => (
            <div key={date} className="mb-6 last:mb-0">
              {/* Date Header */}
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium text-muted-foreground px-2">
                  {formatDate(events[0].date)}
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              {/* Events */}
              <div className="space-y-3">
                {events.map((event, idx) => {
                  const config = eventTypeConfig[event.type];
                  const Icon = config.icon;
                  const isExpanded = expandedEvents.has(event.id);

                  return (
                    <div key={event.id} className="relative">
                      {/* Connector line */}
                      {idx < events.length - 1 && (
                        <div className="absolute left-[18px] top-10 bottom-0 w-px bg-border" />
                      )}

                      <Card 
                        className={cn(
                          "bg-card border-border hover:border-primary/30 transition-all cursor-pointer",
                          isExpanded && "ring-1 ring-primary/50"
                        )}
                        onClick={() => toggleExpand(event.id)}
                      >
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            {/* Icon */}
                            <div className={cn("p-2 rounded-lg shrink-0", config.bgColor)}>
                              <Icon className={cn("w-4 h-4", config.color)} />
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <h4 className="font-medium text-foreground text-sm">
                                    {event.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                                    {event.description}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <span className="text-[10px] text-muted-foreground">
                                    {formatTime(event.date)}
                                  </span>
                                  {isExpanded ? (
                                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                                  ) : (
                                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-2 mt-2">
                                <Badge variant="outline" className="text-[10px] h-5">
                                  {event.actor}
                                </Badge>
                                {event.details?.outcome && (
                                  <Badge 
                                    className={cn(
                                      "text-[10px] h-5",
                                      event.details.outcome === "success" && "bg-success/20 text-success",
                                      event.details.outcome === "failure" && "bg-destructive/20 text-destructive",
                                      event.details.outcome === "partial" && "bg-warning/20 text-warning"
                                    )}
                                  >
                                    {event.details.outcome}
                                  </Badge>
                                )}
                              </div>

                              {/* Expanded content */}
                              {isExpanded && (
                                <div className="mt-4 pt-3 border-t border-border space-y-3" onClick={e => e.stopPropagation()}>
                                  {/* Change details */}
                                  {event.details?.previousValue && (
                                    <div className="flex items-center gap-2 text-xs">
                                      <span className="text-muted-foreground line-through">
                                        {event.details.previousValue}
                                      </span>
                                      <ArrowRight className="w-3 h-3 text-primary" />
                                      <span className="text-foreground font-medium">
                                        {event.details.newValue}
                                      </span>
                                    </div>
                                  )}

                                  {/* Reason */}
                                  {event.details?.reason && (
                                    <div className="bg-secondary/50 p-2 rounded text-xs">
                                      <span className="text-muted-foreground">Reason: </span>
                                      <span className="text-foreground">{event.details.reason}</span>
                                    </div>
                                  )}

                                  {/* Linked entities */}
                                  <div>
                                    <div className="text-[10px] text-muted-foreground mb-1.5 flex items-center gap-1">
                                      <Link2 className="w-3 h-3" />
                                      Related entities
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                      {event.linkedEntities.map(entity => (
                                        <Badge 
                                          key={entity}
                                          variant="outline"
                                          className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10"
                                          onClick={() => onNavigateToEntity?.(entity, event.entityType)}
                                        >
                                          {entity}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Why it matters - AI insight */}
                                  <div className="bg-primary/5 border border-primary/20 rounded p-2">
                                    <div className="text-[10px] text-primary font-medium mb-1">
                                      Why this matters (AI insight)
                                    </div>
                                    <p className="text-xs text-foreground/80">
                                      {event.type === "decision_deprecated" 
                                        ? "This deprecation affects 3 downstream decisions. Consider reviewing API v3 Architecture and Platform roadmap for cascading impacts."
                                        : event.type === "initiative_ended" && event.details?.outcome === "failure"
                                        ? "This initiative's failure provides valuable learnings. Similar patterns were observed in 2 past initiatives. Key insight: Early customer validation critical."
                                        : "This change aligns with current strategic priorities and has no detected conflicts."}
                                    </p>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {filteredEvents.length === 0 && (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
              <div className="text-sm font-medium text-foreground">No events found</div>
              <div className="text-xs text-muted-foreground">
                Try adjusting your filters or time range
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
