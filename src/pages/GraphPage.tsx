import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KnowledgeGraph, GraphNode } from "@/components/graph/KnowledgeGraph";
import { WorkflowAgentPanel } from "@/components/workflow/WorkflowAgentPanel";
import { HistoricalTimeline } from "@/components/history/HistoricalTimeline";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Users, Briefcase, Target, FileText, FileCode, AlertTriangle, Plus, ExternalLink, MessageSquare, GitBranch, Clock, Zap, Focus, Bot, History } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/database";

interface SelectedNode {
  id: string;
  type: EntityType;
  label: string;
  metadata?: {
    role?: string;
    status?: "active" | "pending" | "resolved";
    loadScore?: number;
    confidence?: number;
    description?: string;
    hasConflict?: boolean;
    isBottleneck?: boolean;
  };
  connections?: string[];
}

const nodeTypeConfig: Record<EntityType, { icon: typeof Users; label: string; color: string }> = {
  person: { icon: Users, label: "People", color: "text-primary" },
  team: { icon: Briefcase, label: "Teams", color: "text-purple-400" },
  topic: { icon: Target, label: "Topics", color: "text-warning" },
  decision: { icon: FileText, label: "Decisions", color: "text-success" },
  document: { icon: FileCode, label: "Documents", color: "text-info" },
};

// People for center focus
const focusPeople = [
  { id: "ceo-1", name: "Nathaniel Velazquez", role: "CEO" },
  { id: "vp-eng", name: "Sarah Chen", role: "VP Engineering" },
  { id: "vp-prod", name: "Marcus Johnson", role: "Head of Product" },
  { id: "vp-sales", name: "Lisa Thompson", role: "VP Sales" },
  { id: "vp-mktg", name: "David Kim", role: "CMO" },
  { id: "vp-design", name: "Emily Rodriguez", role: "Design Director" },
];

// Mock teams for filter dropdown
const mockTeams = [
  { id: "team-exec", name: "Executive" },
  { id: "team-eng", name: "Engineering" },
  { id: "team-prod", name: "Product" },
  { id: "team-design", name: "Design" },
  { id: "team-mktg", name: "Marketing" },
  { id: "team-sales", name: "Sales" },
  { id: "team-platform", name: "Platform" },
];

// Related decisions mock
const relatedDecisions = [
  { id: "d1", title: "Adopt Next.js for frontend", status: "confirmed", confidence: 0.92 },
  { id: "d2", title: "Launch date March 15", status: "proposed", confidence: 0.75 },
  { id: "d3", title: "4-Tier Pricing Model", status: "proposed", confidence: 0.65 },
  { id: "d4", title: "Deprecate API v1", status: "confirmed", confidence: 0.95 },
];

// Related conflicts mock
const relatedConflicts = [
  { id: "c1", description: "Marketing/Engineering date conflict", severity: "high" },
  { id: "c2", description: "Pricing tier disagreement", severity: "medium" },
];

