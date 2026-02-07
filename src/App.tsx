import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import OrgPulse from "./pages/OrgPulse";
import GraphPage from "./pages/GraphPage";
import DecisionLog from "./pages/DecisionLog";
import UpdatesPage from "./pages/UpdatesPage";
import InboxPage from "./pages/InboxPage";
import AdminPage from "./pages/AdminPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<OrgPulse />} />
          <Route path="/home" element={<OrgPulse />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/decisions" element={<DecisionLog />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/admin" element={<AdminPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
