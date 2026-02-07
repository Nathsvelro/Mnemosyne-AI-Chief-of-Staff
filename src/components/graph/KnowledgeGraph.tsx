import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import type { EntityType } from "@/types/database";
import { Users, Briefcase, Target, FileText, FileCode, ZoomIn, ZoomOut, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface GraphNode {
  id: string;
  label: string;
  type: EntityType;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  connections?: string[];
  metadata?: {
    role?: string;
    status?: "active" | "pending" | "resolved";
    updatedAt?: string;
    loadScore?: number;
    confidence?: number;
    description?: string;
  };
}

interface KnowledgeGraphProps {
  nodes?: GraphNode[];
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
  nodeFilters?: Record<EntityType, boolean>;
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

// Extended default nodes with more data
const defaultNodes: GraphNode[] = [
  // Executive Team
  { id: "ceo-1", label: "Nathaniel Velazquez", type: "person", connections: ["team-exec", "vp-eng", "vp-prod", "vp-sales", "decision-strategy"], metadata: { role: "CEO", loadScore: 95 } },
  
  // VPs and Directors
  { id: "vp-eng", label: "Sarah Chen", type: "person", connections: ["ceo-1", "team-eng", "decision-nextjs", "decision-api", "topic-ai", "eng-lead-1", "eng-lead-2"], metadata: { role: "VP Engineering", loadScore: 85 } },
  { id: "vp-prod", label: "Marcus Johnson", type: "person", connections: ["ceo-1", "team-prod", "decision-launch", "decision-pricing", "topic-launch", "pm-1", "pm-2"], metadata: { role: "Head of Product", loadScore: 72 } },
  { id: "vp-sales", label: "Lisa Thompson", type: "person", connections: ["ceo-1", "team-sales", "decision-pricing", "topic-enterprise", "sales-1"], metadata: { role: "VP Sales", loadScore: 68 } },
  { id: "vp-design", label: "Emily Rodriguez", type: "person", connections: ["team-design", "vp-prod", "topic-onboarding", "designer-1"], metadata: { role: "Design Director", loadScore: 45 } },
  { id: "vp-mktg", label: "David Kim", type: "person", connections: ["team-mktg", "decision-launch", "topic-launch", "mktg-1"], metadata: { role: "CMO", loadScore: 92 } },
  
  // Engineering Team Members
  { id: "eng-lead-1", label: "James Wilson", type: "person", connections: ["vp-eng", "team-eng", "decision-nextjs", "doc-api"], metadata: { role: "Senior Engineer", loadScore: 55 } },
  { id: "eng-lead-2", label: "Priya Patel", type: "person", connections: ["vp-eng", "team-eng", "topic-infra", "decision-api"], metadata: { role: "Staff Engineer", loadScore: 78 } },
  { id: "eng-3", label: "Alex Turner", type: "person", connections: ["eng-lead-1", "team-eng", "topic-ai"], metadata: { role: "ML Engineer", loadScore: 62 } },
  { id: "eng-4", label: "Jordan Lee", type: "person", connections: ["eng-lead-2", "team-eng", "topic-infra"], metadata: { role: "DevOps Lead", loadScore: 70 } },
  
  // Product Team Members
  { id: "pm-1", label: "Ana Martinez", type: "person", connections: ["vp-prod", "team-prod", "topic-onboarding", "decision-launch"], metadata: { role: "Product Manager", loadScore: 78 } },
  { id: "pm-2", label: "Chris Park", type: "person", connections: ["vp-prod", "team-prod", "topic-enterprise"], metadata: { role: "Senior PM", loadScore: 65 } },
  
  // Other Team Members
  { id: "designer-1", label: "Sofia Nguyen", type: "person", connections: ["vp-design", "team-design", "topic-onboarding"], metadata: { role: "Lead Designer", loadScore: 50 } },
  { id: "sales-1", label: "Michael Brown", type: "person", connections: ["vp-sales", "team-sales", "topic-enterprise"], metadata: { role: "Enterprise AE", loadScore: 75 } },
  { id: "mktg-1", label: "Rachel Green", type: "person", connections: ["vp-mktg", "team-mktg", "topic-launch"], metadata: { role: "Content Lead", loadScore: 58 } },
  
  // Teams
  { id: "team-exec", label: "Executive", type: "team", connections: ["ceo-1", "decision-strategy"], metadata: { description: "Leadership Team" } },
  { id: "team-eng", label: "Engineering", type: "team", connections: ["vp-eng", "eng-lead-1", "eng-lead-2", "eng-3", "eng-4", "topic-ai", "topic-infra"], metadata: { description: "Core product development" } },
  { id: "team-prod", label: "Product", type: "team", connections: ["vp-prod", "pm-1", "pm-2", "team-eng", "team-design"], metadata: { description: "Product strategy and roadmap" } },
  { id: "team-design", label: "Design", type: "team", connections: ["vp-design", "designer-1", "team-prod"], metadata: { description: "UX and visual design" } },
  { id: "team-mktg", label: "Marketing", type: "team", connections: ["vp-mktg", "mktg-1", "topic-launch"], metadata: { description: "Growth and brand" } },
  { id: "team-sales", label: "Sales", type: "team", connections: ["vp-sales", "sales-1", "topic-enterprise"], metadata: { description: "Revenue and partnerships" } },
  { id: "team-platform", label: "Platform", type: "team", connections: ["eng-lead-2", "eng-4", "topic-infra"], metadata: { description: "Infrastructure and DevOps" } },
  
  // Key Decisions
  { id: "decision-nextjs", label: "Adopt Next.js", type: "decision", connections: ["vp-eng", "eng-lead-1", "team-eng", "topic-launch"], metadata: { status: "active", confidence: 0.92 } },
  { id: "decision-launch", label: "Launch March 15", type: "decision", connections: ["vp-prod", "vp-mktg", "pm-1", "topic-launch", "decision-pricing"], metadata: { status: "pending", confidence: 0.75 } },
  { id: "decision-api", label: "Deprecate API v1", type: "decision", connections: ["vp-eng", "eng-lead-2", "doc-api", "topic-enterprise"], metadata: { status: "active", confidence: 0.95 } },
  { id: "decision-pricing", label: "4-Tier Pricing", type: "decision", connections: ["vp-sales", "vp-prod", "decision-launch", "topic-enterprise"], metadata: { status: "pending", confidence: 0.65 } },
  { id: "decision-strategy", label: "2025 Strategy", type: "decision", connections: ["ceo-1", "team-exec", "topic-ai"], metadata: { status: "active", confidence: 0.88 } },
  { id: "decision-ai-model", label: "Use GPT-4", type: "decision", connections: ["vp-eng", "topic-ai", "eng-3"], metadata: { status: "active", confidence: 0.88 } },
  { id: "decision-security", label: "SOC2 Compliance", type: "decision", connections: ["eng-4", "topic-enterprise", "doc-security"], metadata: { status: "pending", confidence: 0.82 } },
  
  // Topics
  { id: "topic-launch", label: "Q1 Launch", type: "topic", connections: ["decision-launch", "decision-nextjs", "team-mktg", "mktg-1"], metadata: { description: "Product launch for Q1 2025" } },
  { id: "topic-ai", label: "AI Strategy", type: "topic", connections: ["vp-eng", "eng-3", "decision-ai-model", "decision-strategy", "team-eng"], metadata: { description: "AI/ML integration strategy" } },
  { id: "topic-enterprise", label: "Enterprise", type: "topic", connections: ["vp-sales", "pm-2", "sales-1", "decision-pricing", "decision-api", "decision-security"], metadata: { description: "Enterprise sales & features" } },
  { id: "topic-onboarding", label: "User Onboarding", type: "topic", connections: ["vp-design", "pm-1", "designer-1"], metadata: { description: "Improving user onboarding" } },
  { id: "topic-infra", label: "Infrastructure", type: "topic", connections: ["eng-lead-2", "eng-4", "team-platform"], metadata: { description: "Platform & scalability" } },
  { id: "topic-growth", label: "Growth", type: "topic", connections: ["team-mktg", "team-sales", "vp-mktg"], metadata: { description: "User acquisition & retention" } },
  
  // Documents
  { id: "doc-launch", label: "Q1 Launch Plan", type: "document", connections: ["vp-prod", "topic-launch"], metadata: { status: "active" } },
  { id: "doc-api", label: "API Migration Guide", type: "document", connections: ["eng-lead-1", "decision-api"], metadata: { status: "pending" } },
  { id: "doc-security", label: "Security Requirements", type: "document", connections: ["eng-4", "decision-security", "topic-enterprise"], metadata: { status: "active" } },
  { id: "doc-pricing", label: "Pricing Analysis", type: "document", connections: ["vp-sales", "decision-pricing"], metadata: { status: "pending" } },
  { id: "doc-ai-eval", label: "AI Model Evaluation", type: "document", connections: ["eng-3", "decision-ai-model", "topic-ai"], metadata: { status: "resolved" } },
];

// Force-directed layout simulation
function useForceLayout(
  initialNodes: GraphNode[],
  dimensions: { width: number; height: number },
  nodeFilters?: Record<EntityType, boolean>
) {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const animationRef = useRef<number>();
  const iterationRef = useRef(0);

  const filteredNodes = useMemo(() => {
    if (!nodeFilters) return initialNodes;
    return initialNodes.filter(n => nodeFilters[n.type] !== false);
  }, [initialNodes, nodeFilters]);

  useEffect(() => {
    if (dimensions.width === 0 || dimensions.height === 0) return;

    // Initialize positions
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    const positioned = filteredNodes.map((node, i) => {
      const angle = (i / filteredNodes.length) * 2 * Math.PI;
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
        if (iterationRef.current > 150) return prev;
        iterationRef.current++;

        const alpha = Math.max(0.01, 1 - iterationRef.current / 150);
        const newNodes = prev.map(node => ({ ...node }));

        // Center gravity
        newNodes.forEach(node => {
          node.vx! += (centerX - node.x!) * 0.001 * alpha;
          node.vy! += (centerY - node.y!) * 0.001 * alpha;
        });

        // Repulsion between all nodes
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const dx = newNodes[j].x! - newNodes[i].x!;
            const dy = newNodes[j].y! - newNodes[i].y!;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const force = (150 * alpha) / dist;
            
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
              const force = (dist - 120) * 0.01 * alpha;
              
              node.vx! += (dx / dist) * force;
              node.vy! += (dy / dist) * force;
            }
          });
        });

        // Apply velocities with damping
        newNodes.forEach(node => {
          node.vx! *= 0.8;
          node.vy! *= 0.8;
          node.x! += node.vx!;
          node.y! += node.vy!;
          
          // Keep in bounds with padding
          const padding = 60;
          node.x! = Math.max(padding, Math.min(dimensions.width - padding, node.x!));
          node.y! = Math.max(padding, Math.min(dimensions.height - padding, node.y!));
        });

        return newNodes;
      });

      if (iterationRef.current < 150) {
        animationRef.current = requestAnimationFrame(simulate);
      }
    };

    animationRef.current = requestAnimationFrame(simulate);

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [filteredNodes, dimensions]);

  return nodes;
}

