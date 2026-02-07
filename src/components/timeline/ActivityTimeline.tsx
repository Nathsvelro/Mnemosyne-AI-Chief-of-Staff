import { cn } from "@/lib/utils";
import { AlertTriangle, CheckCircle, Clock, ArrowRight, Users } from "lucide-react";

export interface TimelineEvent {
  id: string;
  type: "decision" | "update" | "conflict" | "routing";
  title: string;
  description: string;
  timestamp: string;
  stakeholders?: string[];
  aiReasoning?: string;
}

interface ActivityTimelineProps {
  events?: TimelineEvent[];
  className?: string;
}

const defaultEvents: TimelineEvent[] = [
  {
    id: "1",
    type: "decision",
    title: "Q2 Budget Approved",
    description: "Finance committee approved the revised Q2 budget with 15% increase for AI initiatives.",
    timestamp: "2 hours ago",
    stakeholders: ["Sarah Chen", "Marcus Johnson", "Finance Team"],
    aiReasoning: "Routed to Engineering and Product teams as it impacts resource allocation.",
  },
  {
    id: "2",
    type: "conflict",
    title: "Timeline Conflict Detected",
    description: "AI Strategy launch date conflicts with scheduled infrastructure maintenance.",
    timestamp: "4 hours ago",
    stakeholders: ["Engineering", "Product Team"],
    aiReasoning: "Flagged for resolution. Both events require shared resources.",
  },
  {
    id: "3",
    type: "routing",
    title: "New Stakeholder Added",
    description: "Legal team added to AI compliance review based on discussion in product meeting.",
    timestamp: "Yesterday",
    stakeholders: ["Legal Team", "Product Team"],
    aiReasoning: "Detected regulatory mentions in meeting transcript. Legal review recommended.",
  },
  {
    id: "4",
    type: "update",
    title: "Tech Debt Assessment Updated",
    description: "Engineering lead updated priority from P2 to P1 after system audit.",
    timestamp: "Yesterday",
    stakeholders: ["Marcus Johnson", "Engineering"],
    aiReasoning: "Change propagated to dependent roadmap items.",
  },
];

const typeConfig = {
  decision: {
    icon: CheckCircle,
    color: "text-success",
    bgColor: "bg-success/10",
    borderColor: "border-success/30",
  },
  update: {
    icon: Clock,
    color: "text-info",
    bgColor: "bg-info/10",
    borderColor: "border-info/30",
  },
  conflict: {
    icon: AlertTriangle,
    color: "text-conflict",
    bgColor: "bg-conflict/10",
    borderColor: "border-conflict/30",
  },
  routing: {
    icon: ArrowRight,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
  },
};

export function ActivityTimeline({
  events = defaultEvents,
  className,
}: ActivityTimelineProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {events.map((event, index) => {
        const config = typeConfig[event.type];
        const Icon = config.icon;

        return (
          <div
            key={event.id}
            className="relative pl-8 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            {/* Timeline line */}
            {index < events.length - 1 && (
              <div className="absolute left-[11px] top-8 bottom-0 w-px bg-border" />
            )}

            {/* Icon */}
            <div
              className={cn(
                "absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center",
                config.bgColor
              )}
            >
              <Icon className={cn("w-3.5 h-3.5", config.color)} />
            </div>

            {/* Content */}
            <div
              className={cn(
                "p-4 rounded-xl bg-card border transition-all duration-200 hover:bg-card-hover",
                config.borderColor
              )}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h4 className="font-medium text-foreground text-sm">{event.title}</h4>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {event.timestamp}
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{event.description}</p>

              {/* Stakeholders */}
              {event.stakeholders && event.stakeholders.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                  <div className="flex flex-wrap gap-1.5">
                    {event.stakeholders.map((stakeholder) => (
                      <span
                        key={stakeholder}
                        className="px-2 py-0.5 text-xs rounded-full bg-secondary text-secondary-foreground"
                      >
                        {stakeholder}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* AI Reasoning */}
              {event.aiReasoning && (
                <div className="pt-3 border-t border-border-subtle">
                  <div className="ai-indicator pl-3">
                    <p className="text-xs text-muted-foreground italic">
                      {event.aiReasoning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
