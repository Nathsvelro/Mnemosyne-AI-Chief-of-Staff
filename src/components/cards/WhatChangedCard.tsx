import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, Calendar, MessageSquare, FileText } from "lucide-react";

interface ChangeSummary {
  category: string;
  count: number;
  highlight: string;
}

interface WhatChangedProps {
  date?: string;
  summaries?: ChangeSummary[];
  className?: string;
}

const defaultSummaries: ChangeSummary[] = [
  { category: "Decisions", count: 3, highlight: "Q2 Budget approved" },
  { category: "Discussions", count: 12, highlight: "AI Strategy alignment" },
  { category: "Documents", count: 5, highlight: "Roadmap updated" },
  { category: "Meetings", count: 4, highlight: "Stakeholder sync scheduled" },
];

const categoryIcons: Record<string, React.ElementType> = {
  Decisions: FileText,
  Discussions: MessageSquare,
  Documents: FileText,
  Meetings: Calendar,
};

export function WhatChangedCard({
  date = "Today",
  summaries = defaultSummaries,
  className,
}: WhatChangedProps) {
  const totalChanges = summaries.reduce((acc, s) => acc + s.count, 0);

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-border bg-gradient-card p-6",
        className
      )}
    >
      {/* Background glow */}
      <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-3xl" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6 relative">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-primary shadow-glow">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">What Changed</h2>
            <p className="text-sm text-muted-foreground">{date}</p>
          </div>
        </div>
        <div className="px-3 py-1.5 rounded-full bg-primary/15 text-primary text-sm font-medium">
          {totalChanges} updates
        </div>
      </div>

      {/* Grid of changes */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {summaries.map((summary, index) => {
          const Icon = categoryIcons[summary.category] || FileText;
          return (
            <div
              key={summary.category}
              className="p-4 rounded-xl bg-background/50 border border-border-subtle hover:border-border hover:bg-background transition-all cursor-pointer group animate-scale-in"
              style={{ animationDelay: `${index * 75}ms` }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Icon className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {summary.category}
                </span>
                <span className="ml-auto text-lg font-bold text-foreground">
                  {summary.count}
                </span>
              </div>
              <p className="text-sm text-foreground truncate">{summary.highlight}</p>
            </div>
          );
        })}
      </div>

      {/* CTA */}
      <button className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-secondary-foreground text-sm font-medium transition-colors group">
        View Full Summary
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
      </button>
    </div>
  );
}
