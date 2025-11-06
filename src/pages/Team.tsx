import { useState } from "react";
import { PackStatsCards } from "@/components/team/PackStatsCards";
import { AgentCard } from "@/components/team/AgentCard";
import { AgentDetailModal } from "@/components/team/AgentDetailModal";
import { useAgents, Agent } from "@/hooks/useAgents";
import { Button } from "@/components/ui/button";
import { Plus, Download, Loader2 } from "lucide-react";

export default function Team() {
  const { agents, loading, createAgent, updateAgent, uploadAgentPhoto, deleteAgent } = useAgents();
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estatísticas
  const stats = {
    totalAgents: agents.length,
    activeAgents: agents.filter(a => a.status === 'active' || a.status === 'busy').length,
    tasksToday: 23,
    uptime: "99.2%",
  };

  // Task counts simulados (podem vir do banco depois)
  const taskCounts = Array(agents.length).fill(0).map((_, i) => 
    [23, 12, 8, 15, 18, 9, 11, 0][i] || Math.floor(Math.random() * 20)
  );

  const handleAgentClick = (agent: Agent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleNewAgent = () => {
    setSelectedAgent(null);
    setIsModalOpen(true);
  };

  const handleBackup = () => {
    console.log("Exporting backup");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-[#A1887F]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleNewAgent}
          className="bg-[#A1887F] hover:bg-[#8D6E63]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Novo Agente
        </Button>
        <Button
          onClick={handleBackup}
          variant="outline"
          className="bg-[#2a2a2a] border-gray-600 text-gray-300 hover:bg-[#333333]"
        >
          <Download className="w-4 h-4 mr-2" />
          Backup
        </Button>
      </div>

      {/* Stats Cards */}
      <PackStatsCards {...stats} />

      {/* Agents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {agents.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={{
              id: agent.agent_id,
              name: agent.name,
              role: agent.role,
              level: agent.level === 'level_1' ? 1 : agent.level === 'level_2' ? 2 : 3,
              specialty: agent.specialty,
              emoji: agent.emoji,
              breed: agent.breed,
              breedTrait: agent.breed_trait,
              color: '#A1887F',
              status: (agent.status as any) || 'idle',
              yearsExperience: agent.years_experience || 0,
              team: agent.team,
              imageUrl: agent.avatar,
            }}
            tasksCount={taskCounts[index] || 0}
            llmModel={agent.llm_model || 'GPT-4'}
            temperature={agent.temperature || 0.7}
            isLeader={agent.agent_id === 'cmo'}
            onClick={() => handleAgentClick(agent)}
          />
        ))}
      </div>

      {/* Agent Detail Modal */}
      <AgentDetailModal
        agent={selectedAgent}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAgent(null);
        }}
        onSave={updateAgent}
        onCreate={createAgent}
        onUploadPhoto={uploadAgentPhoto}
        onDelete={async (agentId) => {
          const success = await deleteAgent(agentId);
          if (success) {
            setIsModalOpen(false);
            setSelectedAgent(null);
          }
        }}
      />
    </div>
  );
}
