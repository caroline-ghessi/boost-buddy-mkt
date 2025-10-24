-- Enable pgcrypto for encryption
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create google_credentials table for OAuth tokens
CREATE TABLE public.google_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scope TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.google_credentials ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_credentials
CREATE POLICY "Users can manage their own credentials"
ON public.google_credentials
FOR ALL
USING (auth.uid() = user_id);

-- Create google_analytics_metrics table
CREATE TABLE public.google_analytics_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  new_users INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2),
  avg_session_duration NUMERIC(10,2),
  conversions INTEGER NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  traffic_sources JSONB DEFAULT '{}'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for faster date queries
CREATE INDEX idx_google_analytics_metrics_date ON public.google_analytics_metrics(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.google_analytics_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_analytics_metrics
CREATE POLICY "Users can view their own analytics"
ON public.google_analytics_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analytics"
ON public.google_analytics_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analytics"
ON public.google_analytics_metrics
FOR UPDATE
USING (auth.uid() = user_id);

-- Create google_ads_metrics table
CREATE TABLE public.google_ads_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  impressions BIGINT NOT NULL DEFAULT 0,
  clicks BIGINT NOT NULL DEFAULT 0,
  ctr NUMERIC(5,2),
  cost NUMERIC(12,2) NOT NULL DEFAULT 0,
  cpc NUMERIC(12,2),
  conversions NUMERIC(10,2) NOT NULL DEFAULT 0,
  conversion_rate NUMERIC(5,2),
  cost_per_conversion NUMERIC(12,2),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id, date)
);

-- Create index for faster date queries
CREATE INDEX idx_google_ads_metrics_date ON public.google_ads_metrics(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.google_ads_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for google_ads_metrics
CREATE POLICY "Users can view their own ads metrics"
ON public.google_ads_metrics
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own ads metrics"
ON public.google_ads_metrics
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own ads metrics"
ON public.google_ads_metrics
FOR UPDATE
USING (auth.uid() = user_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_google_credentials_updated_at
BEFORE UPDATE ON public.google_credentials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();