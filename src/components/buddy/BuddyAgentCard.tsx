import { BuddyAgent } from "@/lib/buddyAgents";

interface BuddyAgentCardProps {
  agent: BuddyAgent;
  imageUrl?: string;
  onClick?: () => void;
}

export function BuddyAgentCard({ agent, imageUrl, onClick }: BuddyAgentCardProps) {
  const statusColors = {
    active: "bg-green-400",
    idle: "bg-green-400",
    busy: "bg-yellow-400",
  };

  const statusLabels = {
    active: "Idle",
    idle: "Idle",
    busy: "Working...",
  };

  return (
    <div className="agent-card relative rounded-lg overflow-hidden group cursor-pointer" onClick={onClick}>
      {/* Background Image or Emoji */}
      <div className="relative w-full h-48 bg-[#2a2a2a]">
        {imageUrl || agent.imageUrl ? (
          <img 
            src={imageUrl || agent.imageUrl}
            alt={`${agent.name} - ${agent.breed}`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl">
            {agent.emoji}
          </div>
        )}
      </div>

      {/* Hover Overlay */}
      <div className="agent-card-overlay">
        <h4 className="font-bold text-white text-lg">{agent.name}</h4>
        <p className="text-xs text-gray-300">{agent.role}</p>
        <p className="text-xs text-gray-400 mt-1">🐕 {agent.breed}</p>
        <p className="text-xs mt-2 text-green-400 font-semibold flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          {statusLabels[agent.status]}
        </p>
      </div>

      {/* Default Status Bar (hidden on hover) */}
      <div className="absolute bottom-0 left-0 right-0 bg-black/50 p-2 text-center transition-opacity duration-300 group-hover:opacity-0">
        <p className="font-semibold text-white text-sm">{agent.name}</p>
      </div>
    </div>
  );
}
