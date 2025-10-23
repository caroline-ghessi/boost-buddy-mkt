import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, RefreshCw, Pause } from "lucide-react";
import { CompetitorOverview } from "@/components/intelligence/CompetitorOverview";
import { ChangeTimeline } from "@/components/intelligence/ChangeTimeline";
import { supabase } from "@/integrations/supabase/client";
import { useCompetitorMonitoring } from "@/hooks/useCompetitorMonitoring";
import { toast } from "sonner";

export default function CompetitorDetail() {
  const { competitorName } = useParams<{ competitorName: string }>();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | undefined>();
  const [competitorData, setCompetitorData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { triggerManualScrape, isScrapingLoading } = useCompetitorMonitoring();

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  useEffect(() => {
    if (!userId || !competitorName) return;

    fetchCompetitorData();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("competitor-detail-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "competitor_data",
          filter: `competitor_name=eq.${competitorName}`,
        },
        (payload) => {
          console.log("New competitor data:", payload);
          fetchCompetitorData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, competitorName]);

  const fetchCompetitorData = async () => {
    if (!userId || !competitorName) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("competitor_data")
        .select("*")
        .eq("user_id", userId)
        .eq("competitor_name", competitorName)
        .order("scraped_at", { ascending: false });

      if (error) throw error;

      setCompetitorData(data || []);
    } catch (error) {
      console.error("Error fetching competitor data:", error);
      toast.error("Erro ao carregar dados do concorrente");
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualScrape = async () => {
    if (!userId || !competitorName) return;

    // Get platforms from config
    const config = competitorData.find((d) => d.data_type === "monitoring_config");
    if (!config) {
      toast.error("Configuração do concorrente não encontrada");
      return;
    }

    await triggerManualScrape(competitorName, config.data?.platforms || {}, userId);
  };

  const insights = competitorData.filter((d) => d.data_type === "ai_insights");
  const competitor = {
    name: competitorName,
    data: competitorData,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Carregando dados...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/competitive-intelligence")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{competitorName}</h1>
            <p className="text-muted-foreground">
              Monitoramento por Thiago Costa 🐶
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleManualScrape}
            disabled={isScrapingLoading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isScrapingLoading ? "animate-spin" : ""}`} />
            Atualizar Agora
          </Button>
          <Button variant="outline">
            <Pause className="w-4 h-4 mr-2" />
            Pausar Monitoramento
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="changes">Mudanças</TabsTrigger>
          <TabsTrigger value="data">Dados Brutos</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <CompetitorOverview competitor={competitor} insights={insights} />
        </TabsContent>

        <TabsContent value="changes" className="mt-6">
          <ChangeTimeline changes={competitorData} />
        </TabsContent>

        <TabsContent value="data" className="mt-6">
          <Card className="p-6">
            <pre className="text-xs overflow-auto max-h-[600px]">
              {JSON.stringify(competitorData, null, 2)}
            </pre>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
