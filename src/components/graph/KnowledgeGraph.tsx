import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/database";
import { Users, Briefcase, Target, FileText, FileCode, ZoomIn, ZoomOut, Maximize2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  connections?: string[];
  teamId?: string;
  metadata?: {
    role?: string;
    status?: "active" | "pending" | "resolved";
    updatedAt?: string;
    loadScore?: number;
    confidence?: number;
    description?: string;
    hasConflict?: boolean;
    isBottleneck?: boolean;
  };
}

interface KnowledgeGraphProps {
  nodes?: GraphNode[];
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
  nodeFilters?: Record<EntityType, boolean>;
  centerNodeId?: string | null;
  showConflictsOnly?: boolean;
  showBottlenecksOnly?: boolean;
  teamFilter?: string;
  viewMode?: "flow" | "bottlenecks" | "diff";
}

const nodeColors: Record<EntityType, { hue: string; label: string }> = {
  person: { hue: "190 90% 50%", label: "People" },
  team: { hue: "280 70% 60%", label: "Teams" },
  decision: { hue: "145 70% 45%", label: "Decisions" },
  topic: { hue: "45 90% 55%", label: "Topics" },
  document: { hue: "210 80% 60%", label: "Documents" },
};

const nodeIcons: Record<EntityType, typeof Users> = {
  person: Users,
  team: Briefcase,
  decision: FileText,
  topic: Target,
  document: FileCode,
};

