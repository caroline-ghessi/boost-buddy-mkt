import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Dashboard from "./pages/Dashboard";
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Team from "./pages/Team";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignProgress from "./pages/CampaignProgress";
import CampaignReview from "./pages/CampaignReview";
import BudgetPlanning from "./pages/BudgetPlanning";
import CompetitiveIntelligence from "./pages/CompetitiveIntelligence";
import CompetitorDetail from "./pages/CompetitorDetail";
import AdminSyncStatus from "./pages/AdminSyncStatus";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<ProtectedRoute><AppLayout><Dashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/chat" element={<ProtectedRoute><AppLayout><Chat /></AppLayout></ProtectedRoute>} />
            <Route path="/knowledge" element={<ProtectedRoute><AppLayout><KnowledgeBase /></AppLayout></ProtectedRoute>} />
            <Route path="/team" element={<ProtectedRoute><AppLayout title="A Matilha" subtitle="Gerencie sua equipe de agentes de IA"><Team /></AppLayout></ProtectedRoute>} />
            <Route path="/performance" element={<ProtectedRoute><AppLayout title="Analytics" subtitle="Acompanhe o desempenho das suas campanhas"><Performance /></AppLayout></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><AppLayout><Settings /></AppLayout></ProtectedRoute>} />
            <Route path="/planning" element={<ProtectedRoute><AppLayout><BudgetPlanning /></AppLayout></ProtectedRoute>} />
            
            {/* Campaign Routes - SPRINT 5 */}
            <Route path="/campaigns/new" element={<ProtectedRoute><AppLayout><CampaignBuilder /></AppLayout></ProtectedRoute>} />
            <Route path="/campaigns/:id/progress" element={<ProtectedRoute><AppLayout><CampaignProgress /></AppLayout></ProtectedRoute>} />
            <Route path="/campaigns/:id/review" element={<ProtectedRoute><AppLayout><CampaignReview /></AppLayout></ProtectedRoute>} />
            
            {/* Competitive Intelligence Routes - SPRINT 7 */}
            <Route path="/competitive-intelligence" element={<ProtectedRoute><AppLayout><CompetitiveIntelligence /></AppLayout></ProtectedRoute>} />
            <Route path="/competitive-intelligence/:competitorName" element={<ProtectedRoute><AppLayout><CompetitorDetail /></AppLayout></ProtectedRoute>} />
            
            {/* Admin Routes */}
            <Route path="/admin/sync-status" element={<ProtectedRoute><AppLayout><AdminSyncStatus /></AppLayout></ProtectedRoute>} />
            
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
