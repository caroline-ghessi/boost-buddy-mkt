import { TrendingUp, Eye, DollarSign, MousePointerClick, Calendar, Download, Instagram, Linkedin, Youtube, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { CampaignTable } from "@/components/analytics/CampaignTable";
import { InsightsAgentSidebar } from "@/components/analytics/InsightsAgentSidebar";
import { useGoogleMetrics } from "@/hooks/useGoogleMetrics";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useSocialMediaMetrics } from "@/hooks/useSocialMediaMetrics";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const PerformanceDashboard = () => {
  const { analytics, ads: googleAds, isConnected, syncMetrics: syncGoogle } = useGoogleMetrics();
  const { ads: metaAds, syncMetrics: syncMeta } = useMetaMetrics();
  const { instagram, linkedin, youtube, isLoading: socialLoading, syncMetrics: syncSocial } = useSocialMediaMetrics();
  const { toast } = useToast();
  
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [roiData, setRoiData] = useState<any[]>([]);
  const [socialGrowthData, setSocialGrowthData] = useState<any[]>([]);
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSyncingSocial, setIsSyncingSocial] = useState(false);

  // Handlers para sincronização manual
  const handleMetaSync = async () => {
    setIsSyncingMeta(true);
    try {
      await syncMeta();
      toast({
        title: "Meta Ads sincronizado",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar Meta Ads",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSyncingMeta(false);
    }
  };

  const handleGoogleSync = async () => {
    setIsSyncingGoogle(true);
    try {
      await syncGoogle();
      toast({
        title: "Google Ads sincronizado",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar Google Ads",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSyncingGoogle(false);
    }
  };

  const handleSocialSync = async () => {
    setIsSyncingSocial(true);
    try {
      await syncSocial('instagram', 'seu_perfil');
      toast({
        title: "Redes sociais sincronizadas",
        description: "Dados atualizados com sucesso!",
      });
    } catch (error: any) {
      toast({
        title: "Erro ao sincronizar redes sociais",
        description: error.message || "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setIsSyncingSocial(false);
    }
  };

  // Auto-sync Meta Ads se não houver dados
  useEffect(() => {
    const autoSyncMetaAds = async () => {
      const hasAttemptedSync = sessionStorage.getItem('meta_ads_sync_attempted');
      
      if (!metaAds && !hasAttemptedSync && !isSyncingMeta) {
        console.log('Nenhum dado de Meta Ads encontrado, tentando sincronizar automaticamente...');
        sessionStorage.setItem('meta_ads_sync_attempted', 'true');
        
        try {
          await handleMetaSync();
        } catch (error) {
          console.error('Auto-sync falhou:', error);
        }
      }
    };
    
    autoSyncMetaAds();
  }, [metaAds]);

  // Carregar dados reais de campanhas para gráficos
  useEffect(() => {
    const loadHistoricalData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Últimos 6 meses de Google Ads
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const { data: googleData } = await supabase
          .from('google_ads_metrics')
          .select('date, conversions, cost, clicks, impressions')
          .eq('user_id', user.id)
          .gte('date', sixMonthsAgo.toISOString().split('T')[0])
          .order('date', { ascending: true });

        const { data: metaData } = await supabase
          .from('meta_ads_metrics')
          .select('date, conversions, cost, clicks, impressions')
          .eq('user_id', user.id)
          .gte('date', sixMonthsAgo.toISOString().split('T')[0])
          .order('date', { ascending: true });

        // Agregar por mês para gráfico de campanhas
        if (googleData && metaData) {
          const monthlyData = new Map();
          
          [...googleData, ...metaData].forEach(row => {
            const month = format(new Date(row.date), 'MMM');
            if (!monthlyData.has(month)) {
              monthlyData.set(month, 0);
            }
            monthlyData.set(month, monthlyData.get(month) + (row.conversions || 0));
          });

          const chartData = Array.from(monthlyData.entries()).map(([name, value]) => ({
            name,
            value: Math.round(value as number),
          }));

          setCampaignData(chartData);

          // Calcular ROI por canal
          const googleTotal = googleData.reduce((acc, row) => acc + (row.conversions || 0), 0);
          const googleCost = googleData.reduce((acc, row) => acc + parseFloat(String(row.cost || 0)), 0);
          const metaTotal = metaData.reduce((acc, row) => acc + (row.conversions || 0), 0);
          const metaCost = metaData.reduce((acc, row) => acc + parseFloat(String(row.cost || 0)), 0);

          setRoiData([
            { name: "Google Ads", value: googleCost > 0 ? parseFloat((googleTotal * 100 / googleCost).toFixed(1)) : 0 },
            { name: "Meta Ads", value: metaCost > 0 ? parseFloat((metaTotal * 100 / metaCost).toFixed(1)) : 0 },
          ]);
        }

        // Dados de crescimento social
        const { data: socialData } = await supabase
          .from('social_media_metrics')
          .select('date, platform, followers')
          .eq('user_id', user.id)
          .gte('date', sixMonthsAgo.toISOString().split('T')[0])
          .order('date', { ascending: true });

        if (socialData && socialData.length > 0) {
          const monthlyGrowth = new Map();
          
          socialData.forEach(row => {
            const month = format(new Date(row.date), 'MMM');
            if (!monthlyGrowth.has(month)) {
              monthlyGrowth.set(month, { instagram: 0, linkedin: 0, youtube: 0 });
            }
            const current = monthlyGrowth.get(month);
            current[row.platform] = row.followers || 0;
          });

          const growthData = Array.from(monthlyGrowth.entries()).map(([name, data]) => ({
            name,
            ...data,
          }));

          setSocialGrowthData(growthData);
        }
      } catch (error) {
        console.error('Error loading historical data:', error);
      }
    };

    loadHistoricalData();
  }, [isSyncingMeta, isSyncingGoogle, isSyncingSocial]);

  const trafficData = [
    { name: "Jan", organic: 420, paid: 380 },
    { name: "Fev", organic: 510, paid: 410 },
    { name: "Mar", organic: 580, paid: 470 },
    { name: "Abr", organic: 650, paid: 530 },
    { name: "Mai", organic: 720, paid: 480 },
    { name: "Jun", organic: 800, paid: 447 },
  ];

  const deviceData = [
    { name: "Mobile", value: 847, color: "#A1887F" },
    { name: "Desktop", value: 285, color: "#8D6E63" },
    { name: "Tablet", value: 115, color: "#6D4C41" },
  ];

  // Calculate metrics from real data
  const totalConversions = (googleAds?.conversions || 0) + (metaAds?.conversions || 0) + (analytics?.conversions || 0);
  const totalImpressions = (googleAds?.impressions || 0) + (metaAds?.impressions || 0);
  const totalCost = (googleAds?.cost || 0) + (metaAds?.cost || 0);
  const totalClicks = (googleAds?.clicks || 0) + (metaAds?.clicks || 0);

  const conversions = totalConversions > 0 ? totalConversions : 1247;
  const impressions = totalImpressions > 0 ? totalImpressions : 847000;
  const roas = totalCost > 0 ? (totalConversions * 100 / totalCost).toFixed(1) : "4.2";
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "3.8";

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* Main Content */}
      <section className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Top Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button 
              onClick={handleGoogleSync}
              disabled={isSyncingGoogle}
              variant="outline"
              size="sm"
              className="border-blue-500/30 hover:bg-blue-500/10"
            >
              {isSyncingGoogle ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Google Ads
            </Button>
            <Button 
              onClick={handleMetaSync}
              disabled={isSyncingMeta}
              variant="outline"
              size="sm"
              className="border-purple-500/30 hover:bg-purple-500/10"
            >
              {isSyncingMeta ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Meta Ads
            </Button>
            <Button 
              onClick={handleSocialSync}
              disabled={isSyncingSocial}
              variant="outline"
              size="sm"
              className="border-green-500/30 hover:bg-green-500/10"
            >
              {isSyncingSocial ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Redes Sociais
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button className="bg-[#A1887F] hover:bg-[#8D6E63]">
              <Calendar className="w-4 h-4 mr-2" />
              Últimos 30 dias
            </Button>
            <Button variant="outline" className="bg-[#2a2a2a] border-gray-600 hover:bg-[#333333]">
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* Metric Cards - Ads */}
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

        {/* Social Media Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <MetricCard
            title="Instagram - Seguidores"
            value={instagram?.followers.toLocaleString('pt-BR') || "Conectar"}
            change={instagram?.growth ? `+${instagram.growth}` : "N/A"}
            icon={<Instagram className="w-6 h-6" />}
            color="purple"
            progress={instagram ? 85 : 0}
          />
          <MetricCard
            title="LinkedIn - Seguidores"
            value={linkedin?.followers.toLocaleString('pt-BR') || "Conectar"}
            change={linkedin?.growth ? `+${linkedin.growth}` : "N/A"}
            icon={<Linkedin className="w-6 h-6" />}
            color="blue"
            progress={linkedin ? 72 : 0}
          />
          <MetricCard
            title="YouTube - Inscritos"
            value={youtube?.followers.toLocaleString('pt-BR') || "Conectar"}
            change={youtube?.growth ? `+${youtube.growth}` : "N/A"}
            icon={<Youtube className="w-6 h-6" />}
            color="yellow"
            progress={youtube ? 68 : 0}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartCard
            title="Performance das Campanhas"
            subtitle="Conversões mensais"
            type="line"
            data={campaignData.length > 0 ? campaignData : [{ name: "Sem dados", value: 0 }]}
            actions={
              <div className="flex gap-2">
                <button className="px-3 py-1 bg-[#A1887F] text-white text-xs rounded-full">
                  Todas
                </button>
              </div>
            }
          />
          <ChartCard
            title="Crescimento de Seguidores"
            subtitle="Redes sociais"
            type="area"
            data={socialGrowthData.length > 0 ? socialGrowthData : trafficData}
          />
          <ChartCard
            title="ROI por Canal"
            subtitle="Últimos 6 meses"
            type="bar"
            data={roiData.length > 0 ? roiData : [{ name: "Google Ads", value: 5.2 }, { name: "Meta Ads", value: 4.8 }]}
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
