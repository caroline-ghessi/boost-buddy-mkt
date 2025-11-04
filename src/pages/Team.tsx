import { useState } from "react";
import { PackStatsCards } from "@/components/team/PackStatsCards";
import { AgentCard } from "@/components/team/AgentCard";
import { AgentDetailModal } from "@/components/team/AgentDetailModal";
import { buddyAgents, BuddyAgent } from "@/lib/buddyAgents";
import { Button } from "@/components/ui/button";
import { Plus, Download } from "lucide-react";

export default function Team() {
  const [selectedAgent, setSelectedAgent] = useState<BuddyAgent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Estatísticas (podem vir de hooks depois)
  const stats = {
    totalAgents: buddyAgents.length,
    activeAgents: buddyAgents.filter(a => a.status === 'active' || a.status === 'busy').length,
    tasksToday: 23,
    uptime: "99.2%",
  };

  // Task counts simulados (podem vir do banco depois)
  const taskCounts = [23, 12, 8, 15, 18, 9, 11, 0];

  const handleAgentClick = (agent: BuddyAgent) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleNewAgent = () => {
    console.log("Creating new agent");
  };

  const handleBackup = () => {
    console.log("Exporting backup");
  };

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
        {buddyAgents.map((agent, index) => (
          <AgentCard
            key={agent.id}
            agent={agent}
            tasksCount={taskCounts[index] || 0}
            llmModel={agent.id === 'cmo' ? 'GPT-4' : index === 2 ? 'Claude 3' : index === 5 ? 'DALL-E 3' : 'GPT-4'}
            temperature={0.3 + (index * 0.1)}
            isLeader={agent.id === 'cmo'}
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
        onSave={(agent) => {
          console.log("Saved agent:", agent);
        }}
        onDelete={(agentId) => {
          console.log("Deleting agent:", agentId);
        }}
      />
    </div>
  );
}
