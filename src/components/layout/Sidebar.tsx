import { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  Home,
  Share2,
  GitBranch,
  Activity,
  Inbox,
  Settings,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Send,
  Loader2,
} from "lucide-react";
import { useAI } from "@/hooks/use-ai";
import mnemosyneLogo from "@/assets/mnemosyne-logo.png";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: string;
}

const navItems: NavItem[] = [
  { icon: Share2, label: "Knowledge Graph", href: "/" },
  { icon: Home, label: "Org Pulse", href: "/pulse" },
  { icon: GitBranch, label: "Decision Log", href: "/decisions" },
  { icon: Activity, label: "Updates", href: "/updates" },
  { icon: Inbox, label: "Inbox", href: "/inbox", badge: "3" },
  { icon: Sparkles, label: "Innovation", href: "/innovation" },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [aiInput, setAiInput] = useState("");
  const [aiResponse, setAiResponse] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { askChiefOfStaff, isLoading } = useAI();

  const handleAiSubmit = async () => {
    if (!aiInput.trim() || isLoading) return;
    
    setIsThinking(true);
    setAiResponse("");
    
    try {
      const result = await askChiefOfStaff(aiInput);
      setAiResponse(result?.answer || "I'm processing your request...");
    } catch (error) {
      setAiResponse("I encountered an issue. Please try again.");
    } finally {
      setIsThinking(false);
      setAiInput("");
    }
  };

  return (
    <aside
      className={cn(
        "flex flex-col h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 ease-in-out",
        collapsed ? "w-[72px]" : "w-[280px]"
      )}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-sidebar-border">
        <img 
          src={mnemosyneLogo} 
          alt="Mnemosyne" 
          className="w-10 h-10 object-contain"
        />
        {!collapsed && (
          <div className="flex flex-col">
            <span className="font-semibold text-foreground text-sm tracking-tight">Mnemosyne</span>
            <span className="text-[10px] text-muted-foreground uppercase tracking-[0.15em]">
              Intelligence OS
            </span>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.href;
          
          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className={cn(
                "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-all duration-200 group relative",
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
              )}
              <Icon
                className={cn(
                  "w-5 h-5 shrink-0 transition-colors",
                  isActive ? "text-sidebar-primary" : "text-muted-foreground group-hover:text-sidebar-accent-foreground"
                )}
              />
              {!collapsed && (
                <span className="text-sm font-medium tracking-tight">{item.label}</span>
              )}
              {!collapsed && item.badge && (
                <span className="ml-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-primary text-primary-foreground">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Chat Section */}
      {!collapsed && (
        <div className="mx-3 mb-3">
          <div className="p-3 rounded-xl bg-gradient-card border border-border-subtle">
            {/* AI Header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="flex items-center justify-center w-6 h-6 rounded-md bg-primary/20">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
                Ask Mnemosyne
              </span>
              <div className="ml-auto flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                <span className="text-[10px] text-muted-foreground">Active</span>
              </div>
            </div>

            {/* AI Response Area */}
            {(aiResponse || isThinking) && (
              <div className="mb-3 p-2.5 rounded-lg bg-background/50 border border-border-subtle">
                {isThinking ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    <span>Thinking...</span>
                  </div>
                ) : (
                  <p className="text-xs text-foreground/90 leading-relaxed line-clamp-4">
                    {aiResponse}
                  </p>
                )}
              </div>
            )}

            {/* AI Input */}
            <div className="relative">
              <input
                ref={inputRef}
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAiSubmit()}
                placeholder="Ask anything..."
                className="w-full px-3 py-2.5 pr-10 text-xs bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 transition-all"
              />
              <button
                onClick={handleAiSubmit}
                disabled={!aiInput.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Status (Collapsed) */}
      {collapsed && (
        <div className="mx-2 mb-3">
          <button
            onClick={() => setCollapsed(false)}
            className="flex items-center justify-center w-full p-2.5 rounded-lg bg-gradient-card border border-border-subtle hover:border-primary/30 transition-colors"
          >
            <Sparkles className="w-4 h-4 text-primary" />
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-sidebar-border p-2">
        <button
          onClick={() => navigate("/admin")}
          className={cn(
            "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg transition-colors relative",
            location.pathname === "/admin"
              ? "bg-sidebar-accent text-sidebar-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
          )}
        >
          {location.pathname === "/admin" && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-primary rounded-full" />
          )}
          <Settings className="w-5 h-5 shrink-0 text-muted-foreground" />
          {!collapsed && <span className="text-sm font-medium tracking-tight">Admin</span>}
        </button>
        
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full mt-2 p-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>
    </aside>
  );
}
