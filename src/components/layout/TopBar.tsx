import { Search, Bell, User, Mic, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useState } from "react";

interface TopBarProps {
  onAskChiefOfStaff?: (query: string) => void;
}

export function TopBar({ onAskChiefOfStaff }: TopBarProps) {
  const [chiefOfStaffQuery, setChiefOfStaffQuery] = useState("");
  const [selectedOrg] = useState("Acme Corp");

  const handleAskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (chiefOfStaffQuery.trim()) {
      onAskChiefOfStaff?.(chiefOfStaffQuery);
      setChiefOfStaffQuery("");
    }
  };

  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background-elevated/50 backdrop-blur-sm">
      {/* Left: Org selector */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2 text-sm font-medium">
              <div className="w-6 h-6 rounded-md bg-gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                A
              </div>
              {selectedOrg}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Acme Corp</DropdownMenuItem>
            <DropdownMenuItem>Tech Startup Inc</DropdownMenuItem>
            <DropdownMenuItem>Enterprise Co</DropdownMenuItem>
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
            <div className="w-5 h-5 rounded-full bg-gradient-primary flex items-center justify-center">
              <span className="text-[10px] font-bold text-primary-foreground">AI</span>
            </div>
          </div>
          <Input
            type="text"
            placeholder="Ask the Chief of Staff..."
            value={chiefOfStaffQuery}
            onChange={(e) => setChiefOfStaffQuery(e.target.value)}
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

      {/* Right: Notifications & User */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-conflict" />
        </button>

        {/* User */}
        <button className="flex items-center gap-2 p-1.5 pr-3 rounded-lg hover:bg-secondary transition-colors">
          <div className="w-7 h-7 rounded-lg bg-gradient-primary flex items-center justify-center">
            <User className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Alex</span>
        </button>
      </div>
    </header>
  );
}
