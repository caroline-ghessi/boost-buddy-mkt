-- Habilitar a extensão pgmq para filas resilientes
CREATE EXTENSION IF NOT EXISTS pgmq CASCADE;

-- Tabela de jobs para rastreamento e histórico
CREATE TABLE IF NOT EXISTS public.agent_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_type text NOT NULL,
  task_id uuid REFERENCES public.agent_tasks(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.campaigns(id) ON DELETE CASCADE,
  agent_id text NOT NULL,
  priority integer NOT NULL DEFAULT 5, -- 1 (highest) to 10 (lowest)
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, dead
  attempts integer NOT NULL DEFAULT 0,
  max_attempts integer NOT NULL DEFAULT 3,
  error_message text,
  result jsonb,
  enqueued_at timestamp with time zone NOT NULL DEFAULT now(),
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_agent_jobs_status ON public.agent_jobs(status);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_task_id ON public.agent_jobs(task_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_campaign_id ON public.agent_jobs(campaign_id);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_priority ON public.agent_jobs(priority DESC, enqueued_at ASC);
CREATE INDEX IF NOT EXISTS idx_agent_jobs_agent_id ON public.agent_jobs(agent_id);

-- Trigger para atualizar updated_at
CREATE TRIGGER update_agent_jobs_updated_at
  BEFORE UPDATE ON public.agent_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Criar a fila pgmq
SELECT pgmq.create('agent_jobs_queue');

-- RLS Policies
ALTER TABLE public.agent_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view jobs for their campaigns"
  ON public.agent_jobs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.campaigns
      WHERE campaigns.id = agent_jobs.campaign_id
      AND campaigns.user_id = auth.uid()
    )
  );

CREATE POLICY "Service can manage all jobs"
  ON public.agent_jobs
  FOR ALL
  USING (true);

-- View para monitoramento da fila
CREATE OR REPLACE VIEW public.v_agent_queue_health AS
SELECT
  status,
  COUNT(*) as count,
  AVG(attempts) as avg_attempts,
  MIN(enqueued_at) as oldest_job,
  MAX(enqueued_at) as newest_job
FROM public.agent_jobs
WHERE status IN ('pending', 'processing')
GROUP BY status;