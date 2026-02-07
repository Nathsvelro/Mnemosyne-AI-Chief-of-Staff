import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { 
  GitBranch, 
  Brain, 
  Users, 
  AlertTriangle,
  Eye,
  Check,
  ArrowRight,
  Bell,
  X,
  Clock
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockUpdateEvents, mockTeams } from "@/lib/mock-data";
import type { UpdateEventType } from "@/types/database";
import { formatDistanceToNow } from "date-fns";

const typeConfig: Record<UpdateEventType, { icon: typeof GitBranch; label: string; color: string; bg: string }> = {
  decision: { icon: GitBranch, label: "Decision", color: "text-success", bg: "bg-success/10" },
  knowledge: { icon: Brain, label: "Knowledge", color: "text-info", bg: "bg-info/10" },
  stakeholder: { icon: Users, label: "Stakeholder", color: "text-primary", bg: "bg-primary/10" },
  risk: { icon: AlertTriangle, label: "Risk", color: "text-conflict", bg: "bg-conflict/10" },
};

const UpdatesPage = () => {
  const [subscriptions, setSubscriptions] = useState<string[]>(["topic-1", "team-1"]);

  const toggleSubscription = (id: string) => {
    setSubscriptions(prev => 
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <AppLayout>
      <div className="flex gap-6 animate-fade-in">
        {/* Main Content */}
        <div className="flex-1 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-foreground">Updates</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Strategic feed: only meaningful diffs
            </p>
          </div>

          {/* Timeline Feed */}
          <div className="space-y-4">
            {mockUpdateEvents.map((update) => {
              const config = typeConfig[update.type];
              const Icon = config.icon;

              return (
                <div 
                  key={update.id}
                  className="p-5 rounded-xl bg-card border border-border hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center shrink-0",
                      config.bg
                    )}>
                      <Icon className={cn("w-5 h-5", config.color)} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className={cn("text-xs", config.color, config.bg)}>
                          {config.label}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(update.created_at), { addSuffix: true })}
                        </span>
                      </div>

                      <h3 className="text-base font-semibold text-foreground mb-2">
                        {update.summary}
                      </h3>

                      {update.why_it_matters && (
                        <div className="p-3 rounded-lg bg-secondary/30 border border-border mb-3">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Why it matters</p>
                          <p className="text-sm text-foreground">{update.why_it_matters}</p>
                        </div>
                      )}

                      {/* Who should know */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-muted-foreground">Who should know:</span>
                        <div className="flex items-center gap-1">
                          {mockTeams.slice(0, 3).map(team => (
                            <Badge key={team.id} variant="outline" className="text-[10px]">
                              {team.name}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Impact Score */}
                      <div className="flex items-center gap-2 mb-4">
                        <span className="text-xs text-muted-foreground">Impact:</span>
                        <div className="flex items-center gap-1">
                          {[...Array(10)].map((_, i) => (
                            <div 
                              key={i}
                              className={cn(
                                "w-2 h-2 rounded-full",
                                i < update.impact_score ? 
                                  update.impact_score >= 8 ? "bg-conflict" :
                                  update.impact_score >= 5 ? "bg-warning" : "bg-success"
                                  : "bg-secondary"
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">{update.impact_score}/10</span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="sm" variant="default" className="h-8 text-xs">
                          <Eye className="w-3 h-3 mr-1" />
                          View
                        </Button>
                        <Button size="sm" variant="outline" className="h-8 text-xs">
                          <Check className="w-3 h-3 mr-1" />
                          Approve
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs">
                          <ArrowRight className="w-3 h-3 mr-1" />
                          Route
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground">
                          <X className="w-3 h-3 mr-1" />
                          Ignore
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Sidebar: Subscriptions */}
        <div className="w-72 shrink-0 space-y-6">
          {/* Change Map Mini */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-semibold text-foreground text-sm mb-3">Change Map</h3>
            <div className="h-32 rounded-lg bg-secondary/30 flex items-center justify-center">
              <p className="text-xs text-muted-foreground text-center px-4">
                Visual representation of impacted nodes/teams
              </p>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs text-muted-foreground">
              <span>Today's changes</span>
              <span className="text-foreground font-medium">{mockUpdateEvents.length} updates</span>
            </div>
          </div>

          {/* Subscriptions */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-foreground text-sm">Subscriptions</h3>
              <Bell className="w-4 h-4 text-muted-foreground" />
            </div>
            <p className="text-xs text-muted-foreground mb-4">
              Get notified when these change
            </p>

            <div className="space-y-3">
              {/* Topics */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Topics</Label>
                <div className="space-y-2">
                  {["Q1 Launch", "AI Integration", "Enterprise Sales"].map((topic, i) => (
                    <div 
                      key={i}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                    >
                      <span className="text-sm text-foreground">{topic}</span>
                      <Switch 
                        checked={subscriptions.includes(`topic-${i + 1}`)}
                        onCheckedChange={() => toggleSubscription(`topic-${i + 1}`)}
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Teams */}
              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Teams</Label>
                <div className="space-y-2">
                  {mockTeams.slice(0, 3).map((team) => (
                    <div 
                      key={team.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-secondary/30"
                    >
                      <span className="text-sm text-foreground">{team.name}</span>
                      <Switch 
                        checked={subscriptions.includes(team.id)}
                        onCheckedChange={() => toggleSubscription(team.id)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button variant="outline" className="w-full mt-4" size="sm">
              <Bell className="w-4 h-4 mr-2" />
              Manage All Subscriptions
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UpdatesPage;
