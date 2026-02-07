import { cn } from "@/lib/utils";
import { Check, MessageCircle, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ActionItem } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

interface ActionQueueProps {
  items: ActionItem[];
  onApprove?: (item: ActionItem) => void;
  onRequestClarification?: (item: ActionItem) => void;
  onAssign?: (item: ActionItem) => void;
}

const actionTypeConfig = {
  confirm_decision: { icon: Check, label: "Confirm", color: "text-success", bgColor: "bg-success/10" },
  resolve_conflict: { icon: MessageCircle, label: "Resolve", color: "text-warning", bgColor: "bg-warning/10" },
  assign_owner: { icon: UserPlus, label: "Assign", color: "text-info", bgColor: "bg-info/10" },
};

const priorityConfig = {
  high: { label: "High", color: "text-conflict", bg: "bg-conflict/10" },
  medium: { label: "Medium", color: "text-warning", bg: "bg-warning/10" },
  low: { label: "Low", color: "text-muted-foreground", bg: "bg-muted" },
};

export function ActionQueue({ items, onApprove, onRequestClarification, onAssign }: ActionQueueProps) {
  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-border bg-gradient-card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-foreground">Action Queue</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Items requiring your validation
            </p>
          </div>
          <div className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            {items.length} pending
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="divide-y divide-border">
        {items.map((item) => {
          const typeConfig = actionTypeConfig[item.type];
          const TypeIcon = typeConfig.icon;
          const priority = priorityConfig[item.priority];
          
          return (
            <div key={item.id} className="px-5 py-4">
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  typeConfig.bgColor
                )}>
                  <TypeIcon className={cn("w-4 h-4", typeConfig.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={cn(
                      "text-[10px] font-medium px-1.5 py-0.5 rounded",
                      priority.bg, priority.color
                    )}>
                      {priority.label}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {item.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button 
                      size="sm" 
                      variant="default"
                      className="h-7 text-xs"
                      onClick={() => onApprove?.(item)}
                    >
                      <Check className="w-3 h-3 mr-1" />
                      Approve
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="h-7 text-xs"
                      onClick={() => onRequestClarification?.(item)}
                    >
                      <MessageCircle className="w-3 h-3 mr-1" />
                      Clarify
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      className="h-7 text-xs"
                      onClick={() => onAssign?.(item)}
                    >
                      <UserPlus className="w-3 h-3 mr-1" />
                      Assign
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {items.length === 0 && (
          <div className="text-center py-8">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <Check className="w-5 h-5 text-success" />
            </div>
            <p className="text-sm font-medium text-foreground">All caught up!</p>
            <p className="text-xs text-muted-foreground mt-1">No pending actions</p>
          </div>
        )}
      </div>
    </div>
  );
}
