import { cn } from "@/lib/utils";
import { Brain, Lightbulb, ChevronRight } from "lucide-react";

interface AIReasoningItem {
  id: string;
  action: string;
  reasoning: string;
  confidence: number;
  category: "routing" | "conflict" | "summary" | "suppression";
}

interface AIReasoningPanelProps {
  items?: AIReasoningItem[];
  className?: string;
}

const defaultItems: AIReasoningItem[] = [
  {
    id: "1",
    action: "Routed budget update to Engineering",
    reasoning: "Engineering team is directly impacted by AI initiative funding. 3 active projects depend on this allocation.",
    confidence: 95,
    category: "routing",
  },
  {
    id: "2",
    action: "Flagged timeline conflict",
    reasoning: "Detected overlapping resource requirements between AI launch and infrastructure maintenance windows.",
    confidence: 88,
    category: "conflict",
  },
  {
    id: "3",
    action: "Suppressed redundant notification",
    reasoning: "Similar update sent to stakeholder 2 hours ago. Consolidating to prevent notification fatigue.",
    confidence: 92,
    category: "suppression",
  },
  {
    id: "4",
    action: "Generated weekly summary",
    reasoning: "Synthesized 23 updates into 5 key themes based on stakeholder relevance scores.",
    confidence: 90,
    category: "summary",
  },
];

const categoryStyles = {
  routing: "status-badge-info",
  conflict: "status-badge-conflict",
  summary: "status-badge-success",
  suppression: "status-badge-warning",
};

const categoryLabels = {
  routing: "Routing",
  conflict: "Conflict",
  summary: "Summary",
  suppression: "Suppression",
};

export function AIReasoningPanel({
  items = defaultItems,
  className,
}: AIReasoningPanelProps) {
  return (
    <div className={cn("rounded-xl bg-card border border-border overflow-hidden", className)}>
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-gradient-card">
        <div className="p-2 rounded-lg bg-primary/15">
          <Brain className="w-4 h-4 text-primary" />
        </div>
        <div>
          <h3 className="font-semibold text-sm text-foreground">AI Reasoning</h3>
          <p className="text-xs text-muted-foreground">Transparent decision log</p>
        </div>
      </div>

      {/* Items */}
      <div className="divide-y divide-border-subtle">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="p-4 hover:bg-card-hover transition-colors cursor-pointer group animate-fade-in"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-primary shrink-0" />
                <span className="text-sm font-medium text-foreground">{item.action}</span>
              </div>
              <span className={categoryStyles[item.category]}>
                {categoryLabels[item.category]}
              </span>
            </div>

            <p className="text-sm text-muted-foreground mb-3 pl-6">{item.reasoning}</p>

            <div className="flex items-center justify-between pl-6">
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-24 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${item.confidence}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">
                  {item.confidence}% confidence
                </span>
              </div>

              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
