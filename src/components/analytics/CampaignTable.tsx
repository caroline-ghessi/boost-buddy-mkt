import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Buscar campanhas do banco
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('id, name, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);

        if (!campaignsData || campaignsData.length === 0) {
          setCampaigns([]);
          setIsLoading(false);
          return;
        }

        // Buscar métricas de Google Ads e Meta Ads para cada campanha
        const campaignsWithMetrics = await Promise.all(
          campaignsData.map(async (campaign) => {
            // Google Ads metrics
            const { data: googleMetrics } = await supabase
              .from('google_ads_metrics')
              .select('impressions, clicks, conversions, cost')
              .eq('user_id', user.id)
              .limit(100);

            // Meta Ads metrics
            const { data: metaMetrics } = await supabase
              .from('meta_ads_metrics')
              .select('impressions, clicks, conversions, cost')
              .eq('user_id', user.id)
              .limit(100);

            // Agregar métricas
            const allMetrics = [...(googleMetrics || []), ...(metaMetrics || [])];
            
            const totalImpressions = allMetrics.reduce((acc, m) => acc + (m.impressions || 0), 0);
            const totalClicks = allMetrics.reduce((acc, m) => acc + (m.clicks || 0), 0);
            const totalConversions = allMetrics.reduce((acc, m) => acc + (m.conversions || 0), 0);
            const totalCost = allMetrics.reduce((acc, m) => acc + parseFloat(String(m.cost || 0)), 0);

            const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0.00";
            const roas = totalCost > 0 ? (totalConversions * 100 / totalCost).toFixed(1) : "0.0";

            return {
              name: campaign.name,
              impressions: totalImpressions > 1000 ? `${(totalImpressions / 1000).toFixed(0)}K` : totalImpressions.toString(),
              clicks: totalClicks.toLocaleString('pt-BR'),
              ctr: `${ctr}%`,
              conversions: Math.round(totalConversions),
              roas: `${roas}x`,
              status: campaign.status,
            };
          })
        );

        setCampaigns(campaignsWithMetrics);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCampaigns();
  }, []);
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
