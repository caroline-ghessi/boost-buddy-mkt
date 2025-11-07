-- Fase 1: Habilitar pg_cron e criar estrutura de agendamento
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Tabela de controle de execuções de jobs
CREATE TABLE IF NOT EXISTS public.sync_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  source TEXT NOT NULL, -- 'google_ads', 'meta_ads', 'google_analytics', 'social_media'
  user_id UUID REFERENCES auth.users(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  finished_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'success', 'failed'
  rows_processed INT DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_sync_job_runs_source_status ON public.sync_job_runs(source, status, started_at DESC);
CREATE INDEX idx_sync_job_runs_user_id ON public.sync_job_runs(user_id, started_at DESC);

-- RLS para sync_job_runs
ALTER TABLE public.sync_job_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own job runs"
  ON public.sync_job_runs
  FOR SELECT
  USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Admins can view all job runs"
  ON public.sync_job_runs
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service can insert job runs"
  ON public.sync_job_runs
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update job runs"
  ON public.sync_job_runs
  FOR UPDATE
  USING (true);

-- Fase 6: View de observabilidade
CREATE OR REPLACE VIEW public.v_sync_health AS
SELECT 
  source,
  COUNT(*) FILTER (WHERE status = 'success' AND started_at > NOW() - INTERVAL '7 days') AS success_count_7d,
  COUNT(*) FILTER (WHERE status = 'failed' AND started_at > NOW() - INTERVAL '7 days') AS failed_count_7d,
  COUNT(*) FILTER (WHERE status = 'success' AND started_at > NOW() - INTERVAL '24 hours') AS success_count_24h,
  COUNT(*) FILTER (WHERE status = 'failed' AND started_at > NOW() - INTERVAL '24 hours') AS failed_count_24h,
  AVG(EXTRACT(EPOCH FROM (finished_at - started_at))) FILTER (WHERE finished_at IS NOT NULL) AS avg_duration_seconds,
  MAX(finished_at) FILTER (WHERE status = 'success') AS last_success_at,
  MAX(finished_at) FILTER (WHERE status = 'failed') AS last_failure_at,
  SUM(rows_processed) FILTER (WHERE started_at > NOW() - INTERVAL '7 days') AS total_rows_7d
FROM public.sync_job_runs
GROUP BY source;

-- Jobs diários (executam às 3:00 UTC)
SELECT cron.schedule(
  'daily-google-ads-sync',
  '0 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://uujalotsiwoeitcgnmzv.supabase.co/functions/v1/google-ads-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amFsb3RzaXdvZWl0Y2dubXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDMwOTIsImV4cCI6MjA3NjgxOTA5Mn0.2os1rYHtt2NuvGJaYciSQ6D4TCSAY8xphEfn0KBZWqM"}'::jsonb,
    body:='{"automated": true}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'daily-google-analytics-sync',
  '5 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://uujalotsiwoeitcgnmzv.supabase.co/functions/v1/google-analytics-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amFsb3RzaXdvZWl0Y2dubXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDMwOTIsImV4cCI6MjA3NjgxOTA5Mn0.2os1rYHtt2NuvGJaYciSQ6D4TCSAY8xphEfn0KBZWqM"}'::jsonb,
    body:='{"automated": true}'::jsonb
  ) as request_id;
  $$
);

SELECT cron.schedule(
  'daily-meta-ads-sync',
  '10 3 * * *',
  $$
  SELECT net.http_post(
    url:='https://uujalotsiwoeitcgnmzv.supabase.co/functions/v1/meta-ads-sync',
    headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amFsb3RzaXdvZWl0Y2dubXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDMwOTIsImV4cCI6MjA3NjgxOTA5Mn0.2os1rYHtt2NuvGJaYciSQ6D4TCSAY8xphEfn0KBZWqM"}'::jsonb,
    body:='{"automated": true}'::jsonb
  ) as request_id;
  $$
);