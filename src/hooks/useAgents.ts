import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export interface Agent {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  level: "level_1" | "level_2" | "level_3" | "level_4";
  team: string;
  avatar?: string;
  breed: string;
  breed_trait: string;
  emoji: string;
  system_prompt: string;
  specialty: string;
  years_experience?: number;
  llm_model?: string;
  temperature?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

interface DbAgent {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  level: "level_1" | "level_2" | "level_3" | "level_4";
  team: string;
  avatar?: string;
  breed: string;
  breed_trait: string;
  emoji: string;
  system_prompt: string;
  specialty: string[];
  years_experience?: number;
  llm_model?: string;
  temperature?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export function useAgents() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;

      // Transformar specialty de array para string
      const transformedData: Agent[] = (data || []).map(agent => ({
        ...agent,
        specialty: Array.isArray(agent.specialty) ? agent.specialty[0] || '' : agent.specialty,
      }));

      setAgents(transformedData);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Erro ao carregar agentes",
        description: "Não foi possível carregar os agentes do banco de dados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateAgent = async (
    agentId: string, 
    updates: Partial<Agent>
  ): Promise<boolean> => {
    console.log('🔧 updateAgent called', { agentId, updates });
    
    try {
      // Converter specialty para array se necessário (banco espera array)
      const dbUpdates: any = { ...updates };
      if (dbUpdates.specialty && typeof dbUpdates.specialty === 'string') {
        dbUpdates.specialty = [dbUpdates.specialty];
      }
      
      console.log('📤 Sending to Supabase:', dbUpdates);
      
      const { error } = await supabase
        .from('agent_configs')
        .update(dbUpdates)
        .eq('id', agentId);

      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }

      console.log('✅ Supabase update successful');

      // Atualizar estado local
      setAgents(prev => 
        prev.map(agent => 
          agent.id === agentId ? { ...agent, ...updates } : agent
        )
      );

      toast({
        title: "Agente atualizado",
        description: "As alterações foram salvas com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as alterações",
        variant: "destructive",
      });
      return false;
    }
  };

  const uploadAgentPhoto = async (file: File, agentId: string): Promise<string | null> => {
    try {
      // Criar bucket se não existir (será criado na migration)
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}-${Date.now()}.${fileExt}`;
      const filePath = `agent-photos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('agent-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agent-assets')
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Erro no upload",
        description: "Não foi possível fazer upload da foto",
        variant: "destructive",
      });
      return null;
    }
  };

  const deleteAgent = async (agentId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('agent_configs')
        .delete()
        .eq('id', agentId);

      if (error) throw error;

      // Remover do estado local
      setAgents(prev => prev.filter(agent => agent.id !== agentId));

      toast({
        title: "Agente deletado",
        description: "O agente foi removido com sucesso",
      });

      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Erro ao deletar",
        description: "Não foi possível deletar o agente",
        variant: "destructive",
      });
      return false;
    }
  };

  const createAgent = async (newAgent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>): Promise<boolean> => {
    try {
      // Converter specialty para array se necessário (banco espera array)
      const dbAgent: any = { ...newAgent };
      if (dbAgent.specialty && typeof dbAgent.specialty === 'string') {
        dbAgent.specialty = [dbAgent.specialty];
      }
      
      const { data, error } = await supabase
        .from('agent_configs')
        .insert([dbAgent])
        .select()
        .single();

      if (error) throw error;

      // Adicionar ao estado local
      const transformedAgent: Agent = {
        ...data,
        specialty: Array.isArray(data.specialty) ? data.specialty[0] || '' : data.specialty,
      };
      
      setAgents(prev => [...prev, transformedAgent]);

      toast({
        title: "Agente criado",
        description: `${newAgent.name} foi adicionado ao time com sucesso`,
      });

      return true;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Erro ao criar agente",
        description: "Não foi possível criar o novo agente",
        variant: "destructive",
      });
      return false;
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  return {
    agents,
    loading,
    createAgent,
    updateAgent,
    uploadAgentPhoto,
    deleteAgent,
    refetch: fetchAgents,
  };
}
