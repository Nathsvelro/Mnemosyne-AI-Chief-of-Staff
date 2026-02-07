import { useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Check, 
  Clock, 
  User, 
  ArrowRight,
  MoreHorizontal,
  Eye,
  Forward,
  BellOff
} from "lucide-react";
import { cn } from "@/lib/utils";
import { mockRoutingLogs, mockPersons, mockDecisions, mockTopics } from "@/lib/mock-data";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const InboxPage = () => {
  const { toast } = useToast();
  const [readItems, setReadItems] = useState<string[]>(
    mockRoutingLogs.filter(r => r.is_read).map(r => r.id)
  );

  const markAsRead = (id: string) => {
    setReadItems(prev => [...prev, id]);
    toast({
      title: "Marked as read",
      description: "This item has been marked as read.",
    });
  };

  const snooze = (id: string) => {
    toast({
      title: "Snoozed",
      description: "This item will reappear in 24 hours.",
    });
  };

  const delegate = (id: string) => {
    toast({
      title: "Delegate",
      description: "Select a team member to delegate this to.",
    });
  };

  const markAsFYI = (id: string) => {
    setReadItems(prev => [...prev, id]);
    toast({
      title: "Marked as FYI",
      description: "This item has been marked as informational only.",
    });
  };

  const getEntityDetails = (entityType: string, entityId: string) => {
    switch (entityType) {
      case "decision":
        return mockDecisions.find(d => d.id === entityId);
      case "topic":
        return mockTopics.find(t => t.id === entityId);
      default:
        return null;
    }
  };

  const getPersonName = (personId: string) => {
    return mockPersons.find(p => p.id === personId)?.name || "Unknown";
  };

  const unreadCount = mockRoutingLogs.filter(r => !readItems.includes(r.id)).length;

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Targeted routing: only what matters to you
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-sm">
              {unreadCount} unread
            </Badge>
            <Button variant="outline" size="sm">
              <Check className="w-4 h-4 mr-2" />
              Mark all read
            </Button>
          </div>
        </div>

        {/* Inbox Items */}
        <div className="space-y-3">
          {mockRoutingLogs.map((item) => {
            const isRead = readItems.includes(item.id);
            const entity = getEntityDetails(item.entity_type, item.entity_id);
            const personName = getPersonName(item.to_person_id);

            return (
              <div 
                key={item.id}
                className={cn(
                  "p-5 rounded-xl border transition-all cursor-pointer group",
                  isRead 
                    ? "bg-card/50 border-border" 
                    : "bg-card border-primary/20 hover:border-primary/40"
                )}
              >
                <div className="flex items-start gap-4">
                  {/* Unread Indicator */}
                  <div className="pt-1">
                    {!isRead && (
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline" className="text-xs capitalize">
                        {item.entity_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDistanceToNow(new Date(item.sent_at), { addSuffix: true })}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className={cn(
                      "text-base mb-2",
                      isRead ? "text-muted-foreground" : "font-semibold text-foreground"
                    )}>
                      {entity && "title" in entity ? entity.title : 
                       entity && "name" in entity ? entity.name : "Unknown Item"}
                    </h3>

                    {/* Reason for routing */}
                    <div className="p-3 rounded-lg bg-secondary/30 border border-border mb-3">
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-xs font-medium text-muted-foreground">
                          Why this was routed to you
                        </span>
                      </div>
                      <p className="text-sm text-foreground">{item.reason}</p>
                    </div>

                    {/* Suggested Action */}
                    {item.action_required && (
                      <div className="flex items-center gap-2 mb-4">
                        <ArrowRight className="w-4 h-4 text-primary" />
                        <span className="text-sm text-primary font-medium">
                          Suggested: {item.action_required.replace(/_/g, " ")}
                        </span>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Button 
                        size="sm" 
                        variant="default" 
                        className="h-8 text-xs"
                        onClick={() => markAsRead(item.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-8 text-xs"
                        onClick={() => snooze(item.id)}
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        Snooze
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs"
                        onClick={() => delegate(item.id)}
                      >
                        <Forward className="w-3 h-3 mr-1" />
                        Delegate
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-8 text-xs text-muted-foreground"
                        onClick={() => markAsFYI(item.id)}
                      >
                        <BellOff className="w-3 h-3 mr-1" />
                        Mark as FYI
                      </Button>

                      {/* More Options */}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 ml-auto">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => markAsRead(item.id)}>
                            Mark as read
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => snooze(item.id)}>
                            Snooze for 1 week
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-destructive">
                            Archive
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Empty State */}
          {mockRoutingLogs.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <Check className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">All caught up!</h3>
              <p className="text-sm text-muted-foreground">
                No items require your attention right now.
              </p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
};

export default InboxPage;
