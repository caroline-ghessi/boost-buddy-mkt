import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Target, Sparkles, Shield, Rocket } from "lucide-react";
import CampaignStepper from "@/components/campaign/CampaignStepper";
import TimelineItem from "@/components/campaign/TimelineItem";
import AssetPreviewCard from "@/components/campaign/AssetPreviewCard";

export default function CampaignProgress() {
  const { id: campaignId } = useParams<{ id: string }>();
  const [campaign, setCampaign] = useState<any>(null);
  const [tasks, setTasks] = useState<any[]>([]);
  const [assets, setAssets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [overallProgress, setOverallProgress] = useState(0);

  useEffect(() => {
    if (!campaignId) return;

    fetchCampaignData();
    
    // Subscribe to real-time updates
    const tasksChannel = supabase
      .channel("campaign-tasks")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "agent_tasks",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log("Task update:", payload);
          fetchTasks();
        }
      )
      .subscribe();

    const assetsChannel = supabase
      .channel("campaign-assets")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "campaign_assets",
          filter: `campaign_id=eq.${campaignId}`,
        },
        (payload) => {
          console.log("New asset:", payload);
          setAssets((prev) => [payload.new, ...prev]);
          toast.success(`Novo asset criado!`);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(tasksChannel);
      supabase.removeChannel(assetsChannel);
    };
  }, [campaignId]);

  const fetchCampaignData = async () => {
    try {
      await Promise.all([fetchCampaign(), fetchTasks(), fetchAssets()]);
    } catch (error) {
      console.error("Error fetching campaign data:", error);
      toast.error("Erro ao carregar dados da campanha");
    } finally {
      setLoading(false);
    }
  };

  const fetchCampaign = async () => {
    const { data, error } = await supabase
      .from("campaigns")
      .select("*")
      .eq("id", campaignId)
      .single();

    if (error) throw error;
    setCampaign(data);
  };

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("agent_tasks")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setTasks(data || []);
    calculateProgress(data || []);
  };

  const fetchAssets = async () => {
    const { data, error } = await supabase
      .from("campaign_assets")
      .select("*")
      .eq("campaign_id", campaignId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setAssets(data || []);
  };

  const calculateProgress = (taskList: any[]) => {
    const total = taskList.length;
    if (total === 0) {
      setOverallProgress(0);
      return;
    }

    const completed = taskList.filter((t) => t.status === "completed").length;
    const inProgress = taskList.filter((t) => t.status === "in_progress").length;

    const weightedProgress = (completed * 100 + inProgress * 50) / total;
    setOverallProgress(Math.round(weightedProgress));
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      in_progress: "default",
      completed: "outline",
      failed: "destructive",
    };

    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold">Campanha não encontrada</h2>
      </div>
    );
  }

  const phases = [
    { label: "Análise Estratégica", icon: Target, status: (overallProgress >= 25 ? "completed" : "active") as "completed" | "active" | "pending" },
    { label: "Criação de Conteúdo", icon: Sparkles, status: (overallProgress >= 50 ? "completed" : overallProgress >= 25 ? "active" : "pending") as "completed" | "active" | "pending" },
    { label: "Aprovação de Qualidade", icon: Shield, status: (overallProgress >= 75 ? "completed" : overallProgress >= 50 ? "active" : "pending") as "completed" | "active" | "pending" },
    { label: "Publicação", icon: Rocket, status: (overallProgress >= 100 ? "completed" : overallProgress >= 75 ? "active" : "pending") as "completed" | "active" | "pending" },
  ];

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4">
      {/* Header */}
      <Card className="mb-6 p-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold mb-2">{campaign.name}</h1>
            {getStatusBadge(campaign.status)}
          </div>
          <div className="text-right">
            <p className="text-4xl font-bold text-primary">{overallProgress}%</p>
            <p className="text-sm text-muted-foreground">Concluído</p>
          </div>
        </div>
        <Progress value={overallProgress} className="mt-4 h-2" />
      </Card>

      {/* Stepper */}
      <Card className="mb-6 p-6">
        <CampaignStepper phases={phases} />
      </Card>

      {/* Grid: Timeline + Assets */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Agent Activity Timeline */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">🐕 Atividade dos Agentes</h3>
          <ScrollArea className="h-[500px]">
            <div className="space-y-4">
              {tasks.map((task) => (
                <TimelineItem
                  key={task.id}
                  agentName={task.agent_id}
                  action={task.title}
                  status={task.status}
                  timestamp={task.created_at}
                />
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Nenhuma atividade ainda...
                </p>
              )}
            </div>
          </ScrollArea>
        </Card>

        {/* Assets Preview */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">📦 Assets Gerados</h3>
          <ScrollArea className="h-[500px]">
            <div className="grid grid-cols-2 gap-4">
              {assets.map((asset) => (
                <AssetPreviewCard key={asset.id} asset={asset} />
              ))}
              {assets.length === 0 && (
                <div className="col-span-2 text-center py-8">
                  <p className="text-sm text-muted-foreground">
                    Aguardando criação de assets...
                  </p>
                </div>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end mt-6">
        <Button variant="outline" disabled={campaign.status !== "executing"}>
          ⏸️ Pausar
        </Button>
        <Button disabled={overallProgress < 100}>👀 Revisar Assets</Button>
      </div>
    </div>
  );
}
