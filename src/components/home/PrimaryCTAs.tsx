import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Mic, FileText, Network, FileBarChart } from "lucide-react";

export function PrimaryCTAs() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Button 
        variant="outline" 
        className="h-auto py-4 px-4 flex flex-col items-center gap-2 bg-card hover:bg-card-hover border-border"
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Mic className="w-5 h-5 text-primary" />
        </div>
        <span className="text-sm font-medium text-foreground">Record Meeting</span>
        <span className="text-[10px] text-muted-foreground">Capture & summarize</span>
      </Button>

      <Button 
        variant="outline" 
        className="h-auto py-4 px-4 flex flex-col items-center gap-2 bg-card hover:bg-card-hover border-border"
        onClick={() => navigate("/decisions")}
      >
        <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
          <FileText className="w-5 h-5 text-success" />
        </div>
        <span className="text-sm font-medium text-foreground">Log Decision</span>
        <span className="text-[10px] text-muted-foreground">Create new record</span>
      </Button>

      <Button 
        variant="outline" 
        className="h-auto py-4 px-4 flex flex-col items-center gap-2 bg-card hover:bg-card-hover border-border"
        onClick={() => navigate("/graph")}
      >
        <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
          <Network className="w-5 h-5 text-info" />
        </div>
        <span className="text-sm font-medium text-foreground">View Graph</span>
        <span className="text-[10px] text-muted-foreground">Knowledge map</span>
      </Button>

      <Button 
        variant="outline" 
        className="h-auto py-4 px-4 flex flex-col items-center gap-2 bg-card hover:bg-card-hover border-border"
      >
        <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
          <FileBarChart className="w-5 h-5 text-warning" />
        </div>
        <span className="text-sm font-medium text-foreground">Weekly Report</span>
        <span className="text-[10px] text-muted-foreground">Generate alignment</span>
      </Button>
    </div>
  );
}
