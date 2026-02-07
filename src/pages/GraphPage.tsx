import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Users, Briefcase, Target, FileText, FileCode, AlertTriangle, Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/database";
import { mockPersons, mockTeams, mockTopics, mockDecisions, mockDocuments } from "@/lib/mock-data";

interface SelectedNode {
  id: string;
  type: EntityType;
  label: string;
}

const nodeTypeConfig: Record<EntityType, { icon: typeof Users; label: string; color: string }> = {
  person: { icon: Users, label: "People", color: "text-primary" },
  team: { icon: Briefcase, label: "Teams", color: "text-purple-400" },
  topic: { icon: Target, label: "Topics", color: "text-warning" },
  decision: { icon: FileText, label: "Decisions", color: "text-success" },
  document: { icon: FileCode, label: "Documents", color: "text-info" },
};

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
  const [activeTab, setActiveTab] = useState("flow");

  const toggleNodeType = (type: EntityType) => {
    setNodeFilters(prev => ({ ...prev, [type]: !prev[type] }));
  };

  // Get entity details
  const getEntityDetails = (node: SelectedNode) => {
    switch (node.type) {
      case "person":
        return mockPersons.find(p => p.id === node.id);
      case "team":
        return mockTeams.find(t => t.id === node.id);
      case "topic":
        return mockTopics.find(t => t.id === node.id);
      case "decision":
        return mockDecisions.find(d => d.id === node.id);
      case "document":
        return mockDocuments.find(d => d.id === node.id);
      default:
        return null;
    }
  };

  const entityDetails = selectedNode ? getEntityDetails(selectedNode) : null;

  return (
    <AppLayout>
      <div className="h-full flex gap-6 animate-fade-in">
        {/* Left Panel: Filters */}
        <div className="w-64 shrink-0 space-y-6">
          <div>
            <h1 className="text-xl font-bold text-foreground">Knowledge Graph</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Visualize who knows what and how knowledge flows
            </p>
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
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Node Types</Label>
            {(Object.entries(nodeTypeConfig) as [EntityType, typeof nodeTypeConfig.person][]).map(([type, config]) => {
              const Icon = config.icon;
              return (
                <div 
                  key={type}
                  className="flex items-center justify-between p-2 rounded-lg bg-card border border-border"
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", config.color)} />
                    <span className="text-sm text-foreground">{config.label}</span>
                  </div>
                  <Switch 
                    checked={nodeFilters[type]} 
                    onCheckedChange={() => toggleNodeType(type)}
                  />
                </div>
              );
            })}
          </div>

          {/* Special Filters */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground">Special Views</Label>
            <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-conflict" />
                <span className="text-sm text-foreground">Conflicts only</span>
              </div>
              <Switch 
                checked={showConflictsOnly} 
                onCheckedChange={setShowConflictsOnly}
              />
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-card border border-border">
              <div className="flex items-center gap-2">
                <Minus className="w-4 h-4 text-warning" />
                <span className="text-sm text-foreground">Bottlenecks only</span>
              </div>
              <Switch 
                checked={showBottlenecksOnly} 
                onCheckedChange={setShowBottlenecksOnly}
              />
            </div>
          </div>

          {/* Team/Project Filter */}
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Filter by Team</Label>
            <Select defaultValue="all">
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
        </div>

        {/* Graph Canvas */}
        <div className="flex-1 flex flex-col">
          {/* View Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
            <TabsList>
              <TabsTrigger value="flow">Flow Map</TabsTrigger>
              <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
              <TabsTrigger value="diff">Diff View</TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Graph */}
          <div className="flex-1 rounded-xl overflow-hidden border border-border">
            <KnowledgeGraph 
              className="h-full" 
              onNodeClick={(node) => setSelectedNode(node as SelectedNode)}
            />
          </div>
        </div>

        {/* Right Drawer: Node Inspector */}
        {selectedNode && (
          <div className="w-80 shrink-0 bg-card rounded-xl border border-border overflow-hidden">
            <div className="p-4 border-b border-border bg-gradient-card flex items-center justify-between">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = nodeTypeConfig[selectedNode.type].icon;
                  return <Icon className={cn("w-5 h-5", nodeTypeConfig[selectedNode.type].color)} />;
                })()}
                <span className="font-semibold text-foreground text-sm">{selectedNode.label}</span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setSelectedNode(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-300px)]">
              {/* Type Badge */}
              <div className="flex items-center gap-2">
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-medium capitalize",
                  "bg-primary/10 text-primary"
                )}>
                  {selectedNode.type}
                </span>
              </div>

              {/* AI Summary */}
              <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-4 h-4 rounded-full bg-gradient-primary flex items-center justify-center">
                    <span className="text-[8px] font-bold text-primary-foreground">AI</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">AI Summary</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">
                  {selectedNode.type === "person" && "Key stakeholder involved in 3 active decisions. Primary communication hub between Engineering and Product teams."}
                  {selectedNode.type === "team" && "High-velocity team with 5 active projects. Dependencies on Product for roadmap clarity."}
                  {selectedNode.type === "topic" && "Critical topic affecting Q1 timeline. Referenced in 4 recent decisions."}
                  {selectedNode.type === "decision" && "Important decision with moderate confidence. Awaiting stakeholder confirmation from Marketing."}
                  {selectedNode.type === "document" && "Reference document for enterprise requirements. Last updated 3 days ago."}
                </p>
              </div>

              {/* Entity Details */}
              {entityDetails && (
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Details</h4>
                  {"role" in entityDetails && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Role</span>
                      <span className="text-foreground">{entityDetails.role}</span>
                    </div>
                  )}
                  {"email" in entityDetails && entityDetails.email && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Email</span>
                      <span className="text-foreground">{entityDetails.email}</span>
                    </div>
                  )}
                  {"status" in entityDetails && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-foreground capitalize">{entityDetails.status}</span>
                    </div>
                  )}
                  {"confidence" in entityDetails && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Confidence</span>
                      <span className="text-foreground">{Math.round(entityDetails.confidence * 100)}%</span>
                    </div>
                  )}
                </div>
              )}

              {/* Related Decisions */}
              <div className="space-y-3">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Related Decisions</h4>
                <div className="space-y-2">
                  {mockDecisions.slice(0, 3).map(d => (
                    <div key={d.id} className="p-2 rounded-lg bg-secondary/30 hover:bg-secondary/50 cursor-pointer transition-colors">
                      <p className="text-sm text-foreground line-clamp-1">{d.title}</p>
                      <span className={cn(
                        "text-xs capitalize",
                        d.status === "confirmed" ? "text-success" : "text-warning"
                      )}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Why Routed */}
              <div className="p-3 rounded-lg bg-info/5 border border-info/20">
                <h4 className="text-xs font-medium text-info mb-2">Why routed to you?</h4>
                <p className="text-xs text-muted-foreground">
                  This {selectedNode.type} appears in your routing queue because you own related decisions and your team depends on this information.
                </p>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" className="flex-1 text-xs">
                  <Plus className="w-3 h-3 mr-1" />
                  Create Update
                </Button>
                <Button size="sm" variant="outline" className="flex-1 text-xs">
                  <FileText className="w-3 h-3 mr-1" />
                  Create Decision
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default GraphPage;
