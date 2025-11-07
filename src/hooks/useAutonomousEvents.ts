import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AutonomousEvent {
  id: string;
  event_type: string;
  entity_id: string | null;
  user_id: string;
  metadata: any;
  processed: boolean;
  processing_result: any;
  created_at: string;
  processed_at: string | null;
}

export const useAutonomousEvents = (limit: number = 50) => {
  return useQuery({
    queryKey: ['autonomous-events', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as AutonomousEvent[];
    },
    refetchInterval: 15000, // Auto-refresh every 15s
  });
};

export const useEventStats = () => {
  return useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('autonomous_events')
        .select('event_type, processed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const stats = data.reduce((acc, event) => {
        acc.total++;
        if (event.processed) acc.processed++;
        acc.byType[event.event_type] = (acc.byType[event.event_type] || 0) + 1;
        return acc;
      }, { total: 0, processed: 0, byType: {} as Record<string, number> });

      return stats;
    },
    refetchInterval: 15000,
  });
};
