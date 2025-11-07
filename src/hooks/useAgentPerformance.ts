import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AgentPerformanceData {
  agent_id: string;
  day: string;
  total_executions: number;
  avg_duration_ms: number;
  median_duration_ms: number;
  p95_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  success_count: number;
  failed_count: number;
  timeout_count: number;
  success_rate_pct: number;
}

export interface ToolPerformanceData {
  tool_name: string;
  total_calls: number;
  avg_duration_ms: number;
  total_tokens: number;
  total_cost_usd: number;
  success_count: number;
  failed_count: number;
  success_rate_pct: number;
}

export interface RecentLogData {
  id: string;
  agent_id: string;
  agent_name: string;
  task_id: string;
  tool_name: string;
  status: string;
  duration_ms: number;
  tokens_used: number;
  cost_usd: number;
  error_message: string;
  created_at: string;
}

export const useAgentPerformance = (days: number = 30) => {
  return useQuery({
    queryKey: ['agent-performance', days],
    queryFn: async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const { data, error } = await supabase
        .from('mv_agent_performance')
        .select('*')
        .gte('day', startDate.toISOString())
        .order('day', { ascending: false });

      if (error) throw error;
      return data as AgentPerformanceData[];
    },
  });
};

export const useToolPerformance = () => {
  return useQuery({
    queryKey: ['tool-performance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_tool_performance')
        .select('*');

      if (error) throw error;
      return data as ToolPerformanceData[];
    },
  });
};

export const useRecentLogs = (limit: number = 50) => {
  return useQuery({
    queryKey: ['recent-logs', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_recent_tool_logs')
        .select('*')
        .limit(limit);

      if (error) throw error;
      return data as RecentLogData[];
    },
    refetchInterval: 10000, // Auto-refresh every 10s
  });
};

export const useAgentStats = (agentId?: string) => {
  return useQuery({
    queryKey: ['agent-stats', agentId],
    queryFn: async () => {
      let query = supabase
        .from('tool_execution_logs')
        .select('*', { count: 'exact', head: false });

      if (agentId) {
        query = query.eq('agent_id', agentId);
      }

      const { data, error, count } = await query
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

      if (error) throw error;

      const totalCost = data?.reduce((sum, log) => sum + (Number(log.cost_usd) || 0), 0) || 0;
      const totalTokens = data?.reduce((sum, log) => sum + (log.tokens_used || 0), 0) || 0;
      const avgDuration = data?.length 
        ? data.reduce((sum, log) => sum + (log.duration_ms || 0), 0) / data.length 
        : 0;

      return {
        total_executions_24h: count || 0,
        total_cost_24h: totalCost,
        total_tokens_24h: totalTokens,
        avg_duration_24h: avgDuration,
      };
    },
  });
};
