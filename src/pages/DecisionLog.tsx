import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { 
  Plus, 
  Search, 
  Filter, 
  ArrowUpDown,
  ChevronRight,
  Clock,
  User,
  Users as UsersIcon,
  GitBranch,
  AlertTriangle,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockDecisions, mockPersons, mockTeams } from "@/lib/mock-data";
import type { Decision, DecisionStatus } from "@/types/database";
import { formatDistanceToNow, format } from "date-fns";

const statusConfig: Record<DecisionStatus, { label: string; color: string; bg: string }> = {
  proposed: { label: "Proposed", color: "text-warning", bg: "bg-warning/10" },
  confirmed: { label: "Confirmed", color: "text-success", bg: "bg-success/10" },
  deprecated: { label: "Deprecated", color: "text-muted-foreground", bg: "bg-muted" },
};

const DecisionLog = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDecision, setSelectedDecision] = useState<Decision | null>(null);
  const [sortField, setSortField] = useState<"updated_at" | "title" | "status">("updated_at");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const filteredDecisions = mockDecisions
    .filter(d => 
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.canonical_text.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      const modifier = sortDirection === "asc" ? 1 : -1;
      if (sortField === "updated_at") {
        return modifier * (new Date(a.updated_at).getTime() - new Date(b.updated_at).getTime());
      }
      if (sortField === "title") {
        return modifier * a.title.localeCompare(b.title);
      }
      return modifier * a.status.localeCompare(b.status);
    });

  const getOwner = (ownerId: string | null) => {
    if (!ownerId) return null;
    return mockPersons.find(p => p.id === ownerId);
  };

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("desc");
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Decision Log</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Single source of truth with version control
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-2" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-2" />
              New Decision
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search decisions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Decision Table */}
        <div className="rounded-xl border border-border overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead 
                  className="cursor-pointer hover:text-foreground transition-colors"
                  onClick={() => toggleSort("title")}
                >
                  <div className="flex items-center gap-2">
                    Decision Title
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground transition-colors w-32"
                  onClick={() => toggleSort("status")}
                >
                  <div className="flex items-center gap-2">
                    Status
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="w-40">Owner</TableHead>
                <TableHead className="w-40">Affected Teams</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-foreground transition-colors w-36"
                  onClick={() => toggleSort("updated_at")}
                >
                  <div className="flex items-center gap-2">
                    Last Updated
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </TableHead>
                <TableHead className="w-24">Confidence</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDecisions.map((decision) => {
                const owner = getOwner(decision.owner_person_id);
                const status = statusConfig[decision.status];
                
                return (
                  <TableRow 
                    key={decision.id}
                    className="cursor-pointer hover:bg-card-hover"
                    onClick={() => setSelectedDecision(decision)}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                          status.bg
                        )}>
                          <GitBranch className={cn("w-4 h-4", status.color)} />
                        </div>
                        <span className="line-clamp-1">{decision.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn("text-xs", status.color, status.bg)}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {owner && (
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center">
                            <span className="text-[10px] font-medium">
                              {owner.name.split(" ").map(n => n[0]).join("")}
                            </span>
                          </div>
                          <span className="text-sm text-muted-foreground">{owner.name}</span>
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {mockTeams.slice(0, 2).map(team => (
                          <Badge key={team.id} variant="outline" className="text-[10px]">
                            {team.name}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(decision.updated_at), { addSuffix: true })}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-12 h-1.5 rounded-full bg-secondary overflow-hidden">
                          <div 
                            className={cn(
                              "h-full rounded-full",
                              decision.confidence >= 0.8 ? "bg-success" :
                              decision.confidence >= 0.6 ? "bg-warning" : "bg-conflict"
                            )}
                            style={{ width: `${decision.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {Math.round(decision.confidence * 100)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        {/* Decision Detail Dialog */}
        <Dialog open={!!selectedDecision} onOpenChange={() => setSelectedDecision(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            {selectedDecision && (() => {
              const owner = getOwner(selectedDecision.owner_person_id);
              const status = statusConfig[selectedDecision.status];
              
              return (
                <>
                  <DialogHeader>
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className={cn(status.color, status.bg)}>
                        {status.label}
                      </Badge>
                      <span className="text-xs text-muted-foreground">v2</span>
                    </div>
                    <DialogTitle className="text-xl mt-2">{selectedDecision.title}</DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground">
                      Created {format(new Date(selectedDecision.created_at), "MMM d, yyyy")} • 
                      Updated {formatDistanceToNow(new Date(selectedDecision.updated_at), { addSuffix: true })}
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-6 mt-4">
                    {/* Canonical Text */}
                    <div className="p-4 rounded-lg bg-secondary/30 border border-border">
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
                        Decision Statement
                      </h4>
                      <p className="text-sm text-foreground leading-relaxed">
                        {selectedDecision.canonical_text}
                      </p>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <User className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Owner</p>
                          <p className="text-sm font-medium text-foreground">{owner?.name || "Unassigned"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
                        <UsersIcon className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Affected Teams</p>
                          <p className="text-sm font-medium text-foreground">
                            {mockTeams.slice(0, 2).map(t => t.name).join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Version Timeline */}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
                        Version History
                      </h4>
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-card border border-border">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-primary">v2</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium text-foreground">Current version</span>
                              <span className="text-xs text-muted-foreground">2 days ago</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Updated by {owner?.name} — Changed timeline from Feb to March
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-secondary/20 border border-border">
                          <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-medium text-muted-foreground">v1</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm text-muted-foreground">Initial version</span>
                              <span className="text-xs text-muted-foreground">1 week ago</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              Created by {owner?.name}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Conflicts */}
                    <div className="p-3 rounded-lg bg-conflict/5 border border-conflict/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-conflict" />
                        <span className="text-xs font-medium text-conflict">1 Conflict Detected</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Marketing timeline conflicts with this decision's March 15 date.
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-4 border-t border-border">
                      <Button size="sm">
                        Propose Edit
                      </Button>
                      <Button size="sm" variant="outline">
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Resolve Conflict
                      </Button>
                      <Button size="sm" variant="ghost">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Notify Stakeholders
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  );
};

export default DecisionLog;