const GraphPage = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [nodeFilters, setNodeFilters] = useState<Record<EntityType, boolean>>({
    person: true,
    team: true,
    topic: true,
    decision: true,
    document: true,
  });
  const [showConflictsOnly, setShowConflictsOnly] = useState(false);
  const [showBottlenecksOnly, setShowBottlenecksOnly] = useState(false);
  const [selectedNode, setSelectedNode] = useState<SelectedNode | null>(null);
  const [activeTab, setActiveTab] = useState<"flow" | "bottlenecks" | "diff">("flow");
  const [selectedTeam, setSelectedTeam] = useState("all");
  const [centerNodeId, setCenterNodeId] = useState<string | null>(null);
  const [rightPanelTab, setRightPanelTab] = useState<"inspector" | "workflow" | "history">("inspector");

  const toggleNodeType = (type: EntityType) => {
    setNodeFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode({
      id: node.id,
      type: node.type,
      label: node.label,
      metadata: node.metadata,
      connections: node.connections,
    });
  };

  const handleCenterOnNode = (nodeId: string) => {
    setCenterNodeId(nodeId === centerNodeId ? null : nodeId);
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "active":
      case "confirmed":
        return "bg-success/20 text-success border-success/30";
      case "pending":
      case "proposed":
        return "bg-warning/20 text-warning border-warning/30";
      case "resolved":
      case "deprecated":
        return "bg-muted text-muted-foreground border-muted";
      default:
        return "bg-secondary text-foreground border-border";
    }
  };

  const getLoadColor = (loadScore?: number) => {
    if (!loadScore) return "text-muted-foreground";
    if (loadScore >= 90) return "text-destructive";
    if (loadScore >= 75) return "text-warning";
    return "text-success";
  };

  // Handle view mode changes
  const handleViewModeChange = (mode: string) => {
    setActiveTab(mode as "flow" | "bottlenecks" | "diff");
    
    if (mode === "bottlenecks") {
      setShowBottlenecksOnly(true);
      setShowConflictsOnly(false);
    } else {
      setShowBottlenecksOnly(false);
    }
  };

  return (
    <AppLayout>
      <div className="h-full flex gap-4 animate-fade-in">
        {/* Left Panel: Filters */}
        <div className="w-72 shrink-0 space-y-5 bg-card/50 rounded-xl border border-border p-4 overflow-y-auto">
          <div>
            <h1 className="text-lg font-bold text-foreground">Knowledge Graph</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Visualize stakeholders, dependencies & knowledge flow
            </p>
          </div>

          {/* Focus Center */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Focus className="w-3 h-3" />
              Focus on Person
            </Label>
            <Select 
              value={centerNodeId || "none"} 
              onValueChange={(val) => setCenterNodeId(val === "none" ? null : val)}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="Select person to focus" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Show all (no focus)</SelectItem>
                {focusPeople.map(person => (
                  <SelectItem key={person.id} value={person.id}>
                    <div className="flex flex-col">
                      <span>{person.name}</span>
                      <span className="text-[10px] text-muted-foreground">{person.role}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {centerNodeId && (
              <p className="text-[10px] text-primary">
                Showing connections for {focusPeople.find(p => p.id === centerNodeId)?.name}
              </p>
            )}
          </div>

          {/* Time Range */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Time Range</Label>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 hours</SelectItem>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="custom">Custom range</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Node Type Toggles */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Node Types</Label>
            <div className="space-y-2">
              {(Object.entries(nodeTypeConfig) as [EntityType, typeof nodeTypeConfig.person][]).map(([type, config]) => {
                const Icon = config.icon;
                const isEnabled = nodeFilters[type];
                return (
                  <button
                    key={type}
                    onClick={() => toggleNodeType(type)}
                    className={cn(
                      "flex items-center justify-between w-full p-2.5 rounded-lg border transition-all",
                      isEnabled 
                        ? "bg-secondary/50 border-border hover:bg-secondary"
                        : "bg-transparent border-border/50 opacity-50 hover:opacity-75"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={cn("w-4 h-4", isEnabled ? config.color : "text-muted-foreground")} />
                      <span className={cn("text-sm", isEnabled ? "text-foreground" : "text-muted-foreground")}>
                        {config.label}
                      </span>
                    </div>
                    <Switch 
                      checked={isEnabled}
                      onCheckedChange={() => toggleNodeType(type)}
                      className="pointer-events-none"
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Special Filters */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Special Views</Label>
            <div className="space-y-2">
              <div className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer",
                showConflictsOnly ? "bg-conflict/10 border-conflict/30" : "bg-secondary/50 border-border hover:bg-secondary"
              )}
              onClick={() => {
                setShowConflictsOnly(!showConflictsOnly);
                if (!showConflictsOnly) setShowBottlenecksOnly(false);
              }}
              >
                <div className="flex items-center gap-2">
                  <AlertTriangle className={cn("w-4 h-4", showConflictsOnly ? "text-conflict" : "text-muted-foreground")} />
                  <span className="text-sm text-foreground">Conflicts only</span>
                </div>
                <Switch 
                  checked={showConflictsOnly} 
                  onCheckedChange={(val) => {
                    setShowConflictsOnly(val);
                    if (val) setShowBottlenecksOnly(false);
                  }}
                />
              </div>
              <div className={cn(
                "flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer",
                showBottlenecksOnly ? "bg-warning/10 border-warning/30" : "bg-secondary/50 border-border hover:bg-secondary"
              )}
              onClick={() => {
                setShowBottlenecksOnly(!showBottlenecksOnly);
                if (!showBottlenecksOnly) setShowConflictsOnly(false);
              }}
              >
                <div className="flex items-center gap-2">
                  <Zap className={cn("w-4 h-4", showBottlenecksOnly ? "text-warning" : "text-muted-foreground")} />
                  <span className="text-sm text-foreground">Bottlenecks only</span>
                </div>
                <Switch 
                  checked={showBottlenecksOnly} 
                  onCheckedChange={(val) => {
                    setShowBottlenecksOnly(val);
                    if (val) setShowConflictsOnly(false);
                  }}
                />
              </div>
            </div>
          </div>

          {/* Team Filter */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Filter by Team</Label>
            <Select value={selectedTeam} onValueChange={setSelectedTeam}>
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All teams" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All teams</SelectItem>
                {mockTeams.map(team => (
                  <SelectItem key={team.id} value={team.id}>{team.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Reset filters */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={() => {
              setNodeFilters({
                person: true,
                team: true,
                topic: true,
                decision: true,
                document: true,
              });
              setShowConflictsOnly(false);
              setShowBottlenecksOnly(false);
              setSelectedTeam("all");
              setCenterNodeId(null);
            }}
          >
            Reset all filters
          </Button>
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* View Tabs */}
          <div className="mb-3 flex items-center justify-between">
            <Tabs value={activeTab} onValueChange={handleViewModeChange}>
              <TabsList>
                <TabsTrigger value="flow" className="gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  Flow Map
                </TabsTrigger>
                <TabsTrigger value="bottlenecks" className="gap-1.5">
                  <Zap className="w-3.5 h-3.5" />
                  Bottlenecks
                </TabsTrigger>
                <TabsTrigger value="diff" className="gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Diff View
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="text-xs text-muted-foreground">
              Click nodes to inspect • Scroll to zoom • Drag to pan
            </div>
          </div>

          {/* Graph */}
          <div className="flex-1 rounded-xl overflow-hidden border border-border">
            <KnowledgeGraph 
              className="h-full" 
              onNodeClick={handleNodeClick}
              nodeFilters={nodeFilters}
              centerNodeId={centerNodeId}
              showConflictsOnly={showConflictsOnly}
              showBottlenecksOnly={showBottlenecksOnly}
              teamFilter={selectedTeam}
              viewMode={activeTab}
            />
          </div>
        </div>

        {/* Right Panel: Multi-Tab Inspector/Agent/History */}
        <div className="w-80 shrink-0 flex flex-col bg-card rounded-xl border border-border overflow-hidden">
          {/* Right Panel Tabs */}
          <div className="p-2 border-b border-border">
            <Tabs value={rightPanelTab} onValueChange={(v) => setRightPanelTab(v as typeof rightPanelTab)}>
              <TabsList className="w-full">
                <TabsTrigger value="inspector" className="flex-1 gap-1 text-xs">
                  <Focus className="w-3 h-3" />
                  Inspector
                </TabsTrigger>
                <TabsTrigger value="workflow" className="flex-1 gap-1 text-xs">
                  <Bot className="w-3 h-3" />
                  Agent
                </TabsTrigger>
                <TabsTrigger value="history" className="flex-1 gap-1 text-xs">
                  <History className="w-3 h-3" />
                  History
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Inspector Tab Content */}
          {rightPanelTab === "inspector" && (
            <>
              {selectedNode ? (
                <>
                  {/* Header */}
                  <div className="p-4 border-b border-border bg-gradient-card flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2 min-w-0">
                      {(() => {
                        const Icon = nodeTypeConfig[selectedNode.type].icon;
                        return <Icon className={cn("w-5 h-5 shrink-0", nodeTypeConfig[selectedNode.type].color)} />;
                      })()}
                      <span className="font-semibold text-foreground text-sm truncate">{selectedNode.label}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 shrink-0"
                        onClick={() => handleCenterOnNode(selectedNode.id)}
                        title="Focus graph on this node"
                      >
                        <Focus className={cn("w-4 h-4", centerNodeId === selectedNode.id ? "text-primary" : "")} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 shrink-0"
                        onClick={() => setSelectedNode(null)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

            <ScrollArea className="flex-1">
              <div className="p-4 space-y-4">
                {/* Type and Status Badges */}
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="capitalize">
                    {selectedNode.type}
                  </Badge>
                  {selectedNode.metadata?.status && (
                    <Badge className={cn("capitalize border", getStatusColor(selectedNode.metadata.status))}>
                      {selectedNode.metadata.status}
                    </Badge>
                  )}
                  {selectedNode.metadata?.loadScore && selectedNode.metadata.loadScore > 75 && (
                    <Badge className="bg-destructive/20 text-destructive border-destructive/30">
                      High Load
                    </Badge>
                  )}
                  {selectedNode.metadata?.hasConflict && (
                    <Badge className="bg-conflict/20 text-conflict border-conflict/30">
                      Conflict
                    </Badge>
                  )}
                  {selectedNode.metadata?.isBottleneck && (
                    <Badge className="bg-warning/20 text-warning border-warning/30">
                      Bottleneck
                    </Badge>
                  )}
                </div>

                {/* Role/Description */}
                {selectedNode.metadata?.role && (
                  <div className="text-sm text-muted-foreground">
                    {selectedNode.metadata.role}
                  </div>
                )}

                {/* Stats Row */}
                <div className="flex gap-4 p-3 rounded-lg bg-secondary/50">
                  <div className="text-center">
                    <div className="text-lg font-bold text-foreground">
                      {selectedNode.connections?.length || 0}
                    </div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Connections
                    </div>
                  </div>
                  {selectedNode.metadata?.loadScore && (
                    <div className="text-center">
                      <div className={cn("text-lg font-bold", getLoadColor(selectedNode.metadata.loadScore))}>
                        {selectedNode.metadata.loadScore}%
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Load
                      </div>
                    </div>
                  )}
                  {selectedNode.metadata?.confidence && (
                    <div className="text-center">
                      <div className="text-lg font-bold text-foreground">
                        {Math.round(selectedNode.metadata.confidence * 100)}%
                      </div>
                      <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Confidence
                      </div>
                    </div>
                  )}
                </div>

                {/* AI Summary */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
                      <span className="text-[9px] font-bold text-primary-foreground">AI</span>
                    </div>
                    <span className="text-xs font-medium text-primary">AI Summary</span>
                  </div>
                  <p className="text-sm text-foreground leading-relaxed">
                    {selectedNode.type === "person" && `Key stakeholder with ${selectedNode.connections?.length || 0} active connections. ${selectedNode.metadata?.loadScore && selectedNode.metadata.loadScore > 80 ? "Currently at high capacity - consider redistributing workload." : "Communication hub between teams."}`}
                    {selectedNode.type === "team" && `Active team with multiple cross-functional dependencies. Key contributor to ongoing initiatives.`}
                    {selectedNode.type === "topic" && `Strategic topic actively referenced in organizational discussions and decisions.`}
                    {selectedNode.type === "decision" && `${selectedNode.metadata?.status === "pending" ? "Awaiting stakeholder confirmation." : "Confirmed decision in effect."} Confidence: ${Math.round((selectedNode.metadata?.confidence || 0.5) * 100)}%`}
                    {selectedNode.type === "document" && `Reference document supporting key decisions. ${selectedNode.metadata?.status === "pending" ? "Requires review." : "Up to date."}`}
                  </p>
                </div>

                {/* Related Decisions */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3 h-3" />
                    Related Decisions
                  </h4>
                  <div className="space-y-1.5">
                    {relatedDecisions.slice(0, 3).map(d => (
                      <div key={d.id} className="p-2.5 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors group">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm text-foreground line-clamp-1 flex-1">{d.title}</p>
                          <ExternalLink className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={cn(
                            "text-xs capitalize px-1.5 py-0.5 rounded",
                            d.status === "confirmed" ? "bg-success/20 text-success" : "bg-warning/20 text-warning"
                          )}>{d.status}</span>
                          <span className="text-xs text-muted-foreground">{Math.round(d.confidence * 100)}% confidence</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Related Conflicts */}
                <div className="space-y-2">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" />
                    Active Conflicts
                  </h4>
                  <div className="space-y-1.5">
                    {relatedConflicts.map(c => (
                      <div key={c.id} className="p-2.5 rounded-lg bg-conflict/5 border border-conflict/20 hover:bg-conflict/10 cursor-pointer transition-colors">
                        <p className="text-sm text-foreground line-clamp-2">{c.description}</p>
                        <Badge className={cn(
                          "mt-1.5 text-[10px]",
                          c.severity === "high" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                        )}>
                          {c.severity} severity
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Why Routed */}
                <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                  <h4 className="text-xs font-medium text-info mb-2 flex items-center gap-1.5">
                    <MessageSquare className="w-3 h-3" />
                    Why routed to you?
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    This {selectedNode.type} is in your view because you have ownership of related decisions or your team has dependencies on this information flow.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button size="sm" className="flex-1 text-xs h-9">
                    <Plus className="w-3 h-3 mr-1" />
                    Create Update
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 text-xs h-9">
                    <FileText className="w-3 h-3 mr-1" />
                    Log Decision
                  </Button>
                </div>
              </div>
            </ScrollArea>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                  <Focus className="w-12 h-12 text-muted-foreground/30 mb-3" />
                  <h3 className="font-medium text-foreground mb-1">No node selected</h3>
                  <p className="text-xs text-muted-foreground">
                    Click on a node in the graph to inspect its details, relationships, and AI insights.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Workflow Agent Tab Content */}
          {rightPanelTab === "workflow" && (
            <WorkflowAgentPanel 
              className="flex-1" 
              onNavigateToNode={(nodeId) => setCenterNodeId(nodeId)}
            />
          )}

          {/* History Tab Content */}
          {rightPanelTab === "history" && (
            <HistoricalTimeline 
              className="flex-1 border-0 rounded-none"
              entityFilter={selectedNode?.id}
              onNavigateToEntity={(entityId) => setCenterNodeId(entityId)}
            />
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default GraphPage;
