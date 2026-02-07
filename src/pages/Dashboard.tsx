import { AppLayout } from "@/components/layout/AppLayout";
import { WhatChangedCard } from "@/components/cards/WhatChangedCard";
import { InsightCard } from "@/components/cards/InsightCard";
import { KnowledgeGraph } from "@/components/graph/KnowledgeGraph";
import { ActivityTimeline } from "@/components/timeline/ActivityTimeline";
import { AIReasoningPanel } from "@/components/ai/AIReasoningPanel";
import { Users, GitBranch, AlertTriangle, CheckCircle } from "lucide-react";

const Dashboard = () => {
  return (
    <AppLayout title="Dashboard" subtitle="Organizational intelligence at a glance">
      <div className="space-y-6 animate-fade-in">
        {/* Top row: What Changed + Insight Cards */}
        <div className="grid grid-cols-12 gap-6">
          {/* What Changed - Hero card */}
          <div className="col-span-12 lg:col-span-5">
            <WhatChangedCard />
          </div>

          {/* Insight Cards Grid */}
          <div className="col-span-12 lg:col-span-7 grid grid-cols-2 gap-4">
            <InsightCard
              title="Active Stakeholders"
              value={24}
              description="Engaged in current discussions"
              trend="up"
              trendValue="+3"
              icon={Users}
              variant="info"
            />
            <InsightCard
              title="Open Decisions"
              value={7}
              description="Awaiting resolution"
              trend="down"
              trendValue="-2"
              icon={GitBranch}
              variant="success"
            />
            <InsightCard
              title="Conflicts Detected"
              value={2}
              description="Requires attention"
              trend="neutral"
              trendValue="0"
              icon={AlertTriangle}
              variant="conflict"
            />
            <InsightCard
              title="Decisions This Week"
              value={12}
              description="Successfully resolved"
              trend="up"
              trendValue="+5"
              icon={CheckCircle}
              variant="success"
            />
          </div>
        </div>

        {/* Knowledge Graph - Full width */}
        <div className="rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 bg-card border border-border border-b-0 rounded-t-xl">
            <div>
              <h3 className="font-semibold text-foreground text-sm">Knowledge Graph</h3>
              <p className="text-xs text-muted-foreground">
                Interactive view of organizational connections
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">8 nodes</span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">12 connections</span>
            </div>
          </div>
          <KnowledgeGraph className="h-[400px] rounded-t-none border-t-0" />
        </div>

        {/* Bottom row: Timeline + AI Reasoning */}
        <div className="grid grid-cols-12 gap-6">
          {/* Activity Timeline */}
          <div className="col-span-12 lg:col-span-7">
            <div className="mb-4">
              <h3 className="font-semibold text-foreground text-sm">Activity Timeline</h3>
              <p className="text-xs text-muted-foreground">
                Recent organizational events with AI annotations
              </p>
            </div>
            <ActivityTimeline />
          </div>

          {/* AI Reasoning Panel */}
          <div className="col-span-12 lg:col-span-5">
            <AIReasoningPanel />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
