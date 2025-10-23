import { Card } from "@/components/ui/card";
import { TrendingUp, TrendingDown, DollarSign, Target, Users, Zap } from "lucide-react";

interface MetricCard {
  title: string;
  value: string;
  change: number;
  icon: any;
  trend: "up" | "down";
}

const metrics: MetricCard[] = [
  {
    title: "Campanhas Ativas",
    value: "12",
    change: 8.2,
    icon: Target,
    trend: "up",
  },
  {
    title: "ROI Médio",
    value: "347%",
    change: 12.5,
    icon: DollarSign,
    trend: "up",
  },
  {
    title: "Alcance Total",
    value: "2.4M",
    change: -3.2,
    icon: Users,
    trend: "down",
  },
  {
    title: "Taxa de Conversão",
    value: "4.8%",
    change: 15.3,
    icon: Zap,
    trend: "up",
  },
];

const recentCampaigns = [
  {
    id: "1",
    name: "Lançamento Produto X",
    status: "Em andamento",
    progress: 75,
    roi: "425%",
    agents: 8,
  },
  {
    id: "2",
    name: "Black Friday 2024",
    status: "Planejamento",
    progress: 30,
    roi: "Estimado 380%",
    agents: 12,
  },
  {
    id: "3",
    name: "Rebranding Completo",
    status: "Em andamento",
    progress: 50,
    roi: "N/A",
    agents: 10,
  },
];

const PerformanceDashboard = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gradient mb-2">Performance Dashboard</h2>
        <p className="text-muted-foreground">
          Métricas em tempo real das campanhas executadas pelos agentes
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon;
          const TrendIcon = metric.trend === "up" ? TrendingUp : TrendingDown;
          
          return (
            <Card key={metric.title} className="glass-panel p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{metric.title}</p>
                  <h3 className="text-3xl font-bold">{metric.value}</h3>
                  <div className={`flex items-center gap-1 mt-2 text-sm ${
                    metric.trend === "up" ? "text-green-500" : "text-red-500"
                  }`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{Math.abs(metric.change)}%</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Recent Campaigns */}
      <Card className="glass-panel p-6">
        <h3 className="text-xl font-semibold mb-4">Campanhas Recentes</h3>
        <div className="space-y-4">
          {recentCampaigns.map((campaign) => (
            <div
              key={campaign.id}
              className="p-4 rounded-xl border border-border/50 bg-background/50 hover:bg-background/80 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-semibold">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.status}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{campaign.roi}</p>
                  <p className="text-xs text-muted-foreground">{campaign.agents} agentes</p>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Progresso</span>
                  <span>{campaign.progress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">Agentes Mais Ativos</h3>
          <div className="space-y-3">
            {[
              { name: "Ricardo Mendes", tasks: 45, efficiency: 98 },
              { name: "Ana Costa", tasks: 38, efficiency: 95 },
              { name: "Rafael Torres", tasks: 32, efficiency: 92 },
              { name: "Larissa Martins", tasks: 28, efficiency: 96 },
            ].map((agent, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">{agent.name}</p>
                    <p className="text-xs text-muted-foreground">{agent.tasks} tarefas</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-primary">{agent.efficiency}%</p>
                  <p className="text-xs text-muted-foreground">eficiência</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="glass-panel p-6">
          <h3 className="text-xl font-semibold mb-4">Integrações Ativas</h3>
          <div className="space-y-3">
            {[
              { name: "Google Ads API", status: "Conectado", calls: "1.2k" },
              { name: "Meta Ads API", status: "Conectado", calls: "980" },
              { name: "DALL-E 3", status: "Conectado", calls: "450" },
              { name: "Runway Gen-3", status: "Conectado", calls: "125" },
            ].map((integration, i) => (
              <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <div>
                    <p className="font-medium text-sm">{integration.name}</p>
                    <p className="text-xs text-muted-foreground">{integration.status}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{integration.calls}</p>
                  <p className="text-xs text-muted-foreground">chamadas</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PerformanceDashboard;
