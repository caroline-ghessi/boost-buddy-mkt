import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BudgetAllocation {
  id: string;
  budget_plan_id: string;
  business_front_id: string;
  percentage: number;
  allocated_amount: number;
  notes?: string;
  created_at: string;
}

export interface PlatformDistribution {
  id: string;
  budget_allocation_id: string;
  platform: "google" | "meta" | "tiktok";
  percentage: number;
  monthly_amount: number;
  daily_amount: number;
  created_at: string;
}

export interface GeographicDistribution {
  id: string;
  platform_distribution_id: string;
  state_code: string;
  percentage: number;
  amount: number;
  google_monthly: number;
  google_daily: number;
  meta_monthly: number;
  meta_daily: number;
  created_at: string;
}

export const useBudgetAllocations = (planId: string | null) => {
  const [allocations, setAllocations] = useState<BudgetAllocation[]>([]);
  const [platforms, setPlatforms] = useState<PlatformDistribution[]>([]);
  const [geographic, setGeographic] = useState<GeographicDistribution[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (planId) {
      loadAllocations(planId);
    }
  }, [planId]);

  const loadAllocations = async (budgetPlanId: string) => {
    try {
      setIsLoading(true);
      
      // Load allocations
      const { data: allocData, error: allocError } = await supabase
        .from("budget_allocations")
        .select("*")
        .eq("budget_plan_id", budgetPlanId);

      if (allocError) throw allocError;
      setAllocations(allocData || []);

      // Load platform distributions
      if (allocData && allocData.length > 0) {
        const allocationIds = allocData.map(a => a.id);
        const { data: platformData, error: platformError } = await supabase
          .from("platform_distributions")
          .select("*")
          .in("budget_allocation_id", allocationIds);

        if (platformError) throw platformError;
        setPlatforms((platformData || []) as PlatformDistribution[]);

        // Load geographic distributions
        if (platformData && platformData.length > 0) {
          const platformIds = platformData.map(p => p.id);
          const { data: geoData, error: geoError } = await supabase
            .from("geographic_distributions")
            .select("*")
            .in("platform_distribution_id", platformIds);

          if (geoError) throw geoError;
          setGeographic(geoData || []);
        }
      }
    } catch (error: any) {
      toast.error("Erro ao carregar alocações: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createAllocation = async (allocationData: Omit<BudgetAllocation, "id" | "created_at">) => {
    try {
      const { data, error } = await supabase
        .from("budget_allocations")
        .insert([allocationData])
        .select()
        .single();

      if (error) throw error;
      
      setAllocations([...allocations, data]);
      return data;
    } catch (error: any) {
      toast.error("Erro ao criar alocação: " + error.message);
      throw error;
    }
  };

  const updateAllocation = async (allocationId: string, updates: Partial<BudgetAllocation>) => {
    try {
      const { data, error } = await supabase
        .from("budget_allocations")
        .update(updates)
        .eq("id", allocationId)
        .select()
        .single();

      if (error) throw error;
      
      setAllocations(allocations.map(a => a.id === allocationId ? data : a));
      return data;
    } catch (error: any) {
      toast.error("Erro ao atualizar alocação: " + error.message);
      throw error;
    }
  };

  const deleteAllocation = async (allocationId: string) => {
    try {
      const { error } = await supabase
        .from("budget_allocations")
        .delete()
        .eq("id", allocationId);

      if (error) throw error;
      
      setAllocations(allocations.filter(a => a.id !== allocationId));
    } catch (error: any) {
      toast.error("Erro ao excluir alocação: " + error.message);
      throw error;
    }
  };

  const upsertPlatformDistribution = async (platformData: Omit<PlatformDistribution, "id" | "created_at"> & { id?: string }) => {
    try {
      const { data, error } = await supabase
        .from("platform_distributions")
        .upsert([platformData])
        .select()
        .single();

      if (error) throw error;
      
      const typedData = data as PlatformDistribution;
      setPlatforms(platforms.some(p => p.id === typedData.id)
        ? platforms.map(p => p.id === typedData.id ? typedData : p)
        : [...platforms, typedData]
      );
      return data;
    } catch (error: any) {
      toast.error("Erro ao salvar distribuição de plataforma: " + error.message);
      throw error;
    }
  };

  const upsertGeographicDistribution = async (geoData: Omit<GeographicDistribution, "id" | "created_at"> & { id?: string }) => {
    try {
      const { data, error } = await supabase
        .from("geographic_distributions")
        .upsert([geoData])
        .select()
        .single();

      if (error) throw error;
      
      setGeographic(geographic.some(g => g.id === data.id)
        ? geographic.map(g => g.id === data.id ? data : g)
        : [...geographic, data]
      );
      return data;
    } catch (error: any) {
      toast.error("Erro ao salvar distribuição geográfica: " + error.message);
      throw error;
    }
  };

  return {
    allocations,
    platforms,
    geographic,
    isLoading,
    createAllocation,
    updateAllocation,
    deleteAllocation,
    upsertPlatformDistribution,
    upsertGeographicDistribution,
    refreshAllocations: () => planId && loadAllocations(planId),
  };
};