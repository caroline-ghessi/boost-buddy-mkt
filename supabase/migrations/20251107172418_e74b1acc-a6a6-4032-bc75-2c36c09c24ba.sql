-- Tabela para eventos de percepção autônoma
CREATE TABLE IF NOT EXISTS public.autonomous_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  entity_id uuid, -- campaign_id, competitor_name, etc.
  user_id uuid NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  processed boolean DEFAULT false,
  processing_result jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  processed_at timestamp with time zone
);

CREATE INDEX IF NOT EXISTS idx_autonomous_events_processed ON public.autonomous_events(processed, created_at);
CREATE INDEX IF NOT EXISTS idx_autonomous_events_user_id ON public.autonomous_events(user_id);
CREATE INDEX IF NOT EXISTS idx_autonomous_events_type ON public.autonomous_events(event_type);

-- RLS
ALTER TABLE public.autonomous_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own events"
  ON public.autonomous_events
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all events"
  ON public.autonomous_events
  FOR ALL
  USING (true);

-- Função para disparar o autonomous-planner via HTTP
CREATE OR REPLACE FUNCTION public.trigger_autonomous_planner()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Disparar edge function via pg_net (assíncrono)
  PERFORM net.http_post(
    url := 'https://uujalotsiwoeitcgnmzv.supabase.co/functions/v1/autonomous-planner',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1amFsb3RzaXdvZWl0Y2dubXp2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEyNDMwOTIsImV4cCI6MjA3NjgxOTA5Mn0.2os1rYHtt2NuvGJaYciSQ6D4TCSAY8xphEfn0KBZWqM'
    ),
    body := jsonb_build_object(
      'event_type', NEW.event_type,
      'entity_id', NEW.entity_id,
      'user_id', NEW.user_id,
      'metadata', NEW.metadata
    )
  );
  
  RETURN NEW;
END;
$$;

-- Trigger: Quando novo evento autônomo é criado
CREATE TRIGGER on_autonomous_event_created
  AFTER INSERT ON public.autonomous_events
  FOR EACH ROW
  WHEN (NEW.processed = false)
  EXECUTE FUNCTION public.trigger_autonomous_planner();

-- Trigger: Quando novos dados de competidores chegam (percepção)
CREATE OR REPLACE FUNCTION public.on_new_competitor_data()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar evento de percepção
  INSERT INTO public.autonomous_events (
    event_type,
    entity_id,
    user_id,
    metadata
  ) VALUES (
    'new_competitor_data',
    NULL,
    NEW.user_id,
    jsonb_build_object(
      'competitor_name', NEW.competitor_name,
      'platform', NEW.platform,
      'data_type', NEW.data_type
    )
  );
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_on_new_competitor_data
  AFTER INSERT ON public.competitor_data
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_competitor_data();

-- Trigger: Quando campanha é criada (percepção)
CREATE OR REPLACE FUNCTION public.on_campaign_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Criar evento de percepção apenas para novas campanhas
  IF NEW.status = 'draft' THEN
    INSERT INTO public.autonomous_events (
      event_type,
      entity_id,
      user_id,
      metadata
    ) VALUES (
      'campaign_created',
      NEW.id,
      NEW.user_id,
      jsonb_build_object(
        'campaign_name', NEW.name,
        'objectives', NEW.objectives,
        'budget', NEW.budget_total
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_on_campaign_created
  AFTER INSERT ON public.campaigns
  FOR EACH ROW
  EXECUTE FUNCTION public.on_campaign_created();

-- Trigger: Quando performance de agente degrada (percepção)
CREATE OR REPLACE FUNCTION public.check_agent_performance_degradation()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  agent_record RECORD;
  recent_success_rate NUMERIC;
  avg_success_rate NUMERIC;
BEGIN
  -- Para cada agente, verificar se performance caiu
  FOR agent_record IN
    SELECT DISTINCT agent_id
    FROM tool_execution_logs
    WHERE created_at > NOW() - INTERVAL '24 hours'
  LOOP
    -- Taxa de sucesso nas últimas 2 horas
    SELECT 
      COALESCE(
        100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0),
        100.0
      ) INTO recent_success_rate
    FROM tool_execution_logs
    WHERE agent_id = agent_record.agent_id
      AND created_at > NOW() - INTERVAL '2 hours';
    
    -- Taxa de sucesso média nas últimas 24h
    SELECT 
      COALESCE(
        100.0 * COUNT(*) FILTER (WHERE status = 'success') / NULLIF(COUNT(*), 0),
        100.0
      ) INTO avg_success_rate
    FROM tool_execution_logs
    WHERE agent_id = agent_record.agent_id
      AND created_at > NOW() - INTERVAL '24 hours'
      AND created_at <= NOW() - INTERVAL '2 hours';
    
    -- Se taxa recente caiu mais de 20 pontos percentuais
    IF recent_success_rate < (avg_success_rate - 20) AND recent_success_rate < 80 THEN
      -- Pegar user_id da campanha mais recente deste agente
      INSERT INTO public.autonomous_events (
        event_type,
        entity_id,
        user_id,
        metadata
      )
      SELECT 
        'performance_degradation',
        NULL,
        c.user_id,
        jsonb_build_object(
          'agent_id', agent_record.agent_id,
          'recent_success_rate', recent_success_rate,
          'avg_success_rate', avg_success_rate
        )
      FROM agent_tasks at
      JOIN campaigns c ON c.id = at.campaign_id
      WHERE at.agent_id = agent_record.agent_id
      ORDER BY at.created_at DESC
      LIMIT 1;
      
      EXIT; -- Apenas um evento por execução
    END IF;
  END LOOP;
END;
$$;

-- Agendar verificação de performance degradada a cada 2 horas
SELECT cron.schedule(
  'check-agent-performance',
  '0 */2 * * *', -- A cada 2 horas
  $$
  SELECT public.check_agent_performance_degradation();
  $$
);

-- Agendar revisão diária proativa (às 9h da manhã)
SELECT cron.schedule(
  'daily-autonomous-review',
  '0 9 * * *', -- Diariamente às 9h
  $$
  INSERT INTO public.autonomous_events (
    event_type,
    user_id,
    metadata
  )
  SELECT 
    'daily_review',
    user_id,
    jsonb_build_object(
      'active_campaigns', COUNT(*),
      'review_date', CURRENT_DATE
    )
  FROM campaigns
  WHERE status IN ('active', 'in_progress')
  GROUP BY user_id;
  $$
);