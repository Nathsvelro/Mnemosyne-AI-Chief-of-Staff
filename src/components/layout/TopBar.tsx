import { Search, User, Mic, ChevronDown, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { useAI } from "@/hooks/use-ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NotificationsPanel } from "./NotificationsPanel";
import { AIChatDrawer } from "./AIChatDrawer";

interface TopBarProps {
  onAskChiefOfStaff?: (query: string) => void;
}

export function TopBar({ onAskChiefOfStaff }: TopBarProps) {
  const [chiefOfStaffQuery, setChiefOfStaffQuery] = useState("");
  const [selectedOrg] = useState("Nathaniel Velazquez Company");
  const [isAiDialogOpen, setIsAiDialogOpen] = useState(false);
  const [aiConversation, setAiConversation] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);

  const { askChiefOfStaff, isLoading } = useAI();

  const handleAskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chiefOfStaffQuery.trim() || isLoading) return;

    const query = chiefOfStaffQuery.trim();
    setChiefOfStaffQuery("");
    setIsAiDialogOpen(true);
    
    // Add user message to conversation
    setAiConversation(prev => [...prev, { role: "user", content: query }]);

    // Call the AI
    const response = await askChiefOfStaff(query);
    
    if (response?.answer) {
      setAiConversation(prev => [...prev, { role: "assistant", content: response.answer }]);
    }

    // Also call the optional callback
    onAskChiefOfStaff?.(query);
  };

  return (
    <>
      <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background-elevated/50 backdrop-blur-sm">
        {/* Left: Org selector */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2 text-sm font-medium">
                <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                  N
                </div>
                {selectedOrg}
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem>Nathaniel Velazquez Company</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search people, topics, decisions..."
              className="w-64 h-9 pl-10 pr-4 bg-secondary border-border text-sm"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Center: Ask Chief of Staff */}
        <form onSubmit={handleAskSubmit} className="flex-1 max-w-xl mx-8">
          <div className="relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              ) : (
                <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
                  <span className="text-[10px] font-bold text-primary-foreground">AI</span>
                </div>
              )}
            </div>
            <Input
              type="text"
              placeholder="Ask the Chief of Staff..."
              value={chiefOfStaffQuery}
              onChange={(e) => setChiefOfStaffQuery(e.target.value)}
              disabled={isLoading}
              className="w-full h-10 pl-12 pr-12 bg-secondary/50 border-border text-sm placeholder:text-muted-foreground focus:ring-primary/50"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <Mic className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Right: AI Chat, Notifications & User */}
        <div className="flex items-center gap-2">
          {/* AI Chat Drawer */}
          <AIChatDrawer />

          {/* Notifications */}
          <NotificationsPanel />

          {/* User */}
          <button className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-secondary transition-colors">
            <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium text-foreground">Nathaniel</span>
          </button>
        </div>
      </header>

      {/* AI Response Dialog */}
      <Dialog open={isAiDialogOpen} onOpenChange={setIsAiDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gradient-primary flex items-center justify-center">
                <span className="text-xs font-bold text-primary-foreground">AI</span>
              </div>
              Chief of Staff
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh] pr-4">
            <div className="space-y-4">
              {aiConversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-lg ${
                    msg.role === "user"
                      ? "bg-secondary ml-8"
                      : "bg-primary/10 mr-8 border border-primary/20"
                  }`}
                >
                  <p className="text-xs font-medium text-muted-foreground mb-1">
                    {msg.role === "user" ? "You" : "Chief of Staff"}
                  </p>
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              {isLoading && (
                <div className="flex items-center gap-2 p-4 bg-primary/10 rounded-lg mr-8 border border-primary/20">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  <span className="text-sm text-muted-foreground">Thinking...</span>
                </div>
              )}
            </div>
          </ScrollArea>
          <form onSubmit={handleAskSubmit} className="mt-4">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Ask a follow-up question..."
                value={chiefOfStaffQuery}
                onChange={(e) => setChiefOfStaffQuery(e.target.value)}
                disabled={isLoading}
                className="flex-1"
              />
              <Button type="submit" disabled={isLoading || !chiefOfStaffQuery.trim()}>
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
