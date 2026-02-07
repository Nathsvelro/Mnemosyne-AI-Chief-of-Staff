import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import GraphPage from "./pages/GraphPage";
import OrgPulse from "./pages/OrgPulse";
import DecisionLog from "./pages/DecisionLog";
import UpdatesPage from "./pages/UpdatesPage";
import InboxPage from "./pages/InboxPage";
import AdminPage from "./pages/AdminPage";
import InnovationSprintsPage from "./pages/InnovationSprintsPage";
import AuthPage from "./pages/AuthPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Demo mode - redirects to home */}
          <Route path="/auth" element={<AuthPage />} />
          
          {/* All routes accessible in demo mode */}
          <Route path="/" element={<ProtectedRoute><GraphPage /></ProtectedRoute>} />
          <Route path="/graph" element={<ProtectedRoute><GraphPage /></ProtectedRoute>} />
          <Route path="/home" element={<ProtectedRoute><OrgPulse /></ProtectedRoute>} />
          <Route path="/pulse" element={<ProtectedRoute><OrgPulse /></ProtectedRoute>} />
          <Route path="/decisions" element={<ProtectedRoute><DecisionLog /></ProtectedRoute>} />
          <Route path="/updates" element={<ProtectedRoute><UpdatesPage /></ProtectedRoute>} />
          <Route path="/inbox" element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/innovation" element={<ProtectedRoute><InnovationSprintsPage /></ProtectedRoute>} />
          
          {/* Catch-all */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
