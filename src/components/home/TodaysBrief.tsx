import { cn } from "@/lib/utils";
import { 
  GitBranch, 
  RefreshCw, 
  AlertTriangle, 
  HelpCircle,
  ArrowUpRight,
  Clock
} from "lucide-react";
import type { BriefItem } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

interface TodaysBriefProps {
  items: BriefItem[];
  onOpenItem?: (item: BriefItem) => void;
}

const changeTypeConfig = {
  decision: { icon: GitBranch, label: "Decision", color: "text-success" },
  update: { icon: RefreshCw, label: "Update", color: "text-info" },
  risk: { icon: AlertTriangle, label: "Risk", color: "text-conflict" },
  question: { icon: HelpCircle, label: "Question", color: "text-warning" },
};

export function TodaysBrief({ items, onOpenItem }: TodaysBriefProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Today's Brief</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              What changed in the last 24 hours
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span>Updated 5 min ago</span>
          </div>
        </div>
      </div>

      {/* Brief Items */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          const config = changeTypeConfig[item.changeType];
          const Icon = config.icon;
          
          return (
            <div
              key={item.id}
              className="px-5 py-4 hover:bg-card-hover transition-colors cursor-pointer group"
              onClick={() => onOpenItem?.(item)}
            >
              <div className="flex items-start gap-4">
                {/* Change Type Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  item.changeType === "decision" && "bg-success/10",
                  item.changeType === "update" && "bg-info/10",
                  item.changeType === "risk" && "bg-conflict/10",
                  item.changeType === "question" && "bg-warning/10"
                )}>
                  <Icon className={cn("w-4 h-4", config.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn("text-xs font-medium", config.color)}>
                      {config.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm text-foreground font-medium leading-snug">
                    {item.summary}
                  </p>
                  
                  {/* Impacted */}
                  <div className="flex items-center gap-4 mt-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Teams:</span>
                      <span className="text-xs text-foreground/80">
                        {item.impactedTeams.slice(0, 3).join(", ")}
                        {item.impactedTeams.length > 3 && ` +${item.impactedTeams.length - 3}`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-muted-foreground">Owners:</span>
                      <span className="text-xs text-foreground/80">
                        {item.impactedOwners.slice(0, 2).join(", ")}
                        {item.impactedOwners.length > 2 && ` +${item.impactedOwners.length - 2}`}
                      </span>
                    </div>
                  </div>

                  {/* Confidence */}
                  <div className="flex items-center gap-2 mt-2">
                    <div className="w-16 h-1.5 rounded-full bg-secondary overflow-hidden">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all",
                          item.confidence >= 0.8 ? "bg-success" :
                          item.confidence >= 0.6 ? "bg-warning" : "bg-conflict"
                        )}
                        style={{ width: `${item.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {Math.round(item.confidence * 100)}% confidence
                    </span>
                  </div>
                </div>

                {/* Open CTA */}
                <button className="shrink-0 p-2 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-secondary transition-all">
                  <ArrowUpRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
