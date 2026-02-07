import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown, Minus, LucideIcon } from "lucide-react";

interface InsightCardProps {
  title: string;
  value: string | number;
  description?: string;
  trend?: "up" | "down" | "neutral";
  trendValue?: string;
  icon?: LucideIcon;
  variant?: "default" | "success" | "warning" | "conflict" | "info";
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-card",
    border: "border-border",
    iconBg: "bg-secondary",
    iconColor: "text-foreground",
  },
  success: {
    bg: "bg-success/5",
    border: "border-success/20",
    iconBg: "bg-success/15",
    iconColor: "text-success",
  },
  warning: {
    bg: "bg-warning/5",
    border: "border-warning/20",
    iconBg: "bg-warning/15",
    iconColor: "text-warning",
  },
  conflict: {
    bg: "bg-conflict/5",
    border: "border-conflict/20",
    iconBg: "bg-conflict/15",
    iconColor: "text-conflict",
  },
  info: {
    bg: "bg-info/5",
    border: "border-info/20",
    iconBg: "bg-info/15",
    iconColor: "text-info",
  },
};

export function InsightCard({
  title,
  value,
  description,
  trend,
  trendValue,
  icon: Icon,
  variant = "default",
  className,
}: InsightCardProps) {
  const styles = variantStyles[variant];
  const TrendIcon = trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;

  return (
    <div
      className={cn(
        "p-4 rounded-xl border transition-all duration-200 hover:shadow-md",
        styles.bg,
        styles.border,
        className
      )}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </span>
        {Icon && (
          <div className={cn("p-1.5 rounded-lg", styles.iconBg)}>
            <Icon className={cn("w-4 h-4", styles.iconColor)} />
          </div>
        )}
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-2xl font-bold text-foreground mb-1">{value}</p>
          {description && (
            <p className="text-xs text-muted-foreground">{description}</p>
          )}
        </div>

        {trend && trendValue && (
          <div
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
              trend === "up" && "bg-success/15 text-success",
              trend === "down" && "bg-destructive/15 text-destructive",
              trend === "neutral" && "bg-muted text-muted-foreground"
            )}
          >
            <TrendIcon className="w-3 h-3" />
            {trendValue}
          </div>
        )}
      </div>
    </div>
  );
}
