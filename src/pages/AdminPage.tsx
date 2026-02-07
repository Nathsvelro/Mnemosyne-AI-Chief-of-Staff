import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Mail, 
  MessageSquare, 
  FileText, 
  Calendar,
  Shield,
  Users,
  Trash2,
  Crown,
  Check,
  AlertTriangle,
  Settings2,
  Plug
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const dataSourcesConfig = [
  { id: "email", name: "Email", icon: Mail, connected: true, status: "syncing" },
  { id: "slack", name: "Slack", icon: MessageSquare, connected: true, status: "connected" },
  { id: "docs", name: "Google Docs", icon: FileText, connected: false, status: "disconnected" },
  { id: "calendar", name: "Calendar", icon: Calendar, connected: true, status: "connected" },
];

const connectorLabels = [
  { name: "Email (Slack/Teams)", status: "mock_or_real" },
  { name: "Chat", status: "mock_or_real" },
  { name: "Docs (Drive/Notion)", status: "mock_or_real" },
  { name: "Calendar", status: "mock_or_real" },
];

const AdminPage = () => {
  const { toast } = useToast();
  const [orgName, setOrgName] = useState("Nathaniel Velazquez Company");
  const [ceoName, setCeoName] = useState("Nathaniel Velazquez");
  const [ceoViewEnabled, setCeoViewEnabled] = useState(true);
  const [retentionDays, setRetentionDays] = useState("90");
  const [ceoDigestFrequency, setCeoDigestFrequency] = useState("daily");

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your organization settings have been updated.",
    });
  };

  const connectDataSource = (id: string) => {
    toast({
      title: "Connecting...",
      description: `Initiating connection to ${id}. Please authorize in the popup.`,
    });
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Admin & Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Connectors, permissions, and governance policies
          </p>
        </div>

        <Tabs defaultValue="company" className="space-y-6">
          <TabsList>
            <TabsTrigger value="company">Company</TabsTrigger>
            <TabsTrigger value="connectors">Connectors</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
            <TabsTrigger value="retention">Retention</TabsTrigger>
            <TabsTrigger value="ceo">CEO View</TabsTrigger>
          </TabsList>

          {/* Company Tab */}
          <TabsContent value="company" className="space-y-6">
            <div className="p-6 rounded-xl bg-card border border-border space-y-6">
              <h3 className="font-semibold text-foreground text-lg">Company Information</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Company Name</Label>
                  <Input 
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="mt-2"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">CEO</Label>
                  <Input 
                    value={ceoName}
                    onChange={(e) => setCeoName(e.target.value)}
                    className="mt-2"
                    placeholder="Enter CEO name"
                  />
                </div>
              </div>

              <Button onClick={handleSave}>
                Save Company Settings
              </Button>
            </div>
          </TabsContent>

          {/* Connectors Tab */}
          <TabsContent value="connectors" className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              {dataSourcesConfig.map((source) => {
                const Icon = source.icon;
                return (
                  <div 
                    key={source.id}
                    className="p-4 rounded-xl bg-card border border-border"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center",
                          source.connected ? "bg-success/10" : "bg-muted"
                        )}>
                          <Icon className={cn(
                            "w-5 h-5",
                            source.connected ? "text-success" : "text-muted-foreground"
                          )} />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">{source.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <div className={cn(
                              "w-2 h-2 rounded-full",
                              source.status === "connected" ? "bg-success" :
                              source.status === "syncing" ? "bg-warning animate-pulse" :
                              "bg-muted-foreground"
                            )} />
                            <span className="text-xs text-muted-foreground capitalize">
                              {source.status}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button 
                        size="sm" 
                        variant={source.connected ? "outline" : "default"}
                        onClick={() => connectDataSource(source.id)}
                      >
                        {source.connected ? "Manage" : "Connect"}
                      </Button>
                    </div>
                    {source.connected && source.status === "syncing" && (
                      <div className="mt-3 p-2 rounded-lg bg-warning/10 border border-warning/20">
                        <p className="text-xs text-warning">
                          Initial sync in progress. This may take a few minutes.
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="p-4 rounded-xl bg-secondary/30 border border-border">
              <div className="flex items-center gap-3">
                <Plug className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-foreground">Add Custom Integration</h4>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Connect via webhook or API for custom data sources
                  </p>
                </div>
                <Button variant="outline" size="sm">
                  Configure
                </Button>
              </div>
            </div>

            <Button variant="outline" onClick={() => toast({ title: "Running test import...", description: "Importing sample data from connectors." })}>
              Run Test Import
            </Button>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies" className="space-y-6">
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <h3 className="font-medium text-foreground">Routing Sensitivity Labels</h3>
              <p className="text-xs text-muted-foreground">Control how information is classified and distributed</p>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Badge variant="outline" className="bg-success/10 text-success mb-2">Public</Badge>
                  <p className="text-xs text-muted-foreground">Visible to all</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Badge variant="outline" className="bg-warning/10 text-warning mb-2">Internal</Badge>
                  <p className="text-xs text-muted-foreground">Org members only</p>
                </div>
                <div className="p-3 rounded-lg bg-secondary/30 text-center">
                  <Badge variant="outline" className="bg-conflict/10 text-conflict mb-2">Confidential</Badge>
                  <p className="text-xs text-muted-foreground">Restricted access</p>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <h3 className="font-medium text-foreground">Who Can Confirm Decisions</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Crown className="w-4 h-4 text-warning" />
                    <div>
                      <p className="text-sm text-foreground">Executive Team</p>
                      <p className="text-xs text-muted-foreground">Can confirm all decisions</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Users className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-sm text-foreground">Team Leads</p>
                      <p className="text-xs text-muted-foreground">Can confirm team-level decisions</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div className="flex items-center gap-3">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-foreground">Decision Owners</p>
                      <p className="text-xs text-muted-foreground">Can confirm their own decisions</p>
                    </div>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <h3 className="font-medium text-foreground">Conflict Resolution Workflow</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm text-foreground">Auto-escalate unresolved conflicts</p>
                    <p className="text-xs text-muted-foreground">After 48 hours with no action</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm text-foreground">Require resolution rationale</p>
                    <p className="text-xs text-muted-foreground">Document why a conflict was resolved</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <div>
                    <p className="text-sm text-foreground">Notify stakeholders on resolution</p>
                    <p className="text-xs text-muted-foreground">Send updates when conflicts are closed</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <Button onClick={handleSave}>
              Save Policies
            </Button>
          </TabsContent>

          {/* Data Policy */}
          <TabsContent value="retention" className="space-y-6">
            <div className="p-4 rounded-xl bg-card border border-border space-y-4">
              <h3 className="font-medium text-foreground">Data Retention</h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Retain data for</Label>
                  <Select value={retentionDays} onValueChange={setRetentionDays}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 days</SelectItem>
                      <SelectItem value="90">90 days</SelectItem>
                      <SelectItem value="180">180 days</SelectItem>
                      <SelectItem value="365">1 year</SelectItem>
                      <SelectItem value="forever">Forever</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Auto-delete deprecated decisions</p>
                    <p className="text-xs text-muted-foreground">Remove after retention period</p>
                  </div>
                  <Switch />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-foreground">Anonymize stakeholder data</p>
                    <p className="text-xs text-muted-foreground">After team members leave</p>
                  </div>
                  <Switch defaultChecked />
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-destructive/5 border border-destructive/20">
              <div className="flex items-start gap-3">
                <Trash2 className="w-5 h-5 text-destructive shrink-0" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium text-destructive">Danger Zone</h4>
                  <p className="text-xs text-muted-foreground mt-1 mb-3">
                    Permanently delete all organization data. This action cannot be undone.
                  </p>
                  <Button variant="destructive" size="sm">
                    Delete All Data
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* CEO View */}
          <TabsContent value="ceo" className="space-y-6">
            <div className="p-6 rounded-xl bg-gradient-card border border-primary/20">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                  <Crown className="w-6 h-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground">CEO Executive View</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Enable a high-level executive digest tailored for the CEO's needs.
                  </p>
                </div>
                <Switch 
                  checked={ceoViewEnabled} 
                  onCheckedChange={setCeoViewEnabled}
                />
              </div>
            </div>

            {ceoViewEnabled && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">CEO Name</Label>
                    <Input 
                      value={ceoName}
                      onChange={(e) => setCeoName(e.target.value)}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm text-muted-foreground">Digest Frequency</Label>
                    <Select value={ceoDigestFrequency} onValueChange={setCeoDigestFrequency}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-card border border-border space-y-4">
                  <h4 className="font-medium text-foreground">CEO Digest Includes</h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">{ceoDigestFrequency === "daily" ? "Daily" : "Weekly"} executive brief</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">Top decisions changed</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">Conflicts needing executive arbitration</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Check className="w-4 h-4 text-success" />
                      <span className="text-sm text-foreground">Knowledge bottlenecks across org</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-warning/5 border border-warning/20">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-warning">Escalation Threshold</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        Conflicts with severity ≥8 will be automatically escalated to the CEO view.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Button onClick={handleSave}>
              Save Settings
            </Button>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default AdminPage;
