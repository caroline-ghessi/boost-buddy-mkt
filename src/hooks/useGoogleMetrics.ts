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

  const handleExpiredToken = async () => {
    try {
      console.log('[useGoogleMetrics] Cleaning up expired token...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('google_credentials')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('[useGoogleMetrics] Error deleting expired credentials:', error);
      } else {
        console.log('[useGoogleMetrics] Expired credentials removed successfully');
      }

      setMetrics(prev => ({ ...prev, isConnected: false }));
    } catch (error) {
      console.error('[useGoogleMetrics] Error in handleExpiredToken:', error);
    }
  };

  const connectGoogle = async () => {
    try {
      console.log('[useGoogleMetrics] Starting Google connection...');
      
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('[useGoogleMetrics] No active session found');
        toast({
          title: "Erro de autenticação",
          description: "Você precisa estar logado para conectar o Google.",
          variant: "destructive",
        });
        return;
      }

      console.log('[useGoogleMetrics] Invoking google-oauth-authorize edge function...');
      
      const { data, error } = await supabase.functions.invoke('google-oauth-authorize', {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      console.log('[useGoogleMetrics] Edge function response:', { data, error });

      if (error) {
        console.error('[useGoogleMetrics] Edge function error:', error);
        throw error;
      }
      
      if (data?.error) {
        console.error('[useGoogleMetrics] Edge function returned error:', data.error);
        throw new Error(data.error);
      }
      
      if (data?.url) {
        console.log('[useGoogleMetrics] Redirecting to OAuth URL...');
        window.location.href = data.url;
      } else {
        console.error('[useGoogleMetrics] No URL returned from edge function');
        throw new Error('Edge function did not return authorization URL');
      }
    } catch (error: any) {
      console.error('[useGoogleMetrics] Connection error:', error);
      console.error('[useGoogleMetrics] Error details:', {
        message: error.message,
        stack: error.stack,
        full: error
      });
      
      toast({
        title: "Erro ao conectar",
        description: error.message || "Não foi possível iniciar a conexão com o Google. Verifique o console para mais detalhes.",
        variant: "destructive",
      });
    }
  };

  const syncMetrics = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      setMetrics(prev => ({ ...prev, isLoading: true }));

      let gaSuccess = false;
      let adsSuccess = false;
      let hasTokenError = false;

      // Sync Google Analytics
      try {
        const analyticsRes = await supabase.functions.invoke('google-analytics-sync', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {},
        });

        if (analyticsRes.error) {
          const errorMsg = JSON.stringify(analyticsRes.error);
          if (errorMsg.includes('Failed to refresh access token')) {
            console.log('[useGoogleMetrics] Detected expired token in Analytics sync');
            hasTokenError = true;
          }
        } else if (analyticsRes.data) {
          setMetrics(prev => ({
            ...prev,
            analytics: analyticsRes.data?.totals || null,
          }));
          gaSuccess = true;
        }
      } catch (gaError: any) {
        console.error('Google Analytics sync error:', gaError);
        if (gaError.message?.includes('Failed to refresh access token')) {
          hasTokenError = true;
        }
      }

      // Sync Google Ads (optional - may not be enabled)
      try {
        const adsRes = await supabase.functions.invoke('google-ads-sync', {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          body: {},
        });

        if (adsRes.error) {
          const errorMsg = JSON.stringify(adsRes.error);
          if (errorMsg.includes('Failed to refresh access token')) {
            console.log('[useGoogleMetrics] Detected expired token in Ads sync');
            hasTokenError = true;
          }
        } else if (adsRes.data) {
          setMetrics(prev => ({
            ...prev,
            ads: adsRes.data?.totals || null,
          }));
          adsSuccess = true;
        }
      } catch (adsError: any) {
        console.error('Google Ads sync error (optional):', adsError);
        if (adsError.message?.includes('Failed to refresh access token')) {
          hasTokenError = true;
        }
      }

      setMetrics(prev => ({ ...prev, isLoading: false }));

      // Handle expired token
      if (hasTokenError) {
        console.log('[useGoogleMetrics] Token expired, cleaning up...');
        await handleExpiredToken();
        throw new Error('TOKEN_EXPIRED');
      }

      // Show success if at least Google Analytics worked
      if (gaSuccess) {
        toast({
          title: "Métricas atualizadas",
          description: adsSuccess 
            ? "Dados do Google Analytics e Google Ads sincronizados com sucesso."
            : "Dados do Google Analytics sincronizados com sucesso.",
        });
        await loadCachedMetrics();
      } else {
        throw new Error('Falha ao sincronizar Google Analytics');
      }
    } catch (error: any) {
      console.error('Error syncing metrics:', error);
      setMetrics(prev => ({ ...prev, isLoading: false }));
      
      // Don't show generic error toast for token expiration
      if (error.message !== 'TOKEN_EXPIRED') {
        toast({
          title: "Erro ao sincronizar",
          description: error.message || "Não foi possível buscar as métricas do Google.",
          variant: "destructive",
        });
      }
      
      throw error;
    }
  };

  const loadCachedMetrics = async (startDate?: Date, endDate?: Date) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Default to last 30 days if no dates provided
      const end = endDate || new Date();
      const start = startDate || (() => {
        const date = new Date();
        date.setDate(date.getDate() - 30);
        return date;
      })();

      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      const [analyticsData, adsData] = await Promise.all([
        supabase
          .from('google_analytics_metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr),
        supabase
          .from('google_ads_metrics')
          .select('*')
          .eq('user_id', user.id)
          .gte('date', startStr)
          .lte('date', endStr),
      ]);

      if (analyticsData.data && analyticsData.data.length > 0) {
        const totals = analyticsData.data.reduce((acc, row) => ({
          sessions: acc.sessions + row.sessions,
          users: acc.users + row.users,
          new_users: acc.new_users + row.new_users,
          pageviews: acc.pageviews + row.pageviews,
          conversions: acc.conversions + row.conversions,
          conversion_rate: 0,
        }), { sessions: 0, users: 0, new_users: 0, pageviews: 0, conversions: 0, conversion_rate: 0 });

        totals.conversion_rate = totals.sessions > 0
          ? (totals.conversions / totals.sessions) * 100
          : 0;

        setMetrics(prev => ({ ...prev, analytics: totals }));
      } else {
        setMetrics(prev => ({ ...prev, analytics: null }));
      }

      if (adsData.data && adsData.data.length > 0) {
        const totals = adsData.data.reduce((acc, row) => ({
          impressions: acc.impressions + row.impressions,
          clicks: acc.clicks + row.clicks,
          cost: acc.cost + Number(row.cost),
          conversions: acc.conversions + Number(row.conversions),
          ctr: 0,
        }), { impressions: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0 });

        totals.ctr = totals.impressions > 0
          ? (totals.clicks / totals.impressions) * 100
          : 0;

        setMetrics(prev => ({ ...prev, ads: totals }));
      } else {
        setMetrics(prev => ({ ...prev, ads: null }));
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
    loadCachedMetrics,
  };
};