// Extended default nodes with team assignments and metadata
const defaultNodes: GraphNode[] = [
  // Executive Team
  { id: "ceo-1", label: "Nathaniel Velazquez", type: "person", teamId: "team-exec", connections: ["team-exec", "vp-eng", "vp-prod", "vp-sales", "vp-mktg", "decision-strategy"], metadata: { role: "CEO", loadScore: 95, isBottleneck: true } },
  
  // VPs and Directors
  { id: "vp-eng", label: "Sarah Chen", type: "person", teamId: "team-eng", connections: ["ceo-1", "team-eng", "decision-nextjs", "decision-api", "topic-ai", "eng-lead-1", "eng-lead-2"], metadata: { role: "VP Engineering", loadScore: 85, isBottleneck: true } },
  { id: "vp-prod", label: "Marcus Johnson", type: "person", teamId: "team-prod", connections: ["ceo-1", "team-prod", "decision-launch", "decision-pricing", "topic-launch", "pm-1", "pm-2"], metadata: { role: "Head of Product", loadScore: 72 } },
  { id: "vp-sales", label: "Lisa Thompson", type: "person", teamId: "team-sales", connections: ["ceo-1", "team-sales", "decision-pricing", "topic-enterprise", "sales-1", "sales-2"], metadata: { role: "VP Sales", loadScore: 68 } },
  { id: "vp-design", label: "Emily Rodriguez", type: "person", teamId: "team-design", connections: ["team-design", "vp-prod", "topic-onboarding", "designer-1", "designer-2"], metadata: { role: "Design Director", loadScore: 45 } },
  { id: "vp-mktg", label: "David Kim", type: "person", teamId: "team-mktg", connections: ["ceo-1", "team-mktg", "decision-launch", "topic-launch", "mktg-1", "mktg-2"], metadata: { role: "CMO", loadScore: 92, isBottleneck: true } },
  
  // Engineering Team Members
  { id: "eng-lead-1", label: "James Wilson", type: "person", teamId: "team-eng", connections: ["vp-eng", "team-eng", "decision-nextjs", "doc-api", "eng-3"], metadata: { role: "Senior Engineer", loadScore: 55 } },
  { id: "eng-lead-2", label: "Priya Patel", type: "person", teamId: "team-eng", connections: ["vp-eng", "team-eng", "topic-infra", "decision-api", "eng-4"], metadata: { role: "Staff Engineer", loadScore: 78 } },
  { id: "eng-3", label: "Alex Turner", type: "person", teamId: "team-eng", connections: ["eng-lead-1", "team-eng", "topic-ai", "decision-ai-model"], metadata: { role: "ML Engineer", loadScore: 62 } },
  { id: "eng-4", label: "Jordan Lee", type: "person", teamId: "team-platform", connections: ["eng-lead-2", "team-platform", "topic-infra", "decision-security"], metadata: { role: "DevOps Lead", loadScore: 70 } },
  { id: "eng-5", label: "Taylor Martinez", type: "person", teamId: "team-eng", connections: ["eng-lead-1", "team-eng", "topic-ai"], metadata: { role: "Frontend Engineer", loadScore: 48 } },
  
  // Product Team Members
  { id: "pm-1", label: "Ana Martinez", type: "person", teamId: "team-prod", connections: ["vp-prod", "team-prod", "topic-onboarding", "decision-launch", "designer-1"], metadata: { role: "Product Manager", loadScore: 78, hasConflict: true } },
  { id: "pm-2", label: "Chris Park", type: "person", teamId: "team-prod", connections: ["vp-prod", "team-prod", "topic-enterprise", "decision-pricing"], metadata: { role: "Senior PM", loadScore: 65 } },
  
  // Design Team Members
  { id: "designer-1", label: "Sofia Nguyen", type: "person", teamId: "team-design", connections: ["vp-design", "team-design", "topic-onboarding", "pm-1"], metadata: { role: "Lead Designer", loadScore: 50 } },
  { id: "designer-2", label: "Ryan Cooper", type: "person", teamId: "team-design", connections: ["vp-design", "team-design", "topic-onboarding"], metadata: { role: "UX Researcher", loadScore: 35 } },
  
  // Sales Team Members
  { id: "sales-1", label: "Michael Brown", type: "person", teamId: "team-sales", connections: ["vp-sales", "team-sales", "topic-enterprise", "decision-pricing"], metadata: { role: "Enterprise AE", loadScore: 75 } },
  { id: "sales-2", label: "Jessica Adams", type: "person", teamId: "team-sales", connections: ["vp-sales", "team-sales", "topic-enterprise"], metadata: { role: "Sales Ops", loadScore: 55 } },
  
  // Marketing Team Members
  { id: "mktg-1", label: "Rachel Green", type: "person", teamId: "team-mktg", connections: ["vp-mktg", "team-mktg", "topic-launch", "topic-growth"], metadata: { role: "Content Lead", loadScore: 58 } },
  { id: "mktg-2", label: "Daniel Wright", type: "person", teamId: "team-mktg", connections: ["vp-mktg", "team-mktg", "topic-growth"], metadata: { role: "Growth Manager", loadScore: 67 } },
  
  // Teams
  { id: "team-exec", label: "Executive", type: "team", connections: ["ceo-1", "decision-strategy", "topic-growth"], metadata: { description: "Leadership Team" } },
  { id: "team-eng", label: "Engineering", type: "team", connections: ["vp-eng", "eng-lead-1", "eng-lead-2", "eng-3", "eng-5", "topic-ai", "topic-infra"], metadata: { description: "Core product development" } },
  { id: "team-prod", label: "Product", type: "team", connections: ["vp-prod", "pm-1", "pm-2", "team-eng", "team-design", "topic-launch"], metadata: { description: "Product strategy and roadmap" } },
  { id: "team-design", label: "Design", type: "team", connections: ["vp-design", "designer-1", "designer-2", "team-prod", "topic-onboarding"], metadata: { description: "UX and visual design" } },
  { id: "team-mktg", label: "Marketing", type: "team", connections: ["vp-mktg", "mktg-1", "mktg-2", "topic-launch", "topic-growth"], metadata: { description: "Growth and brand" } },
  { id: "team-sales", label: "Sales", type: "team", connections: ["vp-sales", "sales-1", "sales-2", "topic-enterprise", "decision-pricing"], metadata: { description: "Revenue and partnerships" } },
  { id: "team-platform", label: "Platform", type: "team", connections: ["eng-4", "topic-infra", "decision-security"], metadata: { description: "Infrastructure and DevOps" } },
  
  // Key Decisions
  { id: "decision-nextjs", label: "Adopt Next.js", type: "decision", connections: ["vp-eng", "eng-lead-1", "team-eng", "topic-launch"], metadata: { status: "active", confidence: 0.92 } },
  { id: "decision-launch", label: "Launch March 15", type: "decision", connections: ["vp-prod", "vp-mktg", "pm-1", "topic-launch", "decision-pricing"], metadata: { status: "pending", confidence: 0.75, hasConflict: true } },
  { id: "decision-api", label: "Deprecate API v1", type: "decision", connections: ["vp-eng", "eng-lead-2", "doc-api", "topic-enterprise"], metadata: { status: "active", confidence: 0.95 } },
  { id: "decision-pricing", label: "4-Tier Pricing", type: "decision", connections: ["vp-sales", "vp-prod", "pm-2", "sales-1", "decision-launch", "topic-enterprise"], metadata: { status: "pending", confidence: 0.65, hasConflict: true } },
  { id: "decision-strategy", label: "2025 Strategy", type: "decision", connections: ["ceo-1", "team-exec", "topic-ai", "topic-growth"], metadata: { status: "active", confidence: 0.88 } },
  { id: "decision-ai-model", label: "Use GPT-4", type: "decision", connections: ["vp-eng", "topic-ai", "eng-3"], metadata: { status: "active", confidence: 0.88 } },
  { id: "decision-security", label: "SOC2 Compliance", type: "decision", connections: ["eng-4", "topic-enterprise", "doc-security", "team-platform"], metadata: { status: "pending", confidence: 0.82 } },
  { id: "decision-remote", label: "Remote-First Policy", type: "decision", connections: ["ceo-1", "team-exec"], metadata: { status: "active", confidence: 0.90 } },
  
  // Topics
  { id: "topic-launch", label: "Q1 Launch", type: "topic", connections: ["decision-launch", "decision-nextjs", "team-mktg", "team-prod", "mktg-1"], metadata: { description: "Product launch for Q1 2025" } },
  { id: "topic-ai", label: "AI Strategy", type: "topic", connections: ["vp-eng", "eng-3", "decision-ai-model", "decision-strategy", "team-eng"], metadata: { description: "AI/ML integration strategy" } },
  { id: "topic-enterprise", label: "Enterprise", type: "topic", connections: ["vp-sales", "pm-2", "sales-1", "sales-2", "decision-pricing", "decision-api", "decision-security"], metadata: { description: "Enterprise sales & features" } },
  { id: "topic-onboarding", label: "User Onboarding", type: "topic", connections: ["vp-design", "pm-1", "designer-1", "designer-2", "team-design"], metadata: { description: "Improving user onboarding" } },
  { id: "topic-infra", label: "Infrastructure", type: "topic", connections: ["eng-lead-2", "eng-4", "team-platform"], metadata: { description: "Platform & scalability" } },
  { id: "topic-growth", label: "Growth", type: "topic", connections: ["team-mktg", "team-sales", "vp-mktg", "mktg-2", "decision-strategy"], metadata: { description: "User acquisition & retention" } },
  
  // Documents
  { id: "doc-launch", label: "Q1 Launch Plan", type: "document", connections: ["vp-prod", "topic-launch", "decision-launch"], metadata: { status: "active" } },
  { id: "doc-api", label: "API Migration Guide", type: "document", connections: ["eng-lead-1", "decision-api", "topic-enterprise"], metadata: { status: "pending" } },
  { id: "doc-security", label: "Security Requirements", type: "document", connections: ["eng-4", "decision-security", "topic-enterprise"], metadata: { status: "active" } },
  { id: "doc-pricing", label: "Pricing Analysis", type: "document", connections: ["vp-sales", "decision-pricing", "pm-2"], metadata: { status: "pending" } },
  { id: "doc-ai-eval", label: "AI Model Evaluation", type: "document", connections: ["eng-3", "decision-ai-model", "topic-ai"], metadata: { status: "resolved" } },
  { id: "doc-brand", label: "Brand Guidelines", type: "document", connections: ["team-mktg", "team-design", "vp-design"], metadata: { status: "active" } },
];

