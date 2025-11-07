import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PlatformMetrics {
  followers: number;
  posts: number;
  engagement_rate: number;
  views: number;
  growth: number;
}

interface SocialMediaMetrics {
  instagram: PlatformMetrics | null;
  linkedin: PlatformMetrics | null;
  youtube: PlatformMetrics | null;
  isLoading: boolean;
}

export function useSocialMediaMetrics() {
  const [metrics, setMetrics] = useState<SocialMediaMetrics>({
    instagram: null,
    linkedin: null,
    youtube: null,
    isLoading: true,
  });
  const { toast } = useToast();

  const loadMetrics = async (startDate?: Date, endDate?: Date) => {
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

      const { data, error } = await supabase
        .from('social_media_metrics')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', startStr)
        .lte('date', endStr)
        .order('date', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const platforms = ['instagram', 'linkedin', 'youtube'] as const;
        const aggregated: any = {};

        platforms.forEach(platform => {
          const platformData = data.filter(d => d.platform === platform);
          if (platformData.length > 0) {
            const latest = platformData[0];
            const oldest = platformData[platformData.length - 1];
            
            aggregated[platform] = {
              followers: latest.followers || 0,
              posts: latest.posts_count || 0,
              engagement_rate: latest.engagement_rate || 0,
              views: latest.total_views || 0,
              growth: latest.followers - (oldest.followers || 0),
            };
          } else {
            aggregated[platform] = null;
          }
        });

        setMetrics({
          ...aggregated,
          isLoading: false,
        });
      } else {
        setMetrics({
          instagram: null,
          linkedin: null,
          youtube: null,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Error loading social media metrics:', error);
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }
  };

  const syncMetrics = async (platform: string, profileHandle: string) => {
    setMetrics(prev => ({ ...prev, isLoading: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke('social-media-sync', {
        body: { platform, profileHandle },
      });

      if (error) throw error;

      toast({
        title: `${platform} sincronizado`,
        description: `Métricas de @${profileHandle} atualizadas com sucesso.`,
      });

      await loadMetrics();
      
      return data;
    } catch (error: any) {
      console.error('Error syncing social media:', error);
      toast({
        title: 'Erro ao sincronizar',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setMetrics(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  return {
    ...metrics,
    syncMetrics,
    refreshMetrics: loadMetrics,
  };
}
