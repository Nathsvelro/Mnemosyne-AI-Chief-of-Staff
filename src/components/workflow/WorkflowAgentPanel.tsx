import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { 
  Bot, 
  Zap, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight,
  RefreshCw,
  Lightbulb,
  Settings,
  Users,
  GitBranch,
  Clock,
  ChevronRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/use-ai";
import { toast } from "sonner";

interface WorkflowSuggestion {
  id: string;
  type: "optimization" | "governance" | "role" | "process" | "redundancy";
  title: string;
  description: string;
  impact: "high" | "medium" | "low";
  effort: "high" | "medium" | "low";
  affectedNodes: string[];
  reasoning: string;
  alternatives: string[];
  confidence: number;
}

const mockSuggestions: WorkflowSuggestion[] = [
  {
    id: "sug-1",
    type: "optimization",
    title: "Consolidate Weekly Syncs",
    description: "Engineering and Product have overlapping weekly syncs that could be merged into a single 45-min session.",
    impact: "medium",
    effort: "low",
    affectedNodes: ["team-eng", "team-prod", "vp-eng", "vp-prod"],
    reasoning: "Analysis of calendar data shows 60% topic overlap between these meetings. Attendees report redundant updates.",
    alternatives: ["Async written updates instead", "Bi-weekly combined sync"],
    confidence: 85,
  },
  {
    id: "sug-2",
    type: "redundancy",
    title: "Duplicate Approval Workflow Detected",
    description: "Feature launches require approval from both VP Engineering and Engineering Lead - consider single-approver model.",
    impact: "medium",
    effort: "low",
    affectedNodes: ["vp-eng", "eng-lead-1", "decision-launch"],
    reasoning: "In 90% of cases, both approvals match. The dual approval adds 2-3 days to launch cycles without catching additional issues.",
    alternatives: ["Single approver with audit trail", "Threshold-based escalation"],
    confidence: 78,
  },
  {
    id: "sug-3",
    type: "governance",
    title: "Establish Decision Ownership Policy",
    description: "15% of decisions in the log have no clear owner. Recommend mandatory owner assignment.",
    impact: "high",
    effort: "medium",
    affectedNodes: ["team-exec", "decision-strategy"],
    reasoning: "Unowned decisions take 3x longer to resolve and have higher conflict rates.",
    alternatives: ["Default to team lead", "Rotating ownership"],
    confidence: 92,
  },
  {
    id: "sug-4",
    type: "role",
    title: "Clarify Platform vs Engineering Scope",
    description: "Overlapping responsibilities between Platform and Engineering teams causing blocked decisions.",
    impact: "high",
    effort: "high",
    affectedNodes: ["team-eng", "team-platform", "topic-infra"],
    reasoning: "3 recent conflicts traced to unclear ownership of infrastructure decisions.",
    alternatives: ["Merge teams", "Create explicit RACI matrix"],
    confidence: 88,
  },
  {
    id: "sug-5",
    type: "process",
    title: "Automate Launch Readiness Checks",
    description: "Manual checklist causes delays. Implement automated readiness validation.",
    impact: "medium",
    effort: "medium",
    affectedNodes: ["decision-launch", "team-eng", "team-mktg"],
    reasoning: "Average 4-day delay in launches due to checklist completion. Automation can reduce to same-day.",
    alternatives: ["Standardized template", "Async stakeholder sign-off"],
    confidence: 75,
  },
];

const typeConfig: Record<WorkflowSuggestion["type"], { label: string; color: string; icon: typeof Zap }> = {
  optimization: { label: "Optimization", color: "bg-success/20 text-success", icon: Zap },
  governance: { label: "Governance", color: "bg-primary/20 text-primary", icon: Settings },
  role: { label: "Role Clarity", color: "bg-info/20 text-info", icon: Users },
  process: { label: "Process", color: "bg-warning/20 text-warning", icon: GitBranch },
  redundancy: { label: "Redundancy", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
};

const impactColors = {
  high: "text-destructive",
  medium: "text-warning",
  low: "text-success",
};

interface WorkflowAgentPanelProps {
  className?: string;
  onNavigateToNode?: (nodeId: string) => void;
}

export function WorkflowAgentPanel({ className, onNavigateToNode }: WorkflowAgentPanelProps) {
  const [suggestions, setSuggestions] = useState<WorkflowSuggestion[]>(mockSuggestions);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<WorkflowSuggestion | null>(null);
  const [filter, setFilter] = useState<WorkflowSuggestion["type"] | "all">("all");
  const { askChiefOfStaff } = useAI();

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true);
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    toast.success("Workflow analysis complete", {
      description: "Found 5 improvement opportunities",
    });
    
    setIsAnalyzing(false);
  };

  const handleAcceptSuggestion = (suggestion: WorkflowSuggestion) => {
    toast.success("Suggestion accepted", {
      description: `"${suggestion.title}" has been added to the action queue.`,
    });
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const handleDismissSuggestion = (suggestion: WorkflowSuggestion) => {
    toast.info("Suggestion dismissed", {
      description: "This won't be shown again.",
    });
    setSuggestions(prev => prev.filter(s => s.id !== suggestion.id));
  };

  const filteredSuggestions = filter === "all" 
    ? suggestions 
    : suggestions.filter(s => s.type === filter);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Bot className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground text-sm">Workflow Agent</h3>
              <p className="text-[10px] text-muted-foreground">AI-powered improvement suggestions</p>
            </div>
          </div>
          <Button 
            size="sm" 
            variant="outline" 
            className="gap-1.5"
            onClick={handleRunAnalysis}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <RefreshCw className="w-3.5 h-3.5" />
            )}
            {isAnalyzing ? "Analyzing..." : "Re-analyze"}
          </Button>
        </div>

        {/* Filter chips */}
        <div className="flex gap-1.5 flex-wrap">
          <Button
            size="sm"
            variant={filter === "all" ? "default" : "ghost"}
            className="h-7 text-xs"
            onClick={() => setFilter("all")}
          >
            All ({suggestions.length})
          </Button>
          {Object.entries(typeConfig).map(([type, config]) => {
            const count = suggestions.filter(s => s.type === type).length;
            if (count === 0) return null;
            return (
              <Button
                key={type}
                size="sm"
                variant={filter === type ? "default" : "ghost"}
                className="h-7 text-xs gap-1"
                onClick={() => setFilter(type as WorkflowSuggestion["type"])}
              >
                <config.icon className="w-3 h-3" />
                {config.label} ({count})
              </Button>
            );
          })}
        </div>
      </div>

      {/* Suggestions List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {isAnalyzing && (
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
                <div>
                  <div className="text-sm font-medium text-foreground">Analyzing organizational data...</div>
                  <div className="text-xs text-muted-foreground">Checking workflows, dependencies, and inefficiencies</div>
                </div>
              </CardContent>
            </Card>
          )}

          {filteredSuggestions.map(suggestion => {
            const TypeIcon = typeConfig[suggestion.type].icon;
            const isExpanded = selectedSuggestion?.id === suggestion.id;
            
            return (
              <Card 
                key={suggestion.id}
                className={cn(
                  "bg-card border-border transition-all cursor-pointer",
                  isExpanded ? "ring-1 ring-primary" : "hover:border-primary/30"
                )}
                onClick={() => setSelectedSuggestion(isExpanded ? null : suggestion)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <div className={cn("p-1.5 rounded-md shrink-0", typeConfig[suggestion.type].color)}>
                      <TypeIcon className="w-3.5 h-3.5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="font-medium text-foreground text-sm line-clamp-1">
                          {suggestion.title}
                        </h4>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className="text-[10px] h-5">
                            <span className={impactColors[suggestion.impact]}>●</span>
                            <span className="ml-1">{suggestion.impact}</span>
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {suggestion.description}
                      </p>

                      {/* Confidence bar */}
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground">Confidence</span>
                        <Progress value={suggestion.confidence} className="h-1 flex-1" />
                        <span className="text-[10px] font-medium text-foreground">{suggestion.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-border space-y-4" onClick={e => e.stopPropagation()}>
                      {/* Reasoning */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          AI Reasoning
                        </div>
                        <p className="text-xs text-foreground/90 bg-secondary/50 p-2 rounded">
                          {suggestion.reasoning}
                        </p>
                      </div>

                      {/* Affected Nodes */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                          <GitBranch className="w-3 h-3" />
                          Affected Entities
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {suggestion.affectedNodes.map(node => (
                            <Badge 
                              key={node} 
                              variant="outline" 
                              className="text-[10px] gap-1 cursor-pointer hover:bg-primary/10"
                              onClick={() => onNavigateToNode?.(node)}
                            >
                              {node}
                              <ExternalLink className="w-2.5 h-2.5" />
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {/* Alternatives */}
                      <div>
                        <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1">
                          <BarChart3 className="w-3 h-3" />
                          Alternative Approaches
                        </div>
                        <div className="space-y-1">
                          {suggestion.alternatives.map((alt, i) => (
                            <div key={i} className="flex items-center gap-1.5 text-xs text-foreground/80">
                              <ChevronRight className="w-3 h-3 text-primary" />
                              {alt}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Impact/Effort */}
                      <div className="flex gap-4">
                        <div>
                          <div className="text-[10px] text-muted-foreground">Impact</div>
                          <div className={cn("text-sm font-medium capitalize", impactColors[suggestion.impact])}>
                            {suggestion.impact}
                          </div>
                        </div>
                        <div>
                          <div className="text-[10px] text-muted-foreground">Effort</div>
                          <div className={cn("text-sm font-medium capitalize", impactColors[suggestion.effort])}>
                            {suggestion.effort}
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          className="flex-1 gap-1.5"
                          onClick={() => handleAcceptSuggestion(suggestion)}
                        >
                          <ThumbsUp className="w-3.5 h-3.5" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          className="flex-1 gap-1.5"
                          onClick={() => handleDismissSuggestion(suggestion)}
                        >
                          <ThumbsDown className="w-3.5 h-3.5" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}

          {filteredSuggestions.length === 0 && !isAnalyzing && (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
              <div className="text-sm font-medium text-foreground">All caught up!</div>
              <div className="text-xs text-muted-foreground">No pending suggestions in this category</div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer Stats */}
      <div className="p-3 border-t border-border bg-secondary/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <Clock className="w-3 h-3" />
            Last analyzed 2 hours ago
          </div>
          <div className="flex items-center gap-3">
            <span className="text-success">+5 accepted this week</span>
            <span className="text-muted-foreground">·</span>
            <span className="text-muted-foreground">2 dismissed</span>
          </div>
        </div>
      </div>
    </div>
  );
}
