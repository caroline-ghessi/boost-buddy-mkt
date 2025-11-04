import { BuddyAgent } from "@/lib/buddyAgents";
import { Crown } from "lucide-react";

interface AgentCardProps {
  agent: BuddyAgent;
  tasksCount: number;
  llmModel?: string;
  temperature?: number;
  isLeader?: boolean;
  onClick: () => void;
}

export function AgentCard({ 
  agent, 
  tasksCount, 
  llmModel = "GPT-4", 
  temperature = 0.7,
  isLeader = false,
  onClick 
}: AgentCardProps) {
  const statusConfig = {
    active: { 
      badge: "bg-green-500/20 text-green-400", 
      dot: "bg-green-500", 
      label: "Ativo" 
    },
    idle: { 
      badge: "bg-green-500/20 text-green-400", 
      dot: "bg-green-500", 
      label: "Ativo" 
    },
    busy: { 
      badge: "bg-yellow-500/20 text-yellow-400", 
      dot: "bg-yellow-500", 
      label: "Ocupado" 
    },
  };

  const config = statusConfig[agent.status] || statusConfig.idle;
  const isPaused = tasksCount === 0;

  return (
    <div 
      className="agent-card rounded-xl p-6 cursor-pointer"
      onClick={onClick}
    >
      {/* Header: Photo + Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="relative">
          {agent.imageUrl ? (
            <img 
              className="h-16 w-16 rounded-full object-cover border-2 border-[#A1887F]" 
              src={agent.imageUrl} 
              alt={agent.name}
            />
          ) : (
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-3xl border-2 border-[#A1887F]">
              {agent.emoji}
            </div>
          )}
          
          {/* Leader badge or status dot */}
          {isLeader ? (
            <div className="absolute -bottom-1 -right-1 h-6 w-6 bg-green-500 rounded-full border-2 border-[#1e1e1e] flex items-center justify-center">
              <Crown className="h-3 w-3 text-white" />
            </div>
          ) : (
            <div className={`absolute -bottom-1 -right-1 h-6 w-6 ${isPaused ? 'bg-gray-500' : config.dot} rounded-full border-2 border-[#1e1e1e]`} />
          )}
        </div>
        
        {/* Status Badge */}
        <span className={`px-2 py-1 ${isPaused ? 'bg-gray-500/20 text-gray-400' : config.badge} text-xs rounded-full`}>
          {isPaused ? 'Pausado' : config.label}
        </span>
      </div>

      {/* Agent Info */}
      <h3 className="text-lg font-bold text-white mb-1">{agent.name}</h3>
      <p className="text-sm text-[#A1887F] mb-2">{agent.role} - {agent.breed}</p>
      <p className="text-xs text-gray-400 mb-4 line-clamp-2">{agent.specialty}</p>

      {/* Technical Info */}
      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{llmModel}</span>
        <span>Temp: {temperature.toFixed(1)}</span>
        <span>{tasksCount} tarefas</span>
      </div>
    </div>
  );
}
