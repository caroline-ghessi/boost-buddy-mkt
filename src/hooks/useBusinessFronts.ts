import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessFront {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  color: string;
  is_active: boolean;
  created_at: string;
}

export const useBusinessFronts = () => {
  const [fronts, setFronts] = useState<BusinessFront[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFronts();
  }, []);

  const loadFronts = async () => {
    try {
      const { data, error } = await supabase
        .from("business_fronts")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setFronts(data || []);
    } catch (error: any) {
      toast.error("Erro ao carregar frentes: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const createFront = async (frontData: Omit<BusinessFront, "id" | "user_id" | "created_at">) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { data, error } = await supabase
        .from("business_fronts")
        .insert([{ ...frontData, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      setFronts([...fronts, data]);
      toast.success("Frente criada com sucesso!");
      return data;
    } catch (error: any) {
      toast.error("Erro ao criar frente: " + error.message);
      throw error;
    }
  };

  const updateFront = async (frontId: string, updates: Partial<BusinessFront>) => {
    try {
      const { data, error } = await supabase
        .from("business_fronts")
        .update(updates)
        .eq("id", frontId)
        .select()
        .single();

      if (error) throw error;
      
      setFronts(fronts.map(f => f.id === frontId ? data : f));
      toast.success("Frente atualizada com sucesso!");
      return data;
    } catch (error: any) {
      toast.error("Erro ao atualizar frente: " + error.message);
      throw error;
    }
  };

  const deleteFront = async (frontId: string) => {
    try {
      const { error } = await supabase
        .from("business_fronts")
        .update({ is_active: false })
        .eq("id", frontId);

      if (error) throw error;
      
      setFronts(fronts.filter(f => f.id !== frontId));
      toast.success("Frente removida com sucesso!");
    } catch (error: any) {
      toast.error("Erro ao remover frente: " + error.message);
      throw error;
    }
  };

  return {
    fronts,
    isLoading,
    loadFronts,
    createFront,
    updateFront,
    deleteFront,
  };
};