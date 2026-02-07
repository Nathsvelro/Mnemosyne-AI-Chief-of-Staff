import { AppLayout } from "@/components/layout/AppLayout";
import { TodaysBrief } from "@/components/home/TodaysBrief";
import { KeyAlerts } from "@/components/home/KeyAlerts";
import { ActionQueue } from "@/components/home/ActionQueue";
import { PrimaryCTAs } from "@/components/home/PrimaryCTAs";
import { 
  mockBriefItems, 
  mockConflicts, 
  mockPersons, 
  mockActionItems 
} from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

const OrgPulse = () => {
  const { toast } = useToast();
  
  // Get overloaded persons (load_score > 80)
  const overloadedPersons = mockPersons.filter(p => p.load_score > 80);

  const handleApproveAction = () => {
    toast({
      title: "Action Approved",
      description: "The decision has been confirmed and stakeholders notified.",
    });
  };

  const handleClarifyAction = () => {
    toast({
      title: "Clarification Requested",
      description: "A request for clarification has been sent.",
    });
  };

  const handleAssignAction = () => {
    toast({
      title: "Assignment Dialog",
      description: "Select a team member to assign this action to.",
    });
  };

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Org Pulse</h1>
          <p className="text-sm text-muted-foreground mt-1">
            What changed, what's risky, what needs action
          </p>
        </div>

        {/* Primary CTAs */}
        <PrimaryCTAs />

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Today's Brief - Main column */}
          <div className="col-span-12 lg:col-span-8">
            <TodaysBrief 
              items={mockBriefItems} 
              onOpenItem={(item) => {
                toast({
                  title: "Opening Item",
                  description: `Navigating to ${item.entityType}: ${item.summary.slice(0, 50)}...`,
                });
              }}
            />
          </div>

          {/* Right Column: Key Alerts */}
          <div className="col-span-12 lg:col-span-4">
            <KeyAlerts 
              conflicts={mockConflicts}
              overloadedPersons={overloadedPersons}
              blockedKnowledgeCount={2}
            />
          </div>
        </div>

        {/* Action Queue */}
        <ActionQueue 
          items={mockActionItems}
          onApprove={handleApproveAction}
          onRequestClarification={handleClarifyAction}
          onAssign={handleAssignAction}
        />
      </div>
    </AppLayout>
  );
};

export default OrgPulse;
