-- Create budget_plans table
CREATE TABLE public.budget_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  total_budget NUMERIC NOT NULL DEFAULT 0,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create business_fronts table
CREATE TABLE public.business_fronts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create budget_allocations table
CREATE TABLE public.budget_allocations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_plan_id UUID NOT NULL REFERENCES public.budget_plans(id) ON DELETE CASCADE,
  business_front_id UUID NOT NULL REFERENCES public.business_fronts(id) ON DELETE CASCADE,
  percentage NUMERIC NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  allocated_amount NUMERIC NOT NULL DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create platform_distributions table
CREATE TABLE public.platform_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  budget_allocation_id UUID NOT NULL REFERENCES public.budget_allocations(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('google', 'meta', 'tiktok')),
  percentage NUMERIC NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  monthly_amount NUMERIC NOT NULL DEFAULT 0,
  daily_amount NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create geographic_distributions table
CREATE TABLE public.geographic_distributions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform_distribution_id UUID NOT NULL REFERENCES public.platform_distributions(id) ON DELETE CASCADE,
  state_code TEXT NOT NULL,
  percentage NUMERIC NOT NULL DEFAULT 0 CHECK (percentage >= 0 AND percentage <= 100),
  amount NUMERIC NOT NULL DEFAULT 0,
  google_monthly NUMERIC DEFAULT 0,
  google_daily NUMERIC DEFAULT 0,
  meta_monthly NUMERIC DEFAULT 0,
  meta_daily NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.budget_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_fronts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_distributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.geographic_distributions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for budget_plans
CREATE POLICY "Users can view their own budget plans"
  ON public.budget_plans FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own budget plans"
  ON public.budget_plans FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budget plans"
  ON public.budget_plans FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budget plans"
  ON public.budget_plans FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for business_fronts
CREATE POLICY "Users can view their own business fronts"
  ON public.business_fronts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own business fronts"
  ON public.business_fronts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business fronts"
  ON public.business_fronts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business fronts"
  ON public.business_fronts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for budget_allocations
CREATE POLICY "Users can view allocations for their plans"
  ON public.budget_allocations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.budget_plans
    WHERE budget_plans.id = budget_allocations.budget_plan_id
    AND budget_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can create allocations for their plans"
  ON public.budget_allocations FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.budget_plans
    WHERE budget_plans.id = budget_allocations.budget_plan_id
    AND budget_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can update allocations for their plans"
  ON public.budget_allocations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.budget_plans
    WHERE budget_plans.id = budget_allocations.budget_plan_id
    AND budget_plans.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete allocations for their plans"
  ON public.budget_allocations FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.budget_plans
    WHERE budget_plans.id = budget_allocations.budget_plan_id
    AND budget_plans.user_id = auth.uid()
  ));

-- RLS Policies for platform_distributions
CREATE POLICY "Users can view platform distributions for their plans"
  ON public.platform_distributions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.budget_allocations ba
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE ba.id = platform_distributions.budget_allocation_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can create platform distributions for their plans"
  ON public.platform_distributions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.budget_allocations ba
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE ba.id = platform_distributions.budget_allocation_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update platform distributions for their plans"
  ON public.platform_distributions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.budget_allocations ba
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE ba.id = platform_distributions.budget_allocation_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete platform distributions for their plans"
  ON public.platform_distributions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.budget_allocations ba
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE ba.id = platform_distributions.budget_allocation_id
    AND bp.user_id = auth.uid()
  ));

-- RLS Policies for geographic_distributions
CREATE POLICY "Users can view geographic distributions for their plans"
  ON public.geographic_distributions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.platform_distributions pd
    JOIN public.budget_allocations ba ON ba.id = pd.budget_allocation_id
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE pd.id = geographic_distributions.platform_distribution_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can create geographic distributions for their plans"
  ON public.geographic_distributions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.platform_distributions pd
    JOIN public.budget_allocations ba ON ba.id = pd.budget_allocation_id
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE pd.id = geographic_distributions.platform_distribution_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can update geographic distributions for their plans"
  ON public.geographic_distributions FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.platform_distributions pd
    JOIN public.budget_allocations ba ON ba.id = pd.budget_allocation_id
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE pd.id = geographic_distributions.platform_distribution_id
    AND bp.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete geographic distributions for their plans"
  ON public.geographic_distributions FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.platform_distributions pd
    JOIN public.budget_allocations ba ON ba.id = pd.budget_allocation_id
    JOIN public.budget_plans bp ON bp.id = ba.budget_plan_id
    WHERE pd.id = geographic_distributions.platform_distribution_id
    AND bp.user_id = auth.uid()
  ));

-- Create indexes for better performance
CREATE INDEX idx_budget_plans_user_id ON public.budget_plans(user_id);
CREATE INDEX idx_business_fronts_user_id ON public.business_fronts(user_id);
CREATE INDEX idx_budget_allocations_plan_id ON public.budget_allocations(budget_plan_id);
CREATE INDEX idx_platform_distributions_allocation_id ON public.platform_distributions(budget_allocation_id);
CREATE INDEX idx_geographic_distributions_platform_id ON public.geographic_distributions(platform_distribution_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_budget_plans_updated_at
  BEFORE UPDATE ON public.budget_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();