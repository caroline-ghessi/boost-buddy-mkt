import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAnalyticsDate } from "@/contexts/AnalyticsDateContext";

interface Campaign {
  name: string;
  impressions: string;
  clicks: string;
  ctr: string;
  conversions: number;
  roas: string;
  status: string;
}

export function CampaignTable() {
  const { dateRange } = useAnalyticsDate();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      if (!dateRange?.from || !dateRange?.to) return;

      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const startDate = dateRange.from.toISOString().split('T')[0];
        const endDate = dateRange.to.toISOString().split('T')[0];

        // Buscar todas as métricas de Google Ads
        const { data: googleMetrics } = await supabase
          .from('google_ads_metrics')
          .select('campaign_name, impressions, clicks, conversions, cost')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate);

        // Buscar todas as métricas de Meta Ads
        const { data: metaMetrics } = await supabase
          .from('meta_ads_metrics')
          .select('campaign_name, impressions, clicks, conversions, cost')
          .eq('user_id', user.id)
          .gte('date', startDate)
          .lte('date', endDate);

        // Agrupar métricas por campaign_name
        const campaignMap = new Map<string, {
          name: string;
          impressions: number;
          clicks: number;
          conversions: number;
          cost: number;
          status: string;
        }>();

        // Processar todas as métricas
        [...(googleMetrics || []), ...(metaMetrics || [])].forEach(metric => {
          if (!metric.campaign_name) return;

          if (!campaignMap.has(metric.campaign_name)) {
            campaignMap.set(metric.campaign_name, {
              name: metric.campaign_name,
              impressions: 0,
              clicks: 0,
              conversions: 0,
              cost: 0,
              status: 'active' // Assumir ativa se tem dados recentes
            });
          }

          const campaign = campaignMap.get(metric.campaign_name)!;
          campaign.impressions += Number(metric.impressions || 0);
          campaign.clicks += Number(metric.clicks || 0);
          campaign.conversions += Number(metric.conversions || 0);
          campaign.cost += parseFloat(String(metric.cost || 0));
        });

        // Calcular métricas derivadas e formatar
        const campaignsWithMetrics = Array.from(campaignMap.values()).map(c => {
          const ctr = c.impressions > 0 ? ((c.clicks / c.impressions) * 100).toFixed(2) : "0.00";
          const roas = c.cost > 0 ? (c.conversions * 100 / c.cost).toFixed(1) : "0.0";

          return {
            name: c.name,
            impressions: c.impressions > 1000 ? `${(c.impressions / 1000).toFixed(0)}K` : c.impressions.toString(),
            clicks: c.clicks.toLocaleString('pt-BR'),
            ctr: `${ctr}%`,
            conversions: Math.round(c.conversions),
            roas: `${roas}x`,
            status: c.status,
          };
        });

        setCampaigns(campaignsWithMetrics);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, [dateRange]);
  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Análise Detalhada por Campanha</h3>
        <Button className="bg-[#A1887F] hover:bg-[#8D6E63]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Análise
        </Button>
      </div>
      
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-700">
              <TableHead className="text-gray-400">Campanha</TableHead>
              <TableHead className="text-gray-400">Impressões</TableHead>
              <TableHead className="text-gray-400">Cliques</TableHead>
              <TableHead className="text-gray-400">CTR</TableHead>
              <TableHead className="text-gray-400">Conversões</TableHead>
              <TableHead className="text-gray-400">ROAS</TableHead>
              <TableHead className="text-gray-400">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Carregando campanhas...
                </TableCell>
              </TableRow>
            ) : campaigns.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-gray-400 py-8">
                  Nenhuma campanha encontrada. Crie sua primeira campanha!
                </TableCell>
              </TableRow>
            ) : (
              campaigns.map((campaign, index) => (
                <TableRow key={`${campaign.name}-${index}`} className="border-b border-gray-700/50">
                  <TableCell className="text-white">{campaign.name}</TableCell>
                  <TableCell className="text-white">{campaign.impressions}</TableCell>
                  <TableCell className="text-white">{campaign.clicks}</TableCell>
                  <TableCell className="text-white">{campaign.ctr}</TableCell>
                  <TableCell className="text-white">{campaign.conversions}</TableCell>
                  <TableCell className="text-green-400">{campaign.roas}</TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      campaign.status === "active" || campaign.status === "executing"
                        ? "bg-green-500/20 text-green-400" 
                        : "bg-yellow-500/20 text-yellow-400"
                    }`}>
                      {campaign.status === "active" || campaign.status === "executing" ? "Ativa" : campaign.status === "draft" ? "Rascunho" : "Pausada"}
                    </span>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