export function KnowledgeGraph({
  nodes = defaultNodes,
  onNodeClick,
  className,
  nodeFilters,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
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

  const positionedNodes = useForceLayout(nodes, dimensions, nodeFilters);

  // Generate edges
  const edges = useMemo(() => {
    const result: { from: GraphNode; to: GraphNode; type: string }[] = [];
    const seen = new Set<string>();
    
    positionedNodes.forEach((node) => {
      node.connections?.forEach((targetId) => {
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
    const node = positionedNodes.find((n) => n.id === activeNode);
    return node?.connections?.includes(nodeId) ?? false;
  }, [hoveredNode, selectedNode, positionedNodes]);

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
    setZoom(prev => Math.max(0.5, Math.min(2, prev + delta)));
  };

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  const getNodeSize = (node: GraphNode) => {
    const baseSize = 28;
    const connectionBonus = Math.min((node.connections?.length || 0) * 2, 16);
    return baseSize + connectionBonus;
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
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-30 pointer-events-none" />

      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-20">
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleZoom(0.2)}>
          <ZoomIn className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={() => handleZoom(-0.2)}>
          <ZoomOut className="w-4 h-4" />
        </Button>
        <Button variant="secondary" size="icon" className="h-8 w-8" onClick={resetView}>
          <Maximize2 className="w-4 h-4" />
        </Button>
      </div>

      {/* Legend */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-3 z-10 bg-background/80 backdrop-blur-sm rounded-lg p-3">
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
      <div className="absolute bottom-4 left-4 z-10 bg-background/80 backdrop-blur-sm rounded-lg px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {positionedNodes.length} nodes • {edges.length} connections
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
                    strokeWidth={4}
                    strokeOpacity={0.3}
                  />
                )}
                <line
                  x1={edge.from.x}
                  y1={edge.from.y}
                  x2={edge.to.x}
                  y2={edge.to.y}
                  stroke={highlighted ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                  strokeWidth={highlighted ? 2 : 1}
                  strokeOpacity={bothVisible ? (highlighted ? 0.8 : 0.25) : 0.1}
                  className="transition-all duration-200"
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
            const highlighted = isNodeHighlighted(node.id);
            const { hue } = nodeColors[node.type];
            const size = getNodeSize(node);
            const Icon = nodeIcons[node.type];

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => handleNodeClick(node, e)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
                style={{
                  opacity: highlighted ? 1 : 0.25,
                  transition: "opacity 0.2s ease",
                }}
              >
                {/* Selection/hover ring */}
                {(isSelected || isHovered) && (
                  <>
                    <circle
                      r={size + 12}
                      fill="none"
                      stroke={`hsl(${hue})`}
                      strokeWidth={2}
                      strokeOpacity={0.4}
                      strokeDasharray={isSelected ? "none" : "4 4"}
                      filter="url(#node-glow)"
                    />
                    <circle
                      r={size + 6}
                      fill={`hsl(${hue} / 0.15)`}
                    />
                  </>
                )}

                {/* Main node circle */}
                <circle
                  r={size}
                  fill={`hsl(${hue} / 0.2)`}
                  stroke={`hsl(${hue})`}
                  strokeWidth={isSelected ? 3 : 2}
                  filter="url(#node-shadow)"
                  className="transition-all duration-150"
                />

                {/* Inner circle */}
                <circle
                  r={size * 0.55}
                  fill={`hsl(${hue} / 0.6)`}
                />

                {/* Icon */}
                <foreignObject
                  x={-size * 0.35}
                  y={-size * 0.35}
                  width={size * 0.7}
                  height={size * 0.7}
                  className="pointer-events-none"
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <Icon className="w-3/4 h-3/4 text-white" strokeWidth={2.5} />
                  </div>
                </foreignObject>

                {/* Label background */}
                <rect
                  x={-node.label.length * 3.5 - 6}
                  y={size + 8}
                  width={node.label.length * 7 + 12}
                  height={18}
                  rx={4}
                  fill="hsl(var(--background) / 0.9)"
                  stroke="hsl(var(--border))"
                  strokeWidth={1}
                  className="pointer-events-none"
                />

                {/* Label */}
                <text
                  y={size + 21}
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
                    r={6}
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

                {/* Load score indicator for persons */}
                {node.type === "person" && node.metadata?.loadScore && node.metadata.loadScore > 80 && (
                  <circle
                    cx={-size * 0.7}
                    cy={-size * 0.7}
                    r={6}
                    fill="hsl(0 80% 55%)"
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
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
            left: (positionedNodes.find(n => n.id === hoveredNode)?.x || 0) * zoom + pan.x + 50,
            top: (positionedNodes.find(n => n.id === hoveredNode)?.y || 0) * zoom + pan.y - 20,
          }}
        >
          {(() => {
            const node = positionedNodes.find((n) => n.id === hoveredNode);
            if (!node) return null;
            return (
              <div className="px-3 py-2 rounded-lg bg-popover border border-border shadow-lg animate-in fade-in zoom-in-95 duration-150">
                <p className="text-sm font-semibold text-foreground">{node.label}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {node.type}
                  {node.metadata?.role && ` • ${node.metadata.role}`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {node.connections?.length || 0} connections
                </p>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}
