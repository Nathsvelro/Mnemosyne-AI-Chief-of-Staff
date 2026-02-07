import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import GraphPage from "./pages/GraphPage";
import OrgPulse from "./pages/OrgPulse";
import DecisionLog from "./pages/DecisionLog";
import UpdatesPage from "./pages/UpdatesPage";
import InboxPage from "./pages/InboxPage";
import AdminPage from "./pages/AdminPage";
import InnovationSprintsPage from "./pages/InnovationSprintsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Graph is now the homepage */}
          <Route path="/" element={<GraphPage />} />
          <Route path="/graph" element={<GraphPage />} />
          <Route path="/home" element={<OrgPulse />} />
          <Route path="/pulse" element={<OrgPulse />} />
          <Route path="/decisions" element={<DecisionLog />} />
          <Route path="/updates" element={<UpdatesPage />} />
          <Route path="/inbox" element={<InboxPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/innovation" element={<InnovationSprintsPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
