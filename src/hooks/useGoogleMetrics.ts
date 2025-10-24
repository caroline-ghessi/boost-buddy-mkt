import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface GoogleMetrics {
  analytics: {
    sessions: number;
    users: number;
    new_users: number;
    pageviews: number;
    conversions: number;
    conversion_rate: number;
  } | null;
  ads: {
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    ctr: number;
  } | null;
  isConnected: boolean;
  isLoading: boolean;
}

export const useGoogleMetrics = () => {
  const [metrics, setMetrics] = useState<GoogleMetrics>({
    analytics: null,
    ads: null,
    isConnected: false,
    isLoading: true,
  });
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('google_credentials')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!error && data) {
        setMetrics(prev => ({ ...prev, isConnected: true }));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking connection:', error);
      return false;
    }
  };

  const connectGoogle = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para conectar o Google.",
          variant: "destructive",
        });
        return;
      }

      const { data, error } = await supabase.functions.invoke('google-oauth-authorize', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      console.error('Error connecting Google:', error);
      toast({
        title: "Erro ao conectar",
        description: error.message || "Não foi possível iniciar a conexão com o Google.",
        variant: "destructive",
      });
    }
  };

  const syncMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setMetrics(prev => ({ ...prev, isLoading: true }));

      // Sync GA4 and Google Ads in parallel
      const [analyticsRes, adsRes] = await Promise.all([
        supabase.functions.invoke('google-analytics-sync', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {},
        }),
        supabase.functions.invoke('google-ads-sync', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {},
        }),
      ]);

      if (analyticsRes.error) throw analyticsRes.error;
      if (adsRes.error) throw adsRes.error;

      setMetrics(prev => ({
        ...prev,
        analytics: analyticsRes.data?.totals || null,
        ads: adsRes.data?.totals || null,
        isLoading: false,
      }));

      toast({
        title: "Métricas atualizadas",
        description: "Dados do Google Analytics e Google Ads sincronizados com sucesso.",
      });
    } catch (error: any) {
      console.error('Error syncing metrics:', error);
      setMetrics(prev => ({ ...prev, isLoading: false }));
      toast({
        title: "Erro ao sincronizar",
        description: error.message || "Não foi possível buscar as métricas do Google.",
        variant: "destructive",
      });
    }
  };

  const loadCachedMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 30 days of data aggregated
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const [analyticsData, adsData] = await Promise.all([
        supabase
          .from('google_analytics_metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateStr),
        supabase
          .from('google_ads_metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', dateStr),
      ]);

      if (analyticsData.data && analyticsData.data.length > 0) {
        const totals = analyticsData.data.reduce((acc, row) => ({
          sessions: acc.sessions + row.sessions,
          users: acc.users + row.users,
          new_users: acc.new_users + row.new_users,
          pageviews: acc.pageviews + row.pageviews,
          conversions: acc.conversions + row.conversions,
          conversion_rate: 0, // Will calculate after
        }), { sessions: 0, users: 0, new_users: 0, pageviews: 0, conversions: 0, conversion_rate: 0 });

        totals.conversion_rate = totals.sessions > 0
          ? (totals.conversions / totals.sessions) * 100
          : 0;

        setMetrics(prev => ({ ...prev, analytics: totals }));
      }

      if (adsData.data && adsData.data.length > 0) {
        const totals = adsData.data.reduce((acc, row) => ({
          impressions: acc.impressions + row.impressions,
          clicks: acc.clicks + row.clicks,
          cost: acc.cost + Number(row.cost),
          conversions: acc.conversions + Number(row.conversions),
          ctr: 0, // Will calculate after
        }), { impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0 });

        totals.ctr = totals.impressions > 0
          ? (totals.clicks / totals.impressions) * 100
          : 0;

        setMetrics(prev => ({ ...prev, ads: totals }));
      }
    } catch (error) {
      console.error('Error loading cached metrics:', error);
    }
  };

  useEffect(() => {
    const init = async () => {
      const connected = await checkConnection();
      if (connected) {
        await loadCachedMetrics();
      }
      setMetrics(prev => ({ ...prev, isLoading: false }));
    };
    init();
  }, []);

  return {
    ...metrics,
    connectGoogle,
    syncMetrics,
    refreshConnection: checkConnection,
  };
};
