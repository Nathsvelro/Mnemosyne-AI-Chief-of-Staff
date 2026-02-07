import { useState } from "react";
import { Bell, Check, X, AlertTriangle, FileText, Users, MessageSquare, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  type: "decision" | "conflict" | "mention" | "update" | "routing";
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  priority: "low" | "medium" | "high";
  deepLink?: string;
}

const mockNotifications: Notification[] = [
  {
    id: "n1",
    type: "conflict",
    title: "Launch Date Conflict",
    description: "Marketing and Engineering disagree on the March 15 launch date. Your input is needed.",
    timestamp: "10 min ago",
    isRead: false,
    priority: "high",
    deepLink: "/decisions",
  },
  {
    id: "n2",
    type: "decision",
    title: "Decision Awaiting Approval",
    description: "4-Tier Pricing Model is pending your confirmation as a stakeholder.",
    timestamp: "25 min ago",
    isRead: false,
    priority: "high",
    deepLink: "/decisions",
  },
  {
    id: "n3",
    type: "mention",
    title: "Mentioned by Sarah Chen",
    description: "You were mentioned in the API v1 deprecation discussion.",
    timestamp: "1 hour ago",
    isRead: false,
    priority: "medium",
    deepLink: "/updates",
  },
  {
    id: "n4",
    type: "update",
    title: "Weekly Digest Ready",
    description: "Your personalized organizational update is ready for review.",
    timestamp: "2 hours ago",
    isRead: true,
    priority: "low",
    deepLink: "/",
  },
  {
    id: "n5",
    type: "routing",
    title: "New Item Routed to You",
    description: "SOC2 Compliance decision has been routed to you for awareness.",
    timestamp: "3 hours ago",
    isRead: true,
    priority: "medium",
    deepLink: "/inbox",
  },
  {
    id: "n6",
    type: "decision",
    title: "Decision Confirmed",
    description: "Adopt Next.js has been confirmed by VP Engineering.",
    timestamp: "Yesterday",
    isRead: true,
    priority: "low",
    deepLink: "/decisions",
  },
];

const typeIcons = {
  decision: FileText,
  conflict: AlertTriangle,
  mention: MessageSquare,
  update: Clock,
  routing: Users,
};

const priorityColors = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-warning/20 text-warning",
  high: "bg-destructive/20 text-destructive",
};

export function NotificationsPanel() {
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
  const [isOpen, setIsOpen] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const handleNotificationClick = (notification: Notification) => {
    markAsRead(notification.id);
    if (notification.deepLink) {
      window.location.href = notification.deepLink;
    }
    setIsOpen(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[450px] p-0">
        <SheetHeader className="px-6 py-4 border-b border-border">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {unreadCount} new
                </Badge>
              )}
            </SheetTitle>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                <Check className="w-4 h-4 mr-1" />
                Mark all read
              </Button>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-80px)]">
          <div className="p-2">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <Bell className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-sm text-muted-foreground">No notifications</p>
                <p className="text-xs text-muted-foreground/70 mt-1">
                  You're all caught up!
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {notifications.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        "relative p-4 rounded-lg cursor-pointer transition-all group",
                        notification.isRead
                          ? "bg-transparent hover:bg-secondary/50"
                          : "bg-primary/5 hover:bg-primary/10 border-l-2 border-primary"
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex gap-3">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
                            notification.type === "conflict"
                              ? "bg-destructive/10 text-destructive"
                              : notification.type === "decision"
                              ? "bg-success/10 text-success"
                              : notification.type === "mention"
                              ? "bg-info/10 text-info"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p
                              className={cn(
                                "text-sm font-medium line-clamp-1",
                                notification.isRead ? "text-foreground" : "text-foreground"
                              )}
                            >
                              {notification.title}
                            </p>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dismissNotification(notification.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 hover:bg-secondary rounded transition-all"
                            >
                              <X className="w-3 h-3 text-muted-foreground" />
                            </button>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.description}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] text-muted-foreground">
                              {notification.timestamp}
                            </span>
                            <Badge
                              className={cn(
                                "text-[9px] px-1.5 py-0 h-4",
                                priorityColors[notification.priority]
                              )}
                            >
                              {notification.priority}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
