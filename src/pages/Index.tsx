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
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-background relative">
      {/* Decorative paw prints */}
      <div className="absolute top-20 left-10 text-6xl opacity-5 pointer-events-none">🐾</div>
      <div className="absolute top-40 right-20 text-6xl opacity-5 pointer-events-none">🐾</div>
      <div className="absolute bottom-40 left-1/4 text-6xl opacity-5 pointer-events-none">🐾</div>
      
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-card border-b-2 border-primary/20 shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-5xl animate-tail-wag">🐕</div>
                <div>
                  <h1 className="text-2xl font-bold text-gradient">BUDDY AI</h1>
                  <p className="text-xs text-muted-foreground font-medium">Your Marketing Best Friend</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 text-sm">
                <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/30 rounded-full">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-green-700 font-medium">The Pack is Ready!</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-card border-2 border-primary/20 p-1 h-auto shadow-md">
              <TabsTrigger 
                value="chat" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white rounded-full"
              >
                <MessageSquare className="w-4 h-4" />
                Chat com Ricardo
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white rounded-full"
              >
                <Users className="w-4 h-4" />
                The Pack
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white rounded-full"
              >
                <BarChart3 className="w-4 h-4" />
                Performance
              </TabsTrigger>
              <TabsTrigger 
                value="admin" 
                className="gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary data-[state=active]:to-secondary data-[state=active]:text-white rounded-full"
              >
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
