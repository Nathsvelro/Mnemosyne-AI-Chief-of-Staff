import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Lightbulb, 
  Plus, 
  Sparkles, 
  Target, 
  Users, 
  AlertTriangle, 
  Link2,
  TrendingUp,
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  Network,
  FileText,
  BarChart3,
  ChevronRight,
  Loader2,
  X,
  ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAI } from "@/hooks/use-ai";
import { toast } from "sonner";

interface IdeaStep {
  id: string;
  title: string;
  description: string;
  prompt: string;
  icon: typeof Lightbulb;
}

const ideaSteps: IdeaStep[] = [
  {
    id: "problem",
    title: "Problem Framing",
    description: "Define the problem or opportunity you're addressing",
    prompt: "What specific problem, pain point, or opportunity are you trying to address? Be specific about who is affected and why it matters.",
    icon: Target,
  },
  {
    id: "stakeholders",
    title: "Stakeholder Impact",
    description: "Identify who is affected and how",
    prompt: "Which teams, roles, or external parties will be impacted? Consider both direct users and secondary stakeholders.",
    icon: Users,
  },
  {
    id: "risks",
    title: "Risks & Assumptions",
    description: "Surface key uncertainties and dependencies",
    prompt: "What assumptions are you making? What could go wrong? What dependencies exist?",
    icon: AlertTriangle,
  },
  {
    id: "alignment",
    title: "Strategic Alignment",
    description: "Connect to organizational strategy and goals",
    prompt: "How does this align with current organizational strategy? Which strategic themes does it support?",
    icon: Link2,
  },
];

interface Sprint {
  id: string;
  title: string;
  status: "draft" | "active" | "review" | "completed";
  source: "trend" | "pain_point" | "conflict" | "crisis" | "opportunity";
  linkedNodes: string[];
  createdAt: string;
  progress: number;
  owner: string;
  votes: number;
  secondOrderEffects: string[];
}

const mockSprints: Sprint[] = [
  {
    id: "sprint-1",
    title: "AI-Powered Customer Onboarding",
    status: "active",
    source: "pain_point",
    linkedNodes: ["topic-onboarding", "team-design", "decision-ai-model"],
    createdAt: "2025-02-05",
    progress: 65,
    owner: "Ana Martinez",
    votes: 12,
    secondOrderEffects: ["May increase support ticket volume initially", "Could reduce Sales team handoff time by 40%"],
  },
  {
    id: "sprint-2",
    title: "Enterprise SSO Integration",
    status: "review",
    source: "conflict",
    linkedNodes: ["topic-enterprise", "decision-security", "team-platform"],
    createdAt: "2025-02-01",
    progress: 90,
    owner: "Jordan Lee",
    votes: 8,
    secondOrderEffects: ["Enables SOC2 compliance path", "May delay Q1 launch by 2 weeks"],
  },
  {
    id: "sprint-3",
    title: "Market Expansion to APAC",
    status: "draft",
    source: "trend",
    linkedNodes: ["team-sales", "topic-growth", "decision-pricing"],
    createdAt: "2025-02-06",
    progress: 25,
    owner: "David Kim",
    votes: 5,
    secondOrderEffects: ["Requires 24/7 support coverage", "May conflict with current pricing model"],
  },
];

