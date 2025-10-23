import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Users, BarChart3, Settings } from "lucide-react";
import CMOChat from "@/components/cmo/CMOChat";
import TeamHierarchy from "@/components/team/TeamHierarchy";
import PerformanceDashboard from "@/components/dashboard/PerformanceDashboard";
import SuperAdminPanel from "@/components/admin/SuperAdminPanel";

const Index = () => {
  const [activeTab, setActiveTab] = useState("chat");

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Gradient Background */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background pointer-events-none" />
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="border-b border-border/50 backdrop-blur-xl bg-background/50 sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center card-glow">
                  <span className="text-xl font-bold text-white">A</span>
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gradient">Agentic Marketing</h1>
                  <p className="text-xs text-muted-foreground">AI-Powered Marketing Agency</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span>All Systems Operational</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass-panel p-1 h-auto">
              <TabsTrigger value="chat" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <MessageSquare className="w-4 h-4" />
                CMO Chat
              </TabsTrigger>
              <TabsTrigger value="team" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Users className="w-4 h-4" />
                Team
              </TabsTrigger>
              <TabsTrigger value="dashboard" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <BarChart3 className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger value="admin" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                <Settings className="w-4 h-4" />
                SuperAdmin
              </TabsTrigger>
            </TabsList>

            <TabsContent value="chat" className="mt-6">
              <CMOChat />
            </TabsContent>

            <TabsContent value="team" className="mt-6">
              <TeamHierarchy />
            </TabsContent>

            <TabsContent value="dashboard" className="mt-6">
              <PerformanceDashboard />
            </TabsContent>

            <TabsContent value="admin" className="mt-6">
              <SuperAdminPanel />
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default Index;
