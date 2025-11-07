-- Tabela de logs de execução de ferramentas/ações dos agentes
CREATE TABLE IF NOT EXISTS public.tool_execution_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id text NOT NULL,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  tool_name text NOT NULL, -- 'rag_query', 'fetch_metrics', 'llm_call', 'context_build', etc.
  input jsonb,
  output jsonb,
  duration_ms integer,
  tokens_used integer,
  cost_usd numeric(10,4),
  status text NOT NULL, -- 'success', 'failed', 'timeout'
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_tool_logs_agent_id ON public.tool_execution_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_task_id ON public.tool_execution_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_campaign_id ON public.tool_execution_logs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_tool_logs_tool_name ON public.tool_execution_logs(tool_name);
CREATE INDEX IF NOT EXISTS idx_tool_logs_status ON public.tool_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_tool_logs_created_at ON public.tool_execution_logs(created_at DESC);

-- RLS Policies
ALTER TABLE public.tool_execution_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view logs for their campaigns"
  ON public.tool_execution_logs
  FOR SELECT
  USING (
    campaign_id IS NULL OR
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = tool_execution_logs.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage all logs"
  ON public.tool_execution_logs
  FOR ALL
  USING (true);

-- Materialized View para performance agregada dos agentes
CREATE MATERIALIZED VIEW IF NOT EXISTS public.mv_agent_performance AS
SELECT 
  agent_id,
  DATE_TRUNC('day', created_at) AS day,
  COUNT(*) AS total_executions,
  AVG(duration_ms) AS avg_duration_ms,
  PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY duration_ms) AS median_duration_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms,
  SUM(tokens_used) AS total_tokens,
  SUM(cost_usd) AS total_cost_usd,
  COUNT(*) FILTER (WHERE status = 'success') AS success_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  COUNT(*) FILTER (WHERE status = 'timeout') AS timeout_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0), 2) AS success_rate_pct
FROM public.tool_execution_logs
GROUP BY agent_id, DATE_TRUNC('day', created_at);

-- Índice na materialized view
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_agent_performance_agent_day 
  ON public.mv_agent_performance(agent_id, day DESC);

-- View para métricas por ferramenta
CREATE OR REPLACE VIEW public.v_tool_performance AS
SELECT 
  tool_name,
  COUNT(*) AS total_calls,
  AVG(duration_ms) AS avg_duration_ms,
  SUM(tokens_used) AS total_tokens,
  SUM(cost_usd) AS total_cost_usd,
  COUNT(*) FILTER (WHERE status = 'success') AS success_count,
  COUNT(*) FILTER (WHERE status = 'failed') AS failed_count,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0), 2) AS success_rate_pct
FROM public.tool_execution_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY tool_name
ORDER BY total_calls DESC;

-- View para últimos logs (útil para debugging)
CREATE OR REPLACE VIEW public.v_recent_tool_logs AS
SELECT 
  l.id,
  l.agent_id,
  a.name as agent_name,
  l.task_id,
  l.tool_name,
  l.status,
  l.duration_ms,
  l.tokens_used,
  l.cost_usd,
  l.error_message,
  l.created_at
FROM public.tool_execution_logs l
LEFT JOIN public.agent_configs a ON a.agent_id = l.agent_id
ORDER BY l.created_at DESC
LIMIT 100;

-- Agendar refresh da materialized view diariamente às 4h
SELECT cron.schedule(
  'refresh-agent-performance-mv',
  '0 4 * * *',
  $$
  REFRESH MATERIALIZED VIEW CONCURRENTLY public.mv_agent_performance;
  $$
);