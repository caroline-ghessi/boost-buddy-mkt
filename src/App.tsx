import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Chat from "./pages/Chat";
import KnowledgeBase from "./pages/KnowledgeBase";
import Team from "./pages/Team";
import Performance from "./pages/Performance";
import Settings from "./pages/Settings";
import CampaignBuilder from "./pages/CampaignBuilder";
import CampaignProgress from "./pages/CampaignProgress";
import CampaignReview from "./pages/CampaignReview";
import CompetitiveIntelligence from "./pages/CompetitiveIntelligence";
import CompetitorDetail from "./pages/CompetitorDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppLayout><Chat /></AppLayout>} />
          <Route path="/knowledge" element={<AppLayout><KnowledgeBase /></AppLayout>} />
          <Route path="/team" element={<AppLayout><Team /></AppLayout>} />
          <Route path="/performance" element={<AppLayout><Performance /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><Settings /></AppLayout>} />
          
          {/* Campaign Routes - SPRINT 5 */}
          <Route path="/campaigns/new" element={<AppLayout><CampaignBuilder /></AppLayout>} />
          <Route path="/campaigns/:id/progress" element={<AppLayout><CampaignProgress /></AppLayout>} />
          <Route path="/campaigns/:id/review" element={<AppLayout><CampaignReview /></AppLayout>} />
          
          {/* Competitive Intelligence Routes - SPRINT 7 */}
          <Route path="/competitive-intelligence" element={<AppLayout><CompetitiveIntelligence /></AppLayout>} />
          <Route path="/competitive-intelligence/:competitorName" element={<AppLayout><CompetitorDetail /></AppLayout>} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