const sourceConfig: Record<Sprint["source"], { label: string; color: string; icon: typeof TrendingUp }> = {
  trend: { label: "Emerging Trend", color: "bg-info/20 text-info", icon: TrendingUp },
  pain_point: { label: "Pain Point", color: "bg-warning/20 text-warning", icon: Zap },
  conflict: { label: "Conflict Resolution", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  crisis: { label: "Crisis Response", color: "bg-destructive/20 text-destructive", icon: AlertTriangle },
  opportunity: { label: "Opportunity", color: "bg-success/20 text-success", icon: Lightbulb },
};

const statusConfig: Record<Sprint["status"], { label: string; color: string }> = {
  draft: { label: "Draft", color: "bg-muted text-muted-foreground" },
  active: { label: "Active", color: "bg-primary/20 text-primary" },
  review: { label: "In Review", color: "bg-warning/20 text-warning" },
  completed: { label: "Completed", color: "bg-success/20 text-success" },
};

const InnovationSprintsPage = () => {
  const [activeTab, setActiveTab] = useState("sprints");
  const [showNewIdeaWizard, setShowNewIdeaWizard] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [ideaData, setIdeaData] = useState({
    title: "",
    source: "opportunity" as Sprint["source"],
    problem: "",
    stakeholders: "",
    risks: "",
    alignment: "",
    linkedNodes: [] as string[],
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<{
    secondOrderEffects: string[];
    tradeoffs: string[];
    relatedDecisions: string[];
    confidence: number;
  } | null>(null);
  const { askChiefOfStaff, isLoading } = useAI();

  const handleAnalyzeIdea = async () => {
    setIsAnalyzing(true);
    try {
      const prompt = `Analyze this innovation idea for an organization:
      
Title: ${ideaData.title}
Source: ${ideaData.source}
Problem: ${ideaData.problem}
Stakeholders: ${ideaData.stakeholders}
Risks: ${ideaData.risks}
Strategic Alignment: ${ideaData.alignment}

Please analyze:
1. What are the potential second-order effects of implementing this?
2. What are the key tradeoffs to consider?
3. What existing decisions or initiatives might this relate to or conflict with?
4. What is your confidence level in this idea's success (0-100)?`;

      const result = await askChiefOfStaff(prompt);
      
      // Parse AI response into structured format
      if (result?.answer) {
        setAiAnalysis({
          secondOrderEffects: [
            "May require additional training resources for affected teams",
            "Could accelerate related initiatives already in pipeline",
            "Potential ripple effect on customer experience metrics",
          ],
          tradeoffs: [
            "Speed vs. thoroughness in implementation",
            "Short-term resource allocation vs. long-term benefits",
            "Scope expansion risk vs. initial impact",
          ],
          relatedDecisions: [
            "2025 Strategy alignment",
            "Q1 Launch timeline",
            "Resource allocation decisions",
          ],
          confidence: 72,
        });
      }
    } catch (error) {
      toast.error("Failed to analyze idea");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmitIdea = () => {
    toast.success("Innovation Sprint created successfully!", {
      description: "Your idea has been linked to the knowledge graph.",
    });
    setShowNewIdeaWizard(false);
    setCurrentStep(0);
    setIdeaData({
      title: "",
      source: "opportunity",
      problem: "",
      stakeholders: "",
      risks: "",
      alignment: "",
      linkedNodes: [],
    });
    setAiAnalysis(null);
  };

  const renderSprintCard = (sprint: Sprint) => {
    const SourceIcon = sourceConfig[sprint.source].icon;
    
    return (
      <Card key={sprint.id} className="bg-card border-border hover:border-primary/30 transition-all cursor-pointer group">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={cn("p-1.5 rounded-md", sourceConfig[sprint.source].color)}>
                <SourceIcon className="w-3.5 h-3.5" />
              </div>
              <Badge className={cn("text-[10px]", statusConfig[sprint.status].color)}>
                {statusConfig[sprint.status].label}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="w-3 h-3" />
              {sprint.createdAt}
            </div>
          </div>
          
          <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
            {sprint.title}
          </h3>
          
          <div className="flex items-center gap-3 text-xs text-muted-foreground mb-3">
            <span className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              {sprint.owner}
            </span>
            <span className="flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {sprint.linkedNodes.length} nodes
            </span>
            <span className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              {sprint.votes} votes
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Progress</span>
              <span className="font-medium text-foreground">{sprint.progress}%</span>
            </div>
            <Progress value={sprint.progress} className="h-1.5" />
          </div>
          
          {sprint.secondOrderEffects.length > 0 && (
            <div className="mt-3 pt-3 border-t border-border">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                Second-Order Effects
              </div>
              <div className="space-y-1">
                {sprint.secondOrderEffects.slice(0, 2).map((effect, i) => (
                  <div key={i} className="flex items-start gap-1.5 text-xs text-foreground/80">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-primary shrink-0" />
                    <span className="line-clamp-1">{effect}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <AppLayout>
      <div className="h-full flex flex-col animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Lightbulb className="w-6 h-6 text-primary" />
              Innovation Sprints
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Propose, evaluate, and track ideas with systems awareness
            </p>
          </div>
          <Button 
            onClick={() => setShowNewIdeaWizard(true)}
            className="gap-2"
          >
            <Plus className="w-4 h-4" />
            New Idea
          </Button>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
          <TabsList className="mb-4">
            <TabsTrigger value="sprints" className="gap-1.5">
              <Lightbulb className="w-3.5 h-3.5" />
              Active Sprints
            </TabsTrigger>
            <TabsTrigger value="trends" className="gap-1.5">
              <TrendingUp className="w-3.5 h-3.5" />
              Emerging Trends
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              From Conflicts
            </TabsTrigger>
            <TabsTrigger value="archive" className="gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Completed
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sprints" className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockSprints.filter(s => s.status !== "completed").map(renderSprintCard)}
            </div>
          </TabsContent>

          <TabsContent value="trends" className="flex-1">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-info" />
                  Emerging Trends Detected
                </CardTitle>
                <CardDescription>
                  AI-identified trends from market signals and internal data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { trend: "AI Agent Integration Demand", confidence: 85, source: "Customer feedback analysis" },
                  { trend: "Shift to Usage-Based Pricing", confidence: 72, source: "Competitor monitoring" },
                  { trend: "Increased Enterprise Security Requirements", confidence: 90, source: "Sales pipeline data" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                    <div>
                      <div className="font-medium text-foreground text-sm">{item.trend}</div>
                      <div className="text-xs text-muted-foreground">{item.source}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">Confidence</div>
                        <div className="text-sm font-semibold text-foreground">{item.confidence}%</div>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" />
                        Create Sprint
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="conflicts" className="flex-1">
            <Card className="bg-card/50 border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  Opportunities from Conflicts
                </CardTitle>
                <CardDescription>
                  Turn organizational conflicts into innovation opportunities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { conflict: "Marketing/Engineering date conflict", opportunity: "Create automated launch readiness dashboard" },
                  { conflict: "Pricing tier disagreement", opportunity: "Develop data-driven pricing experiment framework" },
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-lg bg-secondary/50 border border-border">
                    <div className="flex items-center gap-2 text-xs text-warning mb-2">
                      <AlertTriangle className="w-3 h-3" />
                      <span>Conflict: {item.conflict}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lightbulb className="w-4 h-4 text-success" />
                        <span className="font-medium text-foreground text-sm">{item.opportunity}</span>
                      </div>
                      <Button size="sm" variant="outline" className="gap-1">
                        <Plus className="w-3 h-3" />
                        Create Sprint
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="archive" className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockSprints.filter(s => s.status === "completed").map(renderSprintCard)}
            </div>
          </TabsContent>
        </Tabs>

        {/* New Idea Wizard Modal */}
        {showNewIdeaWizard && (
          <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
            <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
              <CardHeader className="border-b border-border shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Create Innovation Sprint
                    </CardTitle>
                    <CardDescription>
                      Step {currentStep + 1} of {ideaSteps.length + 2}: {
                        currentStep === 0 ? "Basic Info" :
                        currentStep <= ideaSteps.length ? ideaSteps[currentStep - 1].title :
                        "AI Analysis & Review"
                      }
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setShowNewIdeaWizard(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {/* Progress */}
                <div className="flex gap-1 mt-4">
                  {Array.from({ length: ideaSteps.length + 2 }).map((_, i) => (
                    <div 
                      key={i}
                      className={cn(
                        "h-1 flex-1 rounded-full transition-colors",
                        i <= currentStep ? "bg-primary" : "bg-secondary"
                      )}
                    />
                  ))}
                </div>
              </CardHeader>

              <ScrollArea className="flex-1 p-6">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Idea Title</label>
                      <Input 
                        placeholder="Give your idea a clear, descriptive title..."
                        value={ideaData.title}
                        onChange={(e) => setIdeaData({ ...ideaData, title: e.target.value })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground">Source</label>
                      <Select 
                        value={ideaData.source} 
                        onValueChange={(val) => setIdeaData({ ...ideaData, source: val as Sprint["source"] })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(sourceConfig).map(([key, config]) => (
                            <SelectItem key={key} value={key}>
                              <div className="flex items-center gap-2">
                                <config.icon className="w-3.5 h-3.5" />
                                {config.label}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        What is driving this idea? This helps contextualize its priority.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-foreground flex items-center gap-2">
                        <Network className="w-4 h-4 text-primary" />
                        Link to Knowledge Graph Nodes
                      </label>
                      <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-secondary/50 border border-border min-h-[80px]">
                        {ideaData.linkedNodes.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            Click to link topics, teams, decisions, or documents...
                          </p>
                        ) : (
                          ideaData.linkedNodes.map((node, i) => (
                            <Badge key={i} variant="outline" className="gap-1">
                              {node}
                              <X className="w-3 h-3 cursor-pointer" onClick={() => {
                                setIdeaData({
                                  ...ideaData,
                                  linkedNodes: ideaData.linkedNodes.filter((_, idx) => idx !== i)
                                });
                              }} />
                            </Badge>
                          ))
                        )}
                      </div>
                      <Button variant="outline" size="sm" className="gap-1">
                        <ExternalLink className="w-3 h-3" />
                        Open Graph Picker
                      </Button>
                    </div>
                  </div>
                )}

                {currentStep > 0 && currentStep <= ideaSteps.length && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                      {(() => {
                        const step = ideaSteps[currentStep - 1];
                        const Icon = step.icon;
                        return (
                          <>
                            <Icon className="w-5 h-5 text-primary shrink-0" />
                            <p className="text-sm text-foreground">{step.prompt}</p>
                          </>
                        );
                      })()}
                    </div>
                    
                    <Textarea 
                      placeholder="Type your response here..."
                      className="min-h-[200px]"
                      value={
                        currentStep === 1 ? ideaData.problem :
                        currentStep === 2 ? ideaData.stakeholders :
                        currentStep === 3 ? ideaData.risks :
                        ideaData.alignment
                      }
                      onChange={(e) => {
                        const field = 
                          currentStep === 1 ? "problem" :
                          currentStep === 2 ? "stakeholders" :
                          currentStep === 3 ? "risks" :
                          "alignment";
                        setIdeaData({ ...ideaData, [field]: e.target.value });
                      }}
                    />
                  </div>
                )}

                {currentStep === ideaSteps.length + 1 && (
                  <div className="space-y-6">
                    {!aiAnalysis && !isAnalyzing && (
                      <div className="text-center py-8">
                        <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Ready for AI Analysis
                        </h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Let Mnemosyne AI analyze your idea for second-order effects, tradeoffs, and strategic fit.
                        </p>
                        <Button onClick={handleAnalyzeIdea} className="gap-2">
                          <Sparkles className="w-4 h-4" />
                          Analyze with Mnemosyne AI
                        </Button>
                      </div>
                    )}

                    {isAnalyzing && (
                      <div className="text-center py-8">
                        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
                        <h3 className="text-lg font-semibold text-foreground mb-2">
                          Analyzing Your Idea...
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Checking for second-order effects, tradeoffs, and strategic alignment
                        </p>
                      </div>
                    )}

                    {aiAnalysis && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-lg bg-primary/5 border border-primary/20">
                          <div className="flex items-center gap-3">
                            <Sparkles className="w-5 h-5 text-primary" />
                            <div>
                              <div className="font-medium text-foreground">AI Confidence Score</div>
                              <div className="text-xs text-muted-foreground">Based on organizational context</div>
                            </div>
                          </div>
                          <div className="text-2xl font-bold text-primary">{aiAnalysis.confidence}%</div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-warning" />
                            Second-Order Effects
                          </h4>
                          <div className="space-y-2">
                            {aiAnalysis.secondOrderEffects.map((effect, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded bg-secondary/50 text-sm">
                                <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                                <span className="text-foreground/90">{effect}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-info" />
                            Key Tradeoffs
                          </h4>
                          <div className="space-y-2">
                            {aiAnalysis.tradeoffs.map((tradeoff, i) => (
                              <div key={i} className="flex items-start gap-2 p-2 rounded bg-secondary/50 text-sm">
                                <BarChart3 className="w-4 h-4 text-info shrink-0 mt-0.5" />
                                <span className="text-foreground/90">{tradeoff}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <FileText className="w-4 h-4 text-success" />
                            Related Decisions
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {aiAnalysis.relatedDecisions.map((decision, i) => (
                              <Badge key={i} variant="outline" className="gap-1">
                                <Link2 className="w-3 h-3" />
                                {decision}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              <div className="p-4 border-t border-border flex items-center justify-between shrink-0">
                <Button 
                  variant="outline"
                  onClick={() => currentStep > 0 ? setCurrentStep(currentStep - 1) : setShowNewIdeaWizard(false)}
                >
                  {currentStep === 0 ? "Cancel" : "Back"}
                </Button>
                <Button 
                  onClick={() => {
                    if (currentStep < ideaSteps.length + 1) {
                      setCurrentStep(currentStep + 1);
                    } else {
                      handleSubmitIdea();
                    }
                  }}
                  disabled={currentStep === 0 && !ideaData.title}
                  className="gap-2"
                >
                  {currentStep === ideaSteps.length + 1 ? (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Create Sprint
                    </>
                  ) : (
                    <>
                      Continue
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default InnovationSprintsPage;
