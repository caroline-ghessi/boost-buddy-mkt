import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BudgetPlan {
  id: string;
  user_id: string;
  name: string;
  total_budget: number;
  period_start: string;
  period_end: string;
  status: "draft" | "active" | "archived";
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useBudgetPlan = () => {
  const [plans, setPlans] = useState<BudgetPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<BudgetPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const { data, error } = await supabase
        .from("budget_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setPlans((data || []) as BudgetPlan[]);
      
      // Auto-select the first active plan or the first plan
      const activePlan = (data as BudgetPlan[] | null)?.find(p => p.status === "active");
      if (activePlan) {
        setSelectedPlan(activePlan);
      } else if (data && data.length > 0) {
        setSelectedPlan(data[0] as BudgetPlan);
      }
    } catch (error: any) {
      toast.error("Erro ao carregar planos: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createPlan = async (planData: Omit<BudgetPlan, "id" | "user_id" | "created_at" | "updated_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("budget_plans")
        .insert([{ ...planData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setPlans([data as BudgetPlan, ...plans]);
      setSelectedPlan(data as BudgetPlan);
      toast.success("Plano criado com sucesso!");
      return data;
    } catch (error: any) {
      toast.error("Erro ao criar plano: " + error.message);
      throw error;
    }
  };

  const updatePlan = async (planId: string, updates: Partial<BudgetPlan>) => {
    try {
      const { data, error } = await supabase
        .from("budget_plans")
        .update(updates)
        .eq("id", planId)
        .select()
        .single();

      if (error) throw error;
      
      setPlans(plans.map(p => p.id === planId ? data as BudgetPlan : p));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(data as BudgetPlan);
      }
      toast.success("Plano atualizado com sucesso!");
      return data;
    } catch (error: any) {
      toast.error("Erro ao atualizar plano: " + error.message);
      throw error;
    }
  };

  const deletePlan = async (planId: string) => {
    try {
      const { error } = await supabase
        .from("budget_plans")
        .delete()
        .eq("id", planId);

      if (error) throw error;
      
      setPlans(plans.filter(p => p.id !== planId));
      if (selectedPlan?.id === planId) {
        setSelectedPlan(plans[0] || null);
      }
      toast.success("Plano excluído com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao excluir plano: " + error.message);
      throw error;
    }
  };

  const duplicatePlan = async (planId: string) => {
    try {
      const planToDuplicate = plans.find(p => p.id === planId);
      if (!planToDuplicate) throw new Error("Plano não encontrado");

      const newPlan = await createPlan({
        name: `${planToDuplicate.name} (Cópia)`,
        total_budget: planToDuplicate.total_budget,
        period_start: planToDuplicate.period_start,
        period_end: planToDuplicate.period_end,
        status: "draft",
        notes: planToDuplicate.notes,
      });

      return newPlan;
    } catch (error: any) {
      toast.error("Erro ao duplicar plano: " + error.message);
      throw error;
    }
  };

  return {
    plans,
    selectedPlan,
    setSelectedPlan,
    isLoading,
    loadPlans,
    createPlan,
    updatePlan,
    deletePlan,
    duplicatePlan,
  };
};