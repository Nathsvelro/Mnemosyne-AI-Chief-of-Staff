import { cn } from "@/lib/utils";
import { AlertTriangle, UserX, Lock, ArrowRight } from "lucide-react";
import type { Conflict, Person } from "@/types/database";

interface KeyAlertsProps {
  conflicts: Conflict[];
  overloadedPersons: Person[];
  blockedKnowledgeCount: number;
  onViewConflict?: (conflict: Conflict) => void;
  onViewOverloaded?: (person: Person) => void;
}

export function KeyAlerts({ 
  conflicts, 
  overloadedPersons, 
  blockedKnowledgeCount,
  onViewConflict,
  onViewOverloaded 
}: KeyAlertsProps) {
  const openConflicts = conflicts.filter(c => c.status === "open");

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-gradient-card">
        <h3 className="font-semibold text-foreground text-sm">Key Alerts</h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          Issues requiring attention
        </p>
      </div>

      <div className="p-4 space-y-3">
        {/* Conflicts */}
        {openConflicts.length > 0 && (
          <div 
            className="p-3 rounded-lg bg-conflict/5 border border-conflict/20 cursor-pointer hover:bg-conflict/10 transition-colors"
            onClick={() => openConflicts[0] && onViewConflict?.(openConflicts[0])}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-conflict/10 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-conflict" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-conflict">
                    {openConflicts.length} Conflict{openConflicts.length > 1 ? "s" : ""} Detected
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-conflict" />
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                  {openConflicts[0]?.description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Overloaded Persons */}
        {overloadedPersons.length > 0 && (
          <div 
            className="p-3 rounded-lg bg-warning/5 border border-warning/20 cursor-pointer hover:bg-warning/10 transition-colors"
            onClick={() => overloadedPersons[0] && onViewOverloaded?.(overloadedPersons[0])}
          >
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center shrink-0">
                <UserX className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-warning">
                    Overload Warning
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-warning" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {overloadedPersons.map(p => p.name).join(", ")} {overloadedPersons.length === 1 ? "has" : "have"} too many pings
                </p>
                <div className="flex items-center gap-2 mt-2">
                  {overloadedPersons.slice(0, 3).map(person => (
                    <div key={person.id} className="flex items-center gap-1">
                      <div className="w-5 h-5 rounded-full bg-secondary flex items-center justify-center">
                        <span className="text-[9px] font-medium text-foreground">
                          {person.name.split(" ").map(n => n[0]).join("")}
                        </span>
                      </div>
                      <span className="text-[10px] text-muted-foreground">
                        {person.load_score}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Blocked Knowledge */}
        {blockedKnowledgeCount > 0 && (
          <div className="p-3 rounded-lg bg-info/5 border border-info/20 cursor-pointer hover:bg-info/10 transition-colors">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-info/10 flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-info" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-info">
                    Blocked Knowledge
                  </span>
                  <ArrowRight className="w-3.5 h-3.5 text-info" />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {blockedKnowledgeCount} team{blockedKnowledgeCount > 1 ? "s" : ""} not receiving key information
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {openConflicts.length === 0 && overloadedPersons.length === 0 && blockedKnowledgeCount === 0 && (
          <div className="text-center py-6">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-lg">✓</span>
            </div>
            <p className="text-sm text-muted-foreground">No critical alerts</p>
          </div>
        )}
      </div>
    </div>
  );
}
