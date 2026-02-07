import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

export interface GraphNode {
  id: string;
  label: string;
  type: "person" | "team" | "decision" | "topic" | "dependency";
  x?: number;
  y?: number;
  connections?: string[];
  metadata?: {
    role?: string;
    status?: "active" | "pending" | "resolved";
    updatedAt?: string;
  };
}

interface KnowledgeGraphProps {
  nodes?: GraphNode[];
  onNodeClick?: (node: GraphNode) => void;
  className?: string;
}

const defaultNodes: GraphNode[] = [
  { id: "1", label: "Sarah Chen", type: "person", connections: ["2", "4", "6"], metadata: { role: "CEO" } },
  { id: "2", label: "Product Team", type: "team", connections: ["1", "3", "5"] },
  { id: "3", label: "Q2 Roadmap", type: "decision", connections: ["2", "4"], metadata: { status: "active" } },
  { id: "4", label: "AI Strategy", type: "topic", connections: ["1", "3", "5", "6"] },
  { id: "5", label: "Engineering", type: "team", connections: ["2", "4", "7"] },
  { id: "6", label: "Marcus Johnson", type: "person", connections: ["1", "4"], metadata: { role: "CTO" } },
  { id: "7", label: "Tech Debt", type: "dependency", connections: ["5"], metadata: { status: "pending" } },
  { id: "8", label: "Budget Approval", type: "decision", connections: ["1", "3"], metadata: { status: "resolved" } },
];

const nodeColors: Record<GraphNode["type"], string> = {
  person: "var(--node-person)",
  team: "var(--node-team)",
  decision: "var(--node-decision)",
  topic: "var(--node-topic)",
  dependency: "var(--node-dependency)",
};

const nodeLabels: Record<GraphNode["type"], string> = {
  person: "Person",
  team: "Team",
  decision: "Decision",
  topic: "Topic",
  dependency: "Dependency",
};

