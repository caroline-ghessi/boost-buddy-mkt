-- Criar tabela para métricas de redes sociais dos próprios perfis da empresa
CREATE TABLE public.social_media_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('instagram', 'linkedin', 'youtube')),
  profile_handle TEXT NOT NULL,
  date DATE NOT NULL,
  
  -- Métricas comuns
  followers INTEGER DEFAULT 0,
  following INTEGER DEFAULT 0,
  posts_count INTEGER DEFAULT 0,
  
  -- Engajamento
  total_likes BIGINT DEFAULT 0,
  total_comments BIGINT DEFAULT 0,
  total_shares BIGINT DEFAULT 0,
  total_views BIGINT DEFAULT 0,
  engagement_rate NUMERIC,
  
  -- Crescimento
  followers_change INTEGER DEFAULT 0,
  posts_published INTEGER DEFAULT 0,
  
  -- Metadados
  metadata JSONB DEFAULT '{}'::jsonb,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT social_media_metrics_unique UNIQUE (user_id, platform, profile_handle, date)
);

-- Habilitar RLS
ALTER TABLE public.social_media_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Users can view their own social metrics"
  ON public.social_media_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own social metrics"
  ON public.social_media_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own social metrics"
  ON public.social_media_metrics FOR UPDATE
  USING (auth.uid() = user_id);

-- Índices para melhorar performance
CREATE INDEX idx_social_media_metrics_user_platform ON public.social_media_metrics(user_id, platform);
CREATE INDEX idx_social_media_metrics_date ON public.social_media_metrics(date DESC);