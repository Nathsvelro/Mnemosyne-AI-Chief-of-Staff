import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/database";
import { Search, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
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
  avatarUrl?: string;
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

// Color scheme matching Kumu.io style
const nodeColors: Record<EntityType, { bg: string; border: string; label: string }> = {
  person: { bg: "#3b82f6", border: "#60a5fa", label: "People" },       // Blue
  team: { bg: "#22c55e", border: "#4ade80", label: "Organizations" },  // Green
  decision: { bg: "#f59e0b", border: "#fbbf24", label: "Decisions" },  // Amber
  topic: { bg: "#8b5cf6", border: "#a78bfa", label: "Topics" },        // Purple
  document: { bg: "#06b6d4", border: "#22d3ee", label: "Documents" },  // Cyan
};

// Extended default nodes with realistic data
const defaultNodes: GraphNode[] = [
  // Executive Team (larger nodes as organizations)
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
  
  // Teams (larger organization nodes)
  { id: "team-exec", label: "Executive", type: "team", connections: ["ceo-1", "decision-strategy", "topic-growth"], metadata: { description: "Leadership Team" } },
  { id: "team-eng", label: "Engineering", type: "team", connections: ["vp-eng", "eng-lead-1", "eng-lead-2", "eng-3", "eng-5", "topic-ai", "topic-infra"], metadata: { description: "Core product development" } },
  { id: "team-prod", label: "Product", type: "team", connections: ["vp-prod", "pm-1", "pm-2", "team-eng", "team-design", "topic-launch"], metadata: { description: "Product strategy and roadmap" } },
  { id: "team-design", label: "Design", type: "team", connections: ["vp-design", "designer-1", "designer-2", "team-prod", "topic-onboarding"], metadata: { description: "UX and visual design" } },
  { id: "team-mktg", label: "Marketing", type: "team", connections: ["vp-mktg", "mktg-1", "mktg-2", "topic-launch", "topic-growth"], metadata: { description: "Growth and brand" } },
  { id: "team-sales", label: "Sales", type: "team", connections: ["vp-sales", "sales-1", "sales-2", "topic-enterprise", "decision-pricing"], metadata: { description: "Revenue and partnerships" } },
  { id: "team-platform", label: "Platform", type: "team", connections: ["eng-4", "topic-infra", "decision-security"], metadata: { description: "Infrastructure and DevOps" } },
  
  // Key Decisions (amber/yellow nodes)
  { id: "decision-nextjs", label: "Adopt Next.js", type: "decision", connections: ["vp-eng", "eng-lead-1", "team-eng", "topic-launch"], metadata: { status: "active", confidence: 0.92 } },
  { id: "decision-launch", label: "Launch March 15", type: "decision", connections: ["vp-prod", "vp-mktg", "pm-1", "topic-launch", "decision-pricing"], metadata: { status: "pending", confidence: 0.75, hasConflict: true } },
  { id: "decision-api", label: "Deprecate API v1", type: "decision", connections: ["vp-eng", "eng-lead-2", "doc-api", "topic-enterprise"], metadata: { status: "active", confidence: 0.95 } },
  { id: "decision-pricing", label: "4-Tier Pricing", type: "decision", connections: ["vp-sales", "vp-prod", "pm-2", "sales-1", "decision-launch", "topic-enterprise"], metadata: { status: "pending", confidence: 0.65, hasConflict: true } },
  { id: "decision-strategy", label: "2025 Strategy", type: "decision", connections: ["ceo-1", "team-exec", "topic-ai", "topic-growth"], metadata: { status: "active", confidence: 0.88 } },
  { id: "decision-ai-model", label: "Use GPT-4", type: "decision", connections: ["vp-eng", "topic-ai", "eng-3"], metadata: { status: "active", confidence: 0.88 } },
  { id: "decision-security", label: "SOC2 Compliance", type: "decision", connections: ["eng-4", "topic-enterprise", "doc-security", "team-platform"], metadata: { status: "pending", confidence: 0.82 } },
  
  // Topics (purple nodes)
  { id: "topic-launch", label: "Q1 Launch", type: "topic", connections: ["decision-launch", "decision-nextjs", "team-mktg", "team-prod", "mktg-1"], metadata: { description: "Product launch for Q1 2025" } },
  { id: "topic-ai", label: "AI Strategy", type: "topic", connections: ["vp-eng", "eng-3", "decision-ai-model", "decision-strategy", "team-eng"], metadata: { description: "AI/ML integration strategy" } },
  { id: "topic-enterprise", label: "Enterprise", type: "topic", connections: ["vp-sales", "pm-2", "sales-1", "sales-2", "decision-pricing", "decision-api", "decision-security"], metadata: { description: "Enterprise sales & features" } },
  { id: "topic-onboarding", label: "User Onboarding", type: "topic", connections: ["vp-design", "pm-1", "designer-1", "designer-2", "team-design"], metadata: { description: "Improving user onboarding" } },
  { id: "topic-infra", label: "Infrastructure", type: "topic", connections: ["eng-lead-2", "eng-4", "team-platform"], metadata: { description: "Platform & scalability" } },
  { id: "topic-growth", label: "Growth", type: "topic", connections: ["team-mktg", "team-sales", "vp-mktg", "mktg-2", "decision-strategy"], metadata: { description: "User acquisition & retention" } },
  
  // Documents (cyan nodes)
  { id: "doc-launch", label: "Q1 Launch Plan", type: "document", connections: ["vp-prod", "topic-launch", "decision-launch"], metadata: { status: "active" } },
  { id: "doc-api", label: "API Migration Guide", type: "document", connections: ["eng-lead-1", "decision-api", "topic-enterprise"], metadata: { status: "pending" } },
  { id: "doc-security", label: "Security Requirements", type: "document", connections: ["eng-4", "decision-security", "topic-enterprise"], metadata: { status: "active" } },
];

// Get all connected node IDs recursively
function getConnectedNodes(nodeId: string, allNodes: GraphNode[], depth: number = 2): Set<string> {
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

// Force-directed layout
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
    
    const centerNode = centerNodeId ? initialNodes.find(n => n.id === centerNodeId) : null;
    
    const positioned = initialNodes.map((node, i) => {
      if (centerNode && node.id === centerNodeId) {
        return { ...node, x: centerX, y: centerY, vx: 0, vy: 0 };
      }
      
      if (centerNode && centerNode.connections?.includes(node.id)) {
        const connectedIndex = centerNode.connections.indexOf(node.id);
        const angle = (connectedIndex / (centerNode.connections.length || 1)) * 2 * Math.PI;
        const radius = 180;
        return {
          ...node,
          x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 40,
          y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 40,
          vx: 0,
          vy: 0,
        };
      }
      
      const angle = (i / initialNodes.length) * 2 * Math.PI;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.35;
      return {
        ...node,
        x: centerX + Math.cos(angle) * radius + (Math.random() - 0.5) * 100,
        y: centerY + Math.sin(angle) * radius + (Math.random() - 0.5) * 100,
        vx: 0,
        vy: 0,
      };
    });

    setNodes(positioned);
    iterationRef.current = 0;

    const simulate = () => {
      setNodes(prev => {
        if (iterationRef.current > 250) return prev;
        iterationRef.current++;

        const alpha = Math.max(0.001, 1 - iterationRef.current / 250);
        const newNodes = prev.map(node => ({ ...node }));

        // Center gravity
        newNodes.forEach(node => {
          const centerForce = node.id === centerNodeId ? 0.002 : 0.0005;
          node.vx! += (centerX - node.x!) * centerForce * alpha;
          node.vy! += (centerY - node.y!) * centerForce * alpha;
        });

        // Repulsion
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x! - newNodes[i].x!;
            const dy = newNodes[j].y! - newNodes[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const minDist = 100;
            const force = dist < minDist ? (300 * alpha) / (dist * dist) : (150 * alpha) / (dist * dist);
            
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
              const idealDist = node.id === centerNodeId || target.id === centerNodeId ? 180 : 140;
              const force = (dist - idealDist) * 0.012 * alpha;
              
              node.vx! += (dx / dist) * force;
              node.vy! += (dy / dist) * force;
            }
          });
        });

        // Apply velocities
        newNodes.forEach(node => {
          const damping = node.id === centerNodeId ? 0.5 : 0.8;
          node.vx! *= damping;
          node.vy! *= damping;
          node.x! += node.vx!;
          node.y! += node.vy!;
          
          const padding = 80;
          node.x! = Math.max(padding, Math.min(dimensions.width - padding, node.x!));
          node.y! = Math.max(padding, Math.min(dimensions.height - padding, node.y!));
        });

        return newNodes;
      });

      if (iterationRef.current < 250) {
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

// Generate curved path between two points
function getCurvedPath(x1: number, y1: number, x2: number, y2: number): string {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  
  // Curve intensity based on distance
  const curveIntensity = Math.min(dist * 0.15, 40);
  
  // Perpendicular offset for curve
  const perpX = -dy / dist * curveIntensity;
  const perpY = dx / dist * curveIntensity;
  
  const ctrlX = midX + perpX;
  const ctrlY = midY + perpY;
  
  return `M ${x1} ${y1} Q ${ctrlX} ${ctrlY} ${x2} ${y2}`;
}

// Get initials from name
function getInitials(name: string): string {
  return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
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

  // Apply filters
  const filteredNodes = useMemo(() => {
    let result = nodes;
    
    if (nodeFilters) {
      result = result.filter(node => nodeFilters[node.type] !== false);
    }
    
    if (showConflictsOnly) {
      const conflictNodeIds = new Set<string>();
      result.forEach(node => {
        if (node.metadata?.hasConflict) {
          conflictNodeIds.add(node.id);
          node.connections?.forEach(id => conflictNodeIds.add(id));
        }
      });
      result = result.filter(node => conflictNodeIds.has(node.id));
    }
    
    if (showBottlenecksOnly) {
      const bottleneckNodeIds = new Set<string>();
      result.forEach(node => {
        if (node.metadata?.isBottleneck || (node.metadata?.loadScore && node.metadata.loadScore > 80)) {
          bottleneckNodeIds.add(node.id);
          node.connections?.forEach(id => bottleneckNodeIds.add(id));
        }
      });
      result = result.filter(node => bottleneckNodeIds.has(node.id));
    }
    
    if (teamFilter && teamFilter !== "all") {
      const teamNodeIds = new Set<string>();
      result.forEach(node => {
        if (node.id === teamFilter || node.teamId === teamFilter) {
          teamNodeIds.add(node.id);
          node.connections?.forEach(id => teamNodeIds.add(id));
        }
      });
      result = result.filter(node => teamNodeIds.has(node.id));
    }
    
    if (centerNodeId) {
      const connectedIds = getConnectedNodes(centerNodeId, result, 2);
      result = result.filter(node => connectedIds.has(node.id));
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(node => 
        node.label.toLowerCase().includes(query) ||
        node.metadata?.role?.toLowerCase().includes(query)
      );
    }
    
    return result;
  }, [nodes, nodeFilters, showConflictsOnly, showBottlenecksOnly, teamFilter, centerNodeId, searchQuery]);

  const layoutNodes = useForceLayout(filteredNodes, dimensions, centerNodeId);

  // Generate edges
  const edges = useMemo(() => {
    const edgeSet = new Set<string>();
    const result: { from: GraphNode; to: GraphNode; key: string }[] = [];
    
    layoutNodes.forEach(node => {
      node.connections?.forEach(targetId => {
        const target = layoutNodes.find(n => n.id === targetId);
        if (target) {
          const key = [node.id, target.id].sort().join("-");
          if (!edgeSet.has(key)) {
            edgeSet.add(key);
            result.push({ from: node, to: target, key });
          }
        }
      });
    });
    
    return result;
  }, [layoutNodes]);

  // Zoom handlers
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.min(Math.max(prev * delta, 0.3), 3));
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).tagName === 'svg') {
      setIsDragging(true);
      lastPan.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
    }
  }, [pan]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPan({
        x: e.clientX - lastPan.current.x,
        y: e.clientY - lastPan.current.y,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node.id);
    onNodeClick?.(node);
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Get node size based on type and connections
  const getNodeSize = (node: GraphNode) => {
    const baseSize = node.type === 'team' ? 50 : node.type === 'person' ? 36 : 32;
    const connectionBonus = Math.min((node.connections?.length || 0) * 2, 12);
    return baseSize + connectionBonus;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full overflow-hidden bg-[#1a1a2e] cursor-grab active:cursor-grabbing",
        isDragging && "cursor-grabbing",
        className
      )}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Search Bar */}
      <div className="absolute top-4 left-4 z-20 w-64">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="pl-10 bg-[#252540] border-[#3a3a5c] text-white placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#252540] border-[#3a3a5c] hover:bg-[#3a3a5c]"
          onClick={() => setZoom(z => Math.min(z * 1.2, 3))}
        >
          <ZoomIn className="w-4 h-4 text-gray-300" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#252540] border-[#3a3a5c] hover:bg-[#3a3a5c]"
          onClick={() => setZoom(z => Math.max(z * 0.8, 0.3))}
        >
          <ZoomOut className="w-4 h-4 text-gray-300" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-[#252540] border-[#3a3a5c] hover:bg-[#3a3a5c]"
          onClick={resetView}
        >
          <Maximize2 className="w-4 h-4 text-gray-300" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-20 bg-[#252540]/90 backdrop-blur-sm rounded-lg p-3 border border-[#3a3a5c]">
        <div className="text-xs text-gray-400 mb-2 font-medium">Interlocks</div>
        <div className="space-y-1.5">
          {Object.entries(nodeColors).map(([type, colors]) => (
            <div key={type} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: colors.bg }}
              />
              <span className="text-xs text-gray-300">{colors.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Badge */}
      <div className="absolute bottom-4 right-4 z-20 bg-[#252540]/90 backdrop-blur-sm rounded-lg px-3 py-2 border border-[#3a3a5c]">
        <span className="text-xs text-gray-400">
          {layoutNodes.length} nodes • {edges.length} connections
        </span>
      </div>

      {/* SVG Canvas */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
        }}
      >
        <defs>
          {/* Glow filter for highlighted nodes */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Drop shadow for nodes */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3"/>
          </filter>
        </defs>

        {/* Edges */}
        <g className="edges">
          {edges.map(({ from, to, key }) => {
            if (!from.x || !from.y || !to.x || !to.y) return null;
            
            const isHighlighted = hoveredNode === from.id || hoveredNode === to.id ||
                                  selectedNode === from.id || selectedNode === to.id;
            
            return (
              <path
                key={key}
                d={getCurvedPath(from.x, from.y, to.x, to.y)}
                fill="none"
                stroke={isHighlighted ? "#60a5fa" : "#3a3a5c"}
                strokeWidth={isHighlighted ? 2 : 1}
                strokeOpacity={isHighlighted ? 0.8 : 0.4}
                className="transition-all duration-200"
              />
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {layoutNodes.map(node => {
            if (!node.x || !node.y) return null;
            
            const size = getNodeSize(node);
            const colors = nodeColors[node.type];
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const isCenter = centerNodeId === node.id;
            const isPerson = node.type === 'person';
            
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
                style={{ filter: isSelected || isHovered ? 'url(#glow)' : 'url(#shadow)' }}
              >
                {/* Outer ring for selected/hovered */}
                {(isSelected || isHovered || isCenter) && (
                  <circle
                    r={size / 2 + 4}
                    fill="none"
                    stroke={isCenter ? "#22c55e" : colors.border}
                    strokeWidth={2}
                    strokeOpacity={0.6}
                    className="animate-pulse"
                  />
                )}
                
                {/* Main circle */}
                <circle
                  r={size / 2}
                  fill={colors.bg}
                  stroke={colors.border}
                  strokeWidth={2}
                  className="transition-all duration-200"
                />
                
                {/* Inner content */}
                {isPerson ? (
                  // Person avatar with initials
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill="white"
                    fontSize={size * 0.35}
                    fontWeight="600"
                    className="pointer-events-none select-none"
                  >
                    {getInitials(node.label)}
                  </text>
                ) : (
                  // Icon or short label for other types
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fill="white"
                    fontSize={size * 0.28}
                    fontWeight="600"
                    className="pointer-events-none select-none"
                  >
                    {node.label.substring(0, 3).toUpperCase()}
                  </text>
                )}
                
                {/* Load score indicator for high-load people */}
                {node.metadata?.loadScore && node.metadata.loadScore > 80 && (
                  <circle
                    cx={size / 2 - 4}
                    cy={-size / 2 + 4}
                    r={6}
                    fill="#ef4444"
                    stroke="#1a1a2e"
                    strokeWidth={2}
                  />
                )}
                
                {/* Conflict indicator */}
                {node.metadata?.hasConflict && (
                  <circle
                    cx={-size / 2 + 4}
                    cy={-size / 2 + 4}
                    r={6}
                    fill="#f59e0b"
                    stroke="#1a1a2e"
                    strokeWidth={2}
                  />
                )}
                
                {/* Label */}
                <text
                  y={size / 2 + 14}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                  fontWeight="500"
                  className="pointer-events-none select-none"
                >
                  {node.label.length > 18 ? node.label.substring(0, 16) + '...' : node.label}
                </text>
                
                {/* Role subtitle for people */}
                {isPerson && node.metadata?.role && (
                  <text
                    y={size / 2 + 26}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    className="pointer-events-none select-none"
                  >
                    {node.metadata.role}
                  </text>
                )}
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}