export function KnowledgeGraph({
  nodes = defaultNodes,
  onNodeClick,
  className,
}: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 });
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      const { width, height } = containerRef.current.getBoundingClientRect();
      setDimensions({ width, height: Math.max(height, 400) });
    }
  }, []);

  // Calculate node positions in a force-directed-like layout
  const positionedNodes = nodes.map((node, index) => {
    const angle = (index / nodes.length) * 2 * Math.PI;
    const radiusX = dimensions.width * 0.35;
    const radiusY = dimensions.height * 0.35;
    const centerX = dimensions.width / 2;
    const centerY = dimensions.height / 2;
    
    // Add some variation based on node type
    const typeOffset = Object.keys(nodeColors).indexOf(node.type) * 0.1;
    
    return {
      ...node,
      x: node.x ?? centerX + Math.cos(angle + typeOffset) * radiusX * (0.8 + Math.random() * 0.4),
      y: node.y ?? centerY + Math.sin(angle + typeOffset) * radiusY * (0.8 + Math.random() * 0.4),
    };
  });

  // Generate edges
  const edges: { from: GraphNode; to: GraphNode }[] = [];
  positionedNodes.forEach((node) => {
    node.connections?.forEach((targetId) => {
      const target = positionedNodes.find((n) => n.id === targetId);
      if (target && node.id < targetId) {
        edges.push({ from: node, to: target });
      }
    });
  });

  const handleNodeClick = (node: GraphNode) => {
    setSelectedNode(node.id === selectedNode ? null : node.id);
    onNodeClick?.(node);
  };

  const isNodeHighlighted = (nodeId: string) => {
    if (!hoveredNode && !selectedNode) return true;
    const activeNode = hoveredNode || selectedNode;
    if (nodeId === activeNode) return true;
    const node = positionedNodes.find((n) => n.id === activeNode);
    return node?.connections?.includes(nodeId) ?? false;
  };

  const isEdgeHighlighted = (edge: { from: GraphNode; to: GraphNode }) => {
    if (!hoveredNode && !selectedNode) return false;
    const activeNode = hoveredNode || selectedNode;
    return edge.from.id === activeNode || edge.to.id === activeNode;
  };

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative w-full h-full min-h-[400px] rounded-xl bg-gradient-card border border-border overflow-hidden",
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-glow opacity-50" />

      {/* Legend */}
      <div className="absolute top-4 left-4 flex flex-wrap gap-3 z-10">
        {Object.entries(nodeLabels).map(([type, label]) => (
          <div key={type} className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: `hsl(${nodeColors[type as GraphNode["type"]]})` }}
            />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
        ))}
      </div>

      {/* SVG Graph */}
      <svg
        width={dimensions.width}
        height={dimensions.height}
        className="absolute inset-0"
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Edges */}
        <g>
          {edges.map((edge, i) => (
            <line
              key={i}
              x1={edge.from.x}
              y1={edge.from.y}
              x2={edge.to.x}
              y2={edge.to.y}
              stroke={isEdgeHighlighted(edge) ? "hsl(var(--edge-active))" : "hsl(var(--edge-default))"}
              strokeWidth={isEdgeHighlighted(edge) ? 2 : 1}
              strokeOpacity={isNodeHighlighted(edge.from.id) && isNodeHighlighted(edge.to.id) ? 0.6 : 0.2}
              className="transition-all duration-300"
            />
          ))}
        </g>

        {/* Nodes */}
        <g>
          {positionedNodes.map((node) => {
            const isSelected = selectedNode === node.id;
            const isHovered = hoveredNode === node.id;
            const highlighted = isNodeHighlighted(node.id);
            const nodeColor = nodeColors[node.type];

            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => handleNodeClick(node)}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                className="cursor-pointer"
                style={{
                  opacity: highlighted ? 1 : 0.3,
                  transition: "opacity 0.3s ease",
                }}
              >
                {/* Outer glow ring */}
                {(isSelected || isHovered) && (
                  <circle
                    r={32}
                    fill="none"
                    stroke={`hsl(${nodeColor})`}
                    strokeWidth={2}
                    strokeOpacity={0.3}
                    filter="url(#glow)"
                  />
                )}

                {/* Node circle */}
                <circle
                  r={isSelected ? 24 : isHovered ? 22 : 20}
                  fill={`hsl(${nodeColor} / 0.2)`}
                  stroke={`hsl(${nodeColor})`}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all duration-200"
                />

                {/* Inner highlight */}
                <circle
                  r={6}
                  fill={`hsl(${nodeColor})`}
                  className="transition-all duration-200"
                />

                {/* Label */}
                <text
                  y={35}
                  textAnchor="middle"
                  className="text-xs font-medium fill-foreground pointer-events-none"
                >
                  {node.label}
                </text>

                {/* Status indicator */}
                {node.metadata?.status && (
                  <circle
                    cx={14}
                    cy={-14}
                    r={5}
                    fill={
                      node.metadata.status === "active"
                        ? "hsl(var(--success))"
                        : node.metadata.status === "pending"
                        ? "hsl(var(--warning))"
                        : "hsl(var(--muted-foreground))"
                    }
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
        </g>
      </svg>

      {/* Selected node details */}
      {selectedNode && (
        <div className="absolute bottom-4 right-4 p-4 rounded-xl glass-card max-w-xs animate-scale-in">
          {(() => {
            const node = positionedNodes.find((n) => n.id === selectedNode);
            if (!node) return null;
            return (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: `hsl(${nodeColors[node.type]})` }}
                  />
                  <span className="text-sm font-semibold text-foreground">{node.label}</span>
                </div>
                <p className="text-xs text-muted-foreground mb-2">
                  {nodeLabels[node.type]}
                  {node.metadata?.role && ` • ${node.metadata.role}`}
                </p>
                <p className="text-xs text-muted-foreground">
                  {node.connections?.length || 0} connections
                </p>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
}