// Get all connected node IDs recursively (up to depth)
function getConnectedNodes(nodeId: string, allNodes: GraphNode[], depth: number = 1): Set<string> {
  const connected = new Set<string>([nodeId]);
  
  const expand = (ids: string[], currentDepth: number) => {
    if (currentDepth >= depth) return;
    
    const newIds: string[] = [];
    ids.forEach(id => {
      const node = allNodes.find(n => n.id === id);
      if (node?.connections) {
        node.connections.forEach(connId => {
          if (!connected.has(connId)) {
            connected.add(connId);
            newIds.push(connId);
          }
        });
      }
      // Also find nodes that connect TO this node
      allNodes.forEach(n => {
        if (n.connections?.includes(id) && !connected.has(n.id)) {
          connected.add(n.id);
          newIds.push(n.id);
        }
      });
    });
    
    if (newIds.length > 0) {
      expand(newIds, currentDepth + 1);
    }
  };
  
  expand([nodeId], 0);
  return connected;
}

// Force-directed layout simulation
function useForceLayout(
  initialNodes: GraphNode[],
  dimensions: { width: number; height: number },
  centerNodeId?: string | null
) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const animationRef = useRef<number>();
  const iterationRef = useRef(0);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0 || initialNodes.length === 0) return;

    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Find center node and position it at center
    const centerNode = centerNodeId ? initialNodes.find(n => n.id === centerNodeId) : null;
    
    const positioned = initialNodes.map((node, i) => {
      if (centerNode && node.id === centerNodeId) {
        return { ...node, x: centerX, y: centerY, vx: 0, vy: 0 };
      }
      
      // If we have a center node, position connected nodes closer
      if (centerNode && centerNode.connections?.includes(node.id)) {
        const connectedIndex = centerNode.connections.indexOf(node.id);
        const angle = (connectedIndex / (centerNode.connections.length || 1)) * 2 * Math.PI;
        const radius = 150;
        return {
          ...node,
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 30,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 30,
          vx: 0,
          vy: 0,
        };
      }
      
      const angle = (i / initialNodes.length) * 2 * Math.PI;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.38;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 80,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 80,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(positioned);
    iterationRef.current = 0;

    const simulate = () => {
      setNodes(prev => {
        if (iterationRef.current > 200) return prev;
        iterationRef.current++;

        const alpha = Math.max(0.005, 1 - iterationRef.current / 200);
        const newNodes = prev.map(node => ({ ...node }));

        // Center gravity (stronger for center node)
        newNodes.forEach(node => {
          const centerForce = node.id === centerNodeId ? 0.003 : 0.0008;
          node.vx! += (centerX - node.x!) * centerForce * alpha;
          node.vy! += (centerY - node.y!) * centerForce * alpha;
        });

        // Repulsion between all nodes
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x! - newNodes[i].x!;
            const dy = newNodes[j].y! - newNodes[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 80;
            const force = dist < minDist ? (200 * alpha) / (dist * dist) : (100 * alpha) / (dist * dist);
            
            newNodes[i].vx! -= (dx / dist) * force;
            newNodes[i].vy! -= (dy / dist) * force;
            newNodes[j].vx! += (dx / dist) * force;
            newNodes[j].vy! += (dy / dist) * force;
          }
        }

        // Attraction along edges
        newNodes.forEach(node => {
          node.connections?.forEach(targetId => {
            const target = newNodes.find(n => n.id === targetId);
            if (target) {
              const dx = target.x! - node.x!;
              const dy = target.y! - node.y!;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              const idealDist = node.id === centerNodeId || target.id === centerNodeId ? 150 : 120;
              const force = (dist - idealDist) * 0.015 * alpha;
              
              node.vx! += (dx / dist) * force;
              node.vy! += (dy / dist) * force;
            }
          });
        });

        // Apply velocities with damping
        newNodes.forEach(node => {
          // Don't move center node as much
          const damping = node.id === centerNodeId ? 0.6 : 0.85;
          node.vx! *= damping;
          node.vy! *= damping;
          node.x! += node.vx!;
          node.y! += node.vy!;
          
          const padding = 70;
          node.x! = Math.max(padding, Math.min(dimensions.width - padding, node.x!));
          node.y! = Math.max(padding, Math.min(dimensions.height - padding, node.y!));
        });

        return newNodes;
      });

      if (iterationRef.current < 200) {
        animationRef.current = requestAnimationFrame(simulate);
      }
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [initialNodes, dimensions, centerNodeId]);

  return nodes;
}

