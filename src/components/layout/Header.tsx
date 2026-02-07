import { Search, Bell, User } from "lucide-react";

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export function Header({ title = "Dashboard", subtitle }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-background-elevated/50 backdrop-blur-sm">
      <div className="flex flex-col">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search knowledge..."
            className="w-64 h-9 pl-10 pr-4 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground bg-muted rounded">
            ⌘K
          </kbd>
        </div>

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
