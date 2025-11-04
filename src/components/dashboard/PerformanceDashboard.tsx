import { TrendingUp, Eye, DollarSign, MousePointerClick, Calendar, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { CampaignTable } from "@/components/analytics/CampaignTable";
import { InsightsAgentSidebar } from "@/components/analytics/InsightsAgentSidebar";
import { useGoogleMetrics } from "@/hooks/useGoogleMetrics";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";

const PerformanceDashboard = () => {
  const { analytics, ads, isConnected } = useGoogleMetrics();
  const { ads: metaAds } = useMetaMetrics();

  // Mock data for charts
  const campaignData = [
    { name: "Jan", value: 850 },
    { name: "Fev", value: 920 },
    { name: "Mar", value: 1050 },
    { name: "Abr", value: 1180 },
    { name: "Mai", value: 1100 },
    { name: "Jun", value: 1247 },
  ];

  const trafficData = [
    { name: "Jan", organic: 420, paid: 380 },
    { name: "Fev", organic: 510, paid: 410 },
    { name: "Mar", organic: 580, paid: 470 },
    { name: "Abr", organic: 650, paid: 530 },
    { name: "Mai", organic: 720, paid: 480 },
    { name: "Jun", organic: 800, paid: 447 },
  ];

  const roiData = [
    { name: "Google Ads", value: 5.2 },
    { name: "Meta Ads", value: 4.8 },
    { name: "LinkedIn", value: 3.9 },
    { name: "Twitter", value: 3.2 },
  ];

  const deviceData = [
    { name: "Mobile", value: 847, color: "#A1887F" },
    { name: "Desktop", value: 285, color: "#8D6E63" },
    { name: "Tablet", value: 115, color: "#6D4C41" },
  ];

  // Calculate metrics from real data or use mock
  const conversions = isConnected && analytics && ads 
    ? analytics.conversions + ads.conversions 
    : 1247;
  
  const impressions = isConnected && ads 
    ? ads.impressions 
    : 847000;

  const roas = isConnected && ads && ads.cost > 0
    ? (ads.conversions * 100 / ads.cost).toFixed(1)
    : "4.2";

  const ctr = isConnected && ads 
    ? ads.ctr.toFixed(2)
    : "3.8";

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* Main Content */}
      <section className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Top Actions */}
        <div className="flex justify-end gap-2">
          <Button className="bg-[#A1887F] hover:bg-[#8D6E63]">
            <Calendar className="w-4 h-4 mr-2" />
            Últimos 30 dias
          </Button>
          <Button variant="outline" className="bg-[#2a2a2a] border-gray-600 hover:bg-[#333333]">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>

        {/* Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            title="Conversões"
            value={conversions.toLocaleString('pt-BR')}
            change="+23%"
            icon={<TrendingUp className="w-6 h-6" />}
            color="green"
            progress={78}
          />
          <MetricCard
            title="Impressões"
            value={`${(impressions / 1000).toFixed(0)}K`}
            change="+12%"
            icon={<Eye className="w-6 h-6" />}
            color="blue"
            progress={65}
          />
          <MetricCard
            title="ROAS"
            value={`${roas}x`}
            change="+8%"
            icon={<DollarSign className="w-6 h-6" />}
            color="yellow"
            progress={84}
          />
          <MetricCard
            title="CTR"
            value={`${ctr}%`}
            change="+15%"
            icon={<MousePointerClick className="w-6 h-6" />}
            color="purple"
            progress={76}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Performance das Campanhas"
            type="line"
            data={campaignData}
            actions={
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-[#A1887F] text-white text-xs rounded-full">
                  Google Ads
                </button>
                <button className="px-3 py-1 bg-[#2a2a2a] text-gray-300 text-xs rounded-full hover:bg-[#333333]">
                  Meta Ads
                </button>
              </div>
            }
          />
          <ChartCard
            title="Tráfego Orgânico vs Pago"
            type="area"
            data={trafficData}
          />
          <ChartCard
            title="ROI por Canal"
            subtitle="+18% este mês"
            type="bar"
            data={roiData}
          />
          <ChartCard
            title="Conversões por Dispositivo"
            subtitle="Total: 1,247"
            type="pie"
            data={deviceData}
          />
        </div>

        {/* Campaign Table */}
        <CampaignTable />
      </section>

      {/* Insights Sidebar */}
      <InsightsAgentSidebar />
    </div>
  );
};

export default PerformanceDashboard;