export function KnowledgeGraph({
  nodes = defaultNodes,
  onNodeClick,
  className,
  nodeFilters,
  centerNodeId,
  showConflictsOnly = false,
  showBottlenecksOnly = false,
  teamFilter,
  viewMode = "flow",
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const lastPan = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: Math.max(height, 500) });
      }
    };
    
    updateDimensions();
    const observer = new ResizeObserver(updateDimensions);
    if (containerRef.current) observer.observe(containerRef.current);
    
    return () => observer.disconnect();
  }, []);

  // Apply all filters
  const filteredNodes = useMemo(() => {
    let result = nodes;
    
    // Apply node type filters
    if (nodeFilters) {
      result = result.filter(n => nodeFilters[n.type] !== false);
    }
    
    // Apply team filter
    if (teamFilter && teamFilter !== "all") {
      const teamNode = nodes.find(n => n.id === teamFilter);
      if (teamNode) {
        const connectedToTeam = getConnectedNodes(teamFilter, nodes, 2);
        result = result.filter(n => connectedToTeam.has(n.id));
      }
    }
    
    // Apply center node filter - show only connected nodes
    if (centerNodeId) {
      const connectedNodes = getConnectedNodes(centerNodeId, nodes, 2);
      result = result.filter(n => connectedNodes.has(n.id));
    }
    
    // Apply special filters
    if (showConflictsOnly) {
      result = result.filter(n => n.metadata?.hasConflict || n.connections?.some(connId => {
        const connNode = nodes.find(cn => cn.id === connId);
        return connNode?.metadata?.hasConflict;
      }));
    }
    
    if (showBottlenecksOnly) {
      result = result.filter(n => 
        n.metadata?.isBottleneck || 
        (n.metadata?.loadScore && n.metadata.loadScore > 75)
      );
    }
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(n => 
        n.label.toLowerCase().includes(query) ||
        n.type.toLowerCase().includes(query) ||
        n.metadata?.role?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [nodes, nodeFilters, teamFilter, centerNodeId, showConflictsOnly, showBottlenecksOnly, searchQuery]);

  const positionedNodes = useForceLayout(filteredNodes, dimensions, centerNodeId);

  // Generate edges only between filtered nodes
  const edges = useMemo(() => {
    const result: { from: GraphNode; to: GraphNode; type: string }[] = [];
    const seen = new Set<string>();
    const nodeIds = new Set(positionedNodes.map(n => n.id));
    
    positionedNodes.forEach((node) => {
      node.connections?.forEach((targetId) => {
        if (!nodeIds.has(targetId)) return;
        const target = positionedNodes.find((n) => n.id === targetId);
        if (target) {
          const edgeId = [node.id, targetId].sort().join("-");
          if (!seen.has(edgeId)) {
            seen.add(edgeId);
            result.push({ from: node, to: target, type: "default" });
          }
        }
      });
    });
    
    return result;
  }, [positionedNodes]);

  const handleNodeClick = useCallback((node: GraphNode, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(node.id === selectedNode ? null : node.id);
    onNodeClick?.(node);
  }, [selectedNode, onNodeClick]);

  const isNodeHighlighted = useCallback((nodeId: string) => {
    if (!hoveredNode && !selectedNode) return true;
    const activeNode = hoveredNode || selectedNode;
    if (nodeId === activeNode) return true;
    if (nodeId === centerNodeId) return true;
    const node = positionedNodes.find((n) => n.id === activeNode);
    return node?.connections?.includes(nodeId) ?? false;
  }, [hoveredNode, selectedNode, positionedNodes, centerNodeId]);

  const isEdgeHighlighted = useCallback((edge: { from: GraphNode; to: GraphNode }) => {
    if (!hoveredNode && !selectedNode) return false;
    const activeNode = hoveredNode || selectedNode;
    return edge.from.id === activeNode || edge.to.id === activeNode;
  }, [hoveredNode, selectedNode]);

  const handleBackgroundClick = () => {
    setSelectedNode(null);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && e.target === e.currentTarget) {
      setIsDragging(true);
      lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - lastPan.current.x,
        y: e.clientY - lastPan.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoom(prev => Math.max(0.3, Math.min(2.5, prev + delta)));
  };

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    handleZoom(delta);
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeSize = (node: GraphNode) => {
    const baseSize = 24;
    const connectionBonus = Math.min((node.connections?.length || 0) * 1.5, 14);
    const centerBonus = node.id === centerNodeId ? 8 : 0;
    const bottleneckBonus = node.metadata?.isBottleneck ? 4 : 0;
    return baseSize + connectionBonus + centerBonus + bottleneckBonus;
  };

  const getNodeOpacity = (node: GraphNode) => {
    if (viewMode === "bottlenecks") {
      return node.metadata?.isBottleneck || (node.metadata?.loadScore && node.metadata.loadScore > 75) ? 1 : 0.3;
    }
    return 1;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[500px] rounded-xl bg-gradient-card border border-border overflow-hidden select-none",
        isDragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleBackgroundClick}
      onWheel={handleWheel}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 bg-gradient-glow opacity-20 pointer-events-none" />
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-10">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-muted-foreground" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Search bar */}
      <div className="absolute top-4 left-4 z-20 w-56">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 bg-background/90 backdrop-blur-sm border-border"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-sm" onClick={() => handleZoom(0.2)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-sm" onClick={() => handleZoom(-0.2)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8 bg-background/90 backdrop-blur-sm" onClick={resetView}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 z-10 bg-background/90 backdrop-blur-sm rounded-lg p-3 border border-border">
        {Object.entries(nodeColors).map(([type, { hue, label }]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full ring-2 ring-white/20"
              style={{ backgroundColor: `hsl(${hue})` }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10 bg-background/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-border">
        <span className="text-xs text-muted-foreground">
          {positionedNodes.length} nodes • {edges.length} connections
          {centerNodeId && ` • Focused on: ${nodes.find(n => n.id === centerNodeId)?.label}`}
        </span>
      </div>

      {/* SVG Graph */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.1s ease-out",
        }}
      >
        <defs>
          <filter id="node-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="node-shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
          </filter>
          <linearGradient id="edge-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {/* Edges */}
        <g>
          {edges.map((edge, i) => {
            const highlighted = isEdgeHighlighted(edge);
            const bothVisible = isNodeHighlighted(edge.from.id) && isNodeHighlighted(edge.to.id);
            
            return (
              <g key={i}>
                {highlighted && (
                  <line
                    x1={edge.from.x}
                    y1={edge.from.y}
                    x2={edge.to.x}
                    y2={edge.to.y}
                    stroke="hsl(var(--primary))"
                    strokeWidth={5}
                    strokeOpacity={0.25}
                    strokeLinecap="round"
                  />
                )}
                <line
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke={highlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth={highlighted ? 2.5 : 1.5}
                  strokeOpacity={bothVisible ? (highlighted ? 0.9 : 0.3) : 0.15}
                  strokeLinecap="round"
                  className="transition-all duration-300"
                />
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g>
          {positionedNodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const isCenter = node.id === centerNodeId;
            const highlighted = isNodeHighlighted(node.id);
            const { hue } = nodeColors[node.type];
            const size = getNodeSize(node);
            const Icon = nodeIcons[node.type];
            const opacity = getNodeOpacity(node);

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
                style={{
                  opacity: highlighted ? opacity : 0.2,
                  transition: "opacity 0.3s ease, transform 0.2s ease",
                }}
              >
                {/* Center node indicator */}
                {isCenter && (
                  <circle
                    r={size + 20}
                    fill="none"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    className="animate-spin"
                    style={{ animationDuration: "20s" }}
                  />
                )}

                {/* Selection/hover ring */}
                {(isSelected || isHovered) && (
                  <>
                    <circle
                      r={size + 14}
                      fill="none"
                      stroke={`hsl(${hue})`}
                      strokeWidth={2}
                      strokeOpacity={0.5}
                      strokeDasharray={isSelected ? "none" : "4 4"}
                      filter="url(#node-glow)"
                    />
                    <circle
                      r={size + 7}
                      fill={`hsl(${hue} / 0.15)`}
                    />
                  </>
                )}

                {/* Main node circle */}
                <circle
                  r={size}
                  fill={`hsl(${hue} / 0.25)`}
                  stroke={`hsl(${hue})`}
                  strokeWidth={isSelected ? 3 : 2}
                  filter="url(#node-shadow)"
                  className="transition-all duration-200"
                />

                {/* Inner circle */}
                <circle
                  r={size * 0.6}
                  fill={`hsl(${hue} / 0.7)`}
                />

                {/* Icon */}
                <foreignObject
                  x={-size * 0.4}
                  y={-size * 0.4}
                  width={size * 0.8}
                  height={size * 0.8}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-3/4 h-3/4 text-white drop-shadow-sm" strokeWidth={2.5} />
                  </div>
                </foreignObject>

                {/* Label background */}
                <rect
                  x={-node.label.length * 3.2 - 8}
                  y={size + 8}
                  width={node.label.length * 6.4 + 16}
                  height={20}
                  rx={6}
                  fill="hsl(var(--background) / 0.95)"
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  className="pointer-events-none"
                />

                {/* Label */}
                <text
                  y={size + 22}
                  textAnchor="middle"
                  className="text-[11px] font-medium fill-foreground pointer-events-none"
                >
                  {node.label}
                </text>

                {/* Status indicator */}
                {node.metadata?.status && (
                  <circle
                    cx={size * 0.7}
                    cy={-size * 0.7}
                    r={7}
                    fill={
                      node.metadata.status === "active"
                        ? "hsl(145 70% 45%)"
                        : node.metadata.status === "pending"
                        ? "hsl(45 90% 55%)"
                        : "hsl(var(--muted-foreground))"
                    }
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}

                {/* Conflict indicator */}
                {node.metadata?.hasConflict && (
                  <circle
                    cx={0}
                    cy={-size - 8}
                    r={8}
                    fill="hsl(0 80% 55%)"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}

                {/* Load score indicator for persons */}
                {node.type === "person" && node.metadata?.loadScore && node.metadata.loadScore > 75 && (
                  <g>
                    <circle
                      cx={-size * 0.7}
                      cy={-size * 0.7}
                      r={7}
                      fill={node.metadata.loadScore > 90 ? "hsl(0 80% 55%)" : "hsl(35 90% 55%)"}
                      stroke="hsl(var(--background))"
                      strokeWidth={2}
                    />
                    <text
                      x={-size * 0.7}
                      y={-size * 0.7 + 3}
                      textAnchor="middle"
                      className="text-[8px] font-bold fill-white pointer-events-none"
                    >
                      !
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Tooltip for hovered node */}
      {hoveredNode && !selectedNode && (
        <div 
          className="absolute z-30 pointer-events-none"
          style={{
            left: (positionedNodes.find(n => n.id === hoveredNode)?.x || 0) * zoom + pan.x + 60,
            top: (positionedNodes.find(n => n.id === hoveredNode)?.y || 0) * zoom + pan.y - 30,
          }}
        >
          {(() => {
            const node = positionedNodes.find((n) => n.id === hoveredNode);
            if (!node) return null;
            return (
              <div className="px-4 py-3 rounded-xl bg-popover/95 backdrop-blur-sm border border-border shadow-xl animate-in fade-in zoom-in-95 duration-150">
                <p className="text-sm font-semibold text-foreground">{node.label}</p>
                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                  {node.type}
                  {node.metadata?.role && ` • ${node.metadata.role}`}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span>{node.connections?.length || 0} connections</span>
                  {node.metadata?.loadScore && (
                    <span className={node.metadata.loadScore > 80 ? "text-destructive" : ""}>
                      {node.metadata.loadScore}% load
                    </span>
                  )}
                </div>
                {node.metadata?.hasConflict && (
                  <p className="text-xs text-destructive mt-1 font-medium">⚠ Has active conflict</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
