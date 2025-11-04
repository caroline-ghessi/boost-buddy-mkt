-- Create meta_ads_metrics table for Facebook/Instagram Ads data
CREATE TABLE meta_ads_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  campaign_id text NOT NULL,
  campaign_name text NOT NULL,
  
  -- Core metrics
  impressions bigint NOT NULL DEFAULT 0,
  reach bigint NOT NULL DEFAULT 0,
  clicks bigint NOT NULL DEFAULT 0,
  ctr numeric,
  cost numeric NOT NULL DEFAULT 0,
  cpc numeric,
  cpm numeric,
  
  -- Conversions
  conversions numeric NOT NULL DEFAULT 0,
  conversion_rate numeric,
  cost_per_conversion numeric,
  
  -- Metadata and timestamps
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Prevent duplicates
  UNIQUE(user_id, campaign_id, date)
);

-- Indexes for performance
CREATE INDEX idx_meta_ads_metrics_user_date ON meta_ads_metrics(user_id, date DESC);
CREATE INDEX idx_meta_ads_metrics_campaign ON meta_ads_metrics(campaign_id);

-- Enable RLS
ALTER TABLE meta_ads_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own meta ads metrics"
  ON meta_ads_metrics FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meta ads metrics"
  ON meta_ads_metrics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meta ads metrics"
  ON meta_ads_metrics FOR UPDATE
  USING (auth.uid() = user_id);