-- Configurar pg_cron para executar o agent-executor a cada 2 minutos
SELECT cron.schedule(
  'process-agent-jobs',
  '*/2 * * * *', -- A cada 2 minutos
  $$
  SELECT
    net.http_post(
      url:='https://uujalotsiwoeitcgnmzv.supabase.co/functions/v1/agent-executor',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amFsb3RzaXdvZWl0Y2dubXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDMwOTIsImV4cCI6MjA3NjgxOTA5Mn0.2os1rYHtt2NuvGJaYciSQ6D4TCSAY8xphEfn0KBZWqM"}'::jsonb,
      body:='{"batchSize": 10}'::jsonb
    ) as request_id;
  $$
);

-- Configurar limpeza de jobs antigos a cada dia às 3h
SELECT cron.schedule(
  'cleanup-old-agent-jobs',
  '0 3 * * *', -- Diariamente às 3h
  $$
  DELETE FROM public.agent_jobs 
  WHERE status IN ('completed', 'dead') 
  AND completed_at < NOW() - INTERVAL '30 days';
  $$
);