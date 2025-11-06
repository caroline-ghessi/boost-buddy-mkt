import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface MetaAdsMetrics {
  impressions: number;
  reach: number;
  clicks: number;
  cost: number;
  conversions: number;
  ctr: number;
  cpm: number;
  cpc: number;
}

interface MetaMetrics {
  ads: MetaAdsMetrics | null;
  isConnected: boolean;
  isLoading: boolean;
}

export function useMetaMetrics() {
  const [metrics, setMetrics] = useState<MetaMetrics>({
    ads: null,
    isConnected: false,
    isLoading: true,
  });
  const { toast } = useToast();

  const checkConnection = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if there's any Meta Ads data
      const { data, error } = await supabase
        .from('meta_ads_metrics')
        .select('id')
        .eq('user_id', user.id)
        .limit(1);

      if (error) throw error;
      return (data?.length || 0) > 0;
    } catch (error) {
      console.error('Error checking Meta connection:', error);
      return false;
    }
  };

  const syncMetrics = async (startDate?: string, endDate?: string) => {
    setMetrics(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('meta-ads-sync', {
        body: { startDate, endDate },
      });

      if (error) throw error;

      // Reload cached metrics
      await loadCachedMetrics();
      
      return data;
    } catch (error: any) {
      console.error('Error syncing Meta metrics:', error);
      toast({
        title: 'Erro ao sincronizar Meta Ads',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadCachedMetrics = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get last 30 days of data
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from('meta_ads_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Aggregate metrics
        const totals = data.reduce(
          (acc, row) => ({
            impressions: acc.impressions + (row.impressions || 0),
            reach: acc.reach + (row.reach || 0),
            clicks: acc.clicks + (row.clicks || 0),
            cost: acc.cost + parseFloat(String(row.cost || 0)),
            conversions: acc.conversions + parseFloat(String(row.conversions || 0)),
            ctr: 0, // Will calculate after
            cpm: 0, // Will calculate after
            cpc: 0, // Will calculate after
          }),
          { impressions: 0, reach: 0, clicks: 0, cost: 0, conversions: 0, ctr: 0, cpm: 0, cpc: 0 }
        );

        // Calculate derived metrics
        totals.ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0;
        totals.cpm = totals.impressions > 0 ? (totals.cost / totals.impressions) * 1000 : 0;
        totals.cpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0;

        setMetrics({
          ads: totals,
          isConnected: true,
          isLoading: false,
        });
      } else {
        setMetrics({
          ads: null,
          isConnected: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading cached Meta metrics:', error);
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    const initialize = async () => {
      const connected = await checkConnection();
      if (connected) {
        await loadCachedMetrics();
      } else {
        setMetrics({
          ads: null,
          isConnected: false,
          isLoading: false,
        });
      }
    };

    initialize();
  }, []);

  return {
    ...metrics,
    syncMetrics,
    refreshMetrics: loadCachedMetrics,
  };
}
