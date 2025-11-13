import { TrendingUp, Eye, DollarSign, MousePointerClick, Download, Instagram, Linkedin, Youtube, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MetricCard } from "@/components/analytics/MetricCard";
import { ChartCard } from "@/components/analytics/ChartCard";
import { CampaignTable } from "@/components/analytics/CampaignTable";
import { InsightsAgentSidebar } from "@/components/analytics/InsightsAgentSidebar";
import { DateRangePicker } from "@/components/analytics/DateRangePicker";
import { EmptyStateCard } from "@/components/analytics/EmptyStateCard";
import { useGoogleMetrics } from "@/hooks/useGoogleMetrics";
import { useMetaMetrics } from "@/hooks/useMetaMetrics";
import { useSocialMediaMetrics } from "@/hooks/useSocialMediaMetrics";
import { useAnalyticsDate } from "@/contexts/AnalyticsDateContext";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { calculateMetricChange, formatNumber } from "@/lib/analyticsCalculations";

const PerformanceDashboard = () => {
  const { dateRange, setDateRange } = useAnalyticsDate();
  const { analytics, ads: googleAds, isConnected, connectGoogle, syncMetrics: syncGoogle, loadCachedMetrics: loadGoogle } = useGoogleMetrics();
  const { ads: metaAds, syncMetrics: syncMeta, refreshMetrics: refreshMeta } = useMetaMetrics();
  const { instagram, linkedin, youtube, isLoading: socialLoading, syncMetrics: syncSocial, refreshMetrics: refreshSocial } = useSocialMediaMetrics();
  const { toast } = useToast();
  
  const [campaignData, setCampaignData] = useState<any[]>([]);
  const [roiData, setRoiData] = useState<any[]>([]);
  const [socialGrowthData, setSocialGrowthData] = useState<any[]>([]);
  const [deviceData, setDeviceData] = useState<any[]>([]);
  const [isSyncingMeta, setIsSyncingMeta] = useState(false);
  const [isSyncingGoogle, setIsSyncingGoogle] = useState(false);
  const [isSyncingSocial, setIsSyncingSocial] = useState(false);
  
  // States for previous period metrics (for % change calculation)
  const [prevPeriodMetrics, setPrevPeriodMetrics] = useState<{
    conversions: number;
    impressions: number;
    cost: number;
    clicks: number;
  }>({ conversions: 0, impressions: 0, cost: 0, clicks: 0 });

  // Reload metrics when date range changes
  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      loadGoogle(dateRange.from, dateRange.to);
      refreshMeta(dateRange.from, dateRange.to);
      refreshSocial(dateRange.from, dateRange.to);
      loadHistoricalData();
      loadPreviousPeriodMetrics();
    }
  }, [dateRange]);

  const loadPreviousPeriodMetrics = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Calculate previous period (same duration)
      const periodDuration = dateRange.to.getTime() - dateRange.from.getTime();
      const prevEnd = new Date(dateRange.from.getTime() - 1);
      const prevStart = new Date(prevEnd.getTime() - periodDuration);

      const prevStartStr = prevStart.toISOString().split('T')[0];
      const prevEndStr = prevEnd.toISOString().split('T')[0];

      const [googleData, metaData] = await Promise.all([
        supabase
          .from('google_ads_metrics')
          .select('conversions, impressions, cost, clicks')
          .eq('user_id', user.id)
          .gte('date', prevStartStr)
          .lte('date', prevEndStr),
        supabase
          .from('meta_ads_metrics')
          .select('conversions, impressions, cost, clicks')
          .eq('user_id', user.id)
          .gte('date', prevStartStr)
          .lte('date', prevEndStr),
      ]);

      const totals = {
        conversions: 0,
        impressions: 0,
        cost: 0,
        clicks: 0,
      };

      [...(googleData.data || []), ...(metaData.data || [])].forEach(row => {
        totals.conversions += Number(row.conversions || 0);
        totals.impressions += Number(row.impressions || 0);
        totals.cost += Number(row.cost || 0);
        totals.clicks += Number(row.clicks || 0);
      });

      setPrevPeriodMetrics(totals);
    } catch (error) {
      console.error('Error loading previous period metrics:', error);
    }
  };

  const handleMetaSync = async () => {
    setIsSyncingMeta(true);
    try {
      await syncMeta();
      await refreshMeta(dateRange?.from, dateRange?.to);
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

  const handleGoogleConnect = async () => {
    console.log('[PerformanceDashboard] Initiating OAuth flow...');
    toast({
      title: "Conectando ao Google",
      description: "Você será redirecionado para autorizar o acesso.",
    });
    await connectGoogle();
  };

  const handleGoogleUpdate = async () => {
    setIsSyncingGoogle(true);
    try {
      await syncGoogle();
      toast({
        title: "Google Ads atualizado",
        description: "Dados sincronizados com sucesso!",
      });
    } catch (error: any) {
      console.error('[PerformanceDashboard] Google sync error:', error);
      
      if (error.message === 'TOKEN_EXPIRED') {
        toast({
          title: "Token expirado",
          description: "Use o botão 'Reconectar Google' para autorizar novamente.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Erro ao sincronizar",
          description: error.message || "Erro desconhecido",
          variant: "destructive",
        });
      }
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

  const loadHistoricalData = async () => {
    if (!dateRange?.from || !dateRange?.to) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const startStr = dateRange.from.toISOString().split('T')[0];
      const endStr = dateRange.to.toISOString().split('T')[0];

      const [googleData, metaData, socialData, analyticsData] = await Promise.all([
        supabase
          .from('google_ads_metrics')
          .select('date, conversions, cost, clicks, impressions')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date', { ascending: true }),
        supabase
          .from('meta_ads_metrics')
          .select('date, conversions, cost, clicks, impressions')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date', { ascending: true }),
        supabase
          .from('social_media_metrics')
          .select('date, platform, followers')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date', { ascending: true }),
        supabase
          .from('google_analytics_metrics')
          .select('metadata')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr)
          .order('date', { ascending: true })
      ]);

      // Campaign conversions chart
      if ((googleData.data || metaData.data) && (googleData.data?.length || metaData.data?.length)) {
        const monthlyData = new Map();
        
        [...(googleData.data || []), ...(metaData.data || [])].forEach(row => {
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

        // ROI by channel
        const googleTotal = (googleData.data || []).reduce((acc, row) => acc + (row.conversions || 0), 0);
        const googleCost = (googleData.data || []).reduce((acc, row) => acc + parseFloat(String(row.cost || 0)), 0);
        const metaTotal = (metaData.data || []).reduce((acc, row) => acc + (row.conversions || 0), 0);
        const metaCost = (metaData.data || []).reduce((acc, row) => acc + parseFloat(String(row.cost || 0)), 0);

        const roiChartData = [];
        if (googleCost > 0) {
          roiChartData.push({ name: "Google Ads", value: parseFloat((googleTotal * 100 / googleCost).toFixed(1)) });
        }
        if (metaCost > 0) {
          roiChartData.push({ name: "Meta Ads", value: parseFloat((metaTotal * 100 / metaCost).toFixed(1)) });
        }

        setRoiData(roiChartData);
      }

      // Social growth chart
      if (socialData.data && socialData.data.length > 0) {
        const monthlyGrowth = new Map();
        
        socialData.data.forEach(row => {
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

      // Device data from Google Analytics metadata
      if (analyticsData.data && analyticsData.data.length > 0) {
        const deviceTotals = { mobile: 0, desktop: 0, tablet: 0 };
        
        analyticsData.data.forEach(row => {
          if (row.metadata && typeof row.metadata === 'object') {
            const meta = row.metadata as any;
            if (meta.device_category) {
              const device = meta.device_category.toLowerCase();
              if (device === 'mobile') deviceTotals.mobile++;
              else if (device === 'desktop') deviceTotals.desktop++;
              else if (device === 'tablet') deviceTotals.tablet++;
            }
          }
        });

        const total = deviceTotals.mobile + deviceTotals.desktop + deviceTotals.tablet;
        if (total > 0) {
          setDeviceData([
            { name: "Mobile", value: deviceTotals.mobile, color: "hsl(var(--chart-1))" },
            { name: "Desktop", value: deviceTotals.desktop, color: "hsl(var(--chart-2))" },
            { name: "Tablet", value: deviceTotals.tablet, color: "hsl(var(--chart-3))" },
          ]);
        }
      }
    } catch (error) {
      console.error('Error loading historical data:', error);
    }
  };

  // Calculate current metrics
  const totalConversions = (googleAds?.conversions || 0) + (metaAds?.conversions || 0) + (analytics?.conversions || 0);
  const totalImpressions = (googleAds?.impressions || 0) + (metaAds?.impressions || 0);
  const totalCost = (googleAds?.cost || 0) + (metaAds?.cost || 0);
  const totalClicks = (googleAds?.clicks || 0) + (metaAds?.clicks || 0);

  // Calculate percentage changes
  const conversionsChange = calculateMetricChange(totalConversions, prevPeriodMetrics.conversions);
  const impressionsChange = calculateMetricChange(totalImpressions, prevPeriodMetrics.impressions);
  const roasValue = totalCost > 0 ? (totalConversions * 100 / totalCost) : 0;
  const prevRoas = prevPeriodMetrics.cost > 0 ? (prevPeriodMetrics.conversions * 100 / prevPeriodMetrics.cost) : 0;
  const roasChange = calculateMetricChange(roasValue, prevRoas);
  
  const ctrValue = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100) : 0;
  const prevCtr = prevPeriodMetrics.impressions > 0 ? ((prevPeriodMetrics.clicks / prevPeriodMetrics.impressions) * 100) : 0;
  const ctrChange = calculateMetricChange(ctrValue, prevCtr);

  const hasAnyData = totalConversions > 0 || totalImpressions > 0;

  const handleExport = () => {
    toast({
      title: "Exportando dados",
      description: "A funcionalidade de exportação será implementada em breve.",
    });
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      {/* Main Content */}
      <section className="flex-1 flex flex-col gap-6 overflow-y-auto">
        {/* Top Actions */}
        <div className="flex justify-between items-center">
          <div className="flex gap-2 items-center">
            {!isConnected && (
              <Button 
                onClick={handleGoogleConnect}
                disabled={isSyncingGoogle}
                variant="outline"
                size="sm"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reconectar Google
              </Button>
            )}
            
            {isConnected && (
              <Button 
                onClick={handleGoogleUpdate}
                disabled={isSyncingGoogle}
                variant="outline"
                size="sm"
              >
                {isSyncingGoogle ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                Atualizar Google
              </Button>
            )}
            <Button 
              onClick={handleMetaSync}
              disabled={isSyncingMeta}
              variant="outline"
              size="sm"
            >
              {isSyncingMeta ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Meta Ads
            </Button>
            <Button 
              onClick={handleSocialSync}
              disabled={isSyncingSocial}
              variant="outline"
              size="sm"
            >
              {isSyncingSocial ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              Redes Sociais
            </Button>
          </div>
          
          <div className="flex gap-2">
            <DateRangePicker dateRange={dateRange} onDateRangeChange={setDateRange} />
            <Button variant="outline" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {!hasAnyData ? (
          <EmptyStateCard
            title="Nenhum dado disponível"
            description="Conecte suas contas de Google Ads e Meta Ads para visualizar suas métricas de performance."
            actionLabel="Conectar Google Ads"
            onAction={handleGoogleConnect}
          />
        ) : (
          <>
            {/* Metric Cards - Ads */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Conversões"
                value={totalConversions > 0 ? totalConversions.toLocaleString('pt-BR') : "0"}
                change={conversionsChange.value}
                icon={<TrendingUp className="w-6 h-6" />}
                color="green"
                progress={totalConversions > 0 ? 78 : 0}
              />
              <MetricCard
                title="Impressões"
                value={totalImpressions > 0 ? formatNumber(totalImpressions) : "0"}
                change={impressionsChange.value}
                icon={<Eye className="w-6 h-6" />}
                color="blue"
                progress={totalImpressions > 0 ? 65 : 0}
              />
              <MetricCard
                title="ROAS"
                value={roasValue > 0 ? `${roasValue.toFixed(1)}x` : "0x"}
                change={roasChange.value}
                icon={<DollarSign className="w-6 h-6" />}
                color="yellow"
                progress={roasValue > 0 ? 84 : 0}
              />
              <MetricCard
                title="CTR"
                value={ctrValue > 0 ? `${ctrValue.toFixed(2)}%` : "0%"}
                change={ctrChange.value}
                icon={<MousePointerClick className="w-6 h-6" />}
                color="purple"
                progress={ctrValue > 0 ? 76 : 0}
              />
            </div>

            {/* Social Media Metrics */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <MetricCard
                title="Instagram - Seguidores"
                value={instagram?.followers ? instagram.followers.toLocaleString('pt-BR') : "—"}
                change={instagram?.growth ? `+${instagram.growth}` : "—"}
                icon={<Instagram className="w-6 h-6" />}
                color="purple"
                progress={instagram ? 85 : 0}
              />
              <MetricCard
                title="LinkedIn - Seguidores"
                value={linkedin?.followers ? linkedin.followers.toLocaleString('pt-BR') : "—"}
                change={linkedin?.growth ? `+${linkedin.growth}` : "—"}
                icon={<Linkedin className="w-6 h-6" />}
                color="blue"
                progress={linkedin ? 72 : 0}
              />
              <MetricCard
                title="YouTube - Inscritos"
                value={youtube?.followers ? youtube.followers.toLocaleString('pt-BR') : "—"}
                change={youtube?.growth ? `+${youtube.growth}` : "—"}
                icon={<Youtube className="w-6 h-6" />}
                color="yellow"
                progress={youtube ? 68 : 0}
              />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartCard
                title="Performance das Campanhas"
                subtitle="Conversões no período"
                type="line"
                data={campaignData.length > 0 ? campaignData : []}
              />
              <ChartCard
                title="Crescimento de Seguidores"
                subtitle="Redes sociais"
                type="area"
                data={socialGrowthData.length > 0 ? socialGrowthData : []}
              />
              <ChartCard
                title="ROI por Canal"
                subtitle={`${dateRange?.from && dateRange?.to ? format(dateRange.from, 'dd/MM') + ' - ' + format(dateRange.to, 'dd/MM') : 'Período selecionado'}`}
                type="bar"
                data={roiData.length > 0 ? roiData : []}
              />
              <ChartCard
                title="Conversões por Dispositivo"
                subtitle={`Total: ${totalConversions.toLocaleString('pt-BR')}`}
                type="pie"
                data={deviceData.length > 0 ? deviceData : []}
              />
            </div>

            {/* Campaign Table */}
            <CampaignTable />
          </>
        )}
      </section>

      {/* Insights Sidebar */}
      <InsightsAgentSidebar />
    </div>
  );
};

export default PerformanceDashboard;
