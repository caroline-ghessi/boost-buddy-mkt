import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BuddyAgent } from "@/lib/buddyAgents";

interface BuddyAgentCardProps {
  agent: BuddyAgent;
  onClick?: () => void;
}

export function BuddyAgentCard({ agent, onClick }: BuddyAgentCardProps) {
  const statusColors = {
    active: "bg-green-500",
    idle: "bg-yellow-500",
    busy: "bg-blue-500",
  };

  const statusLabels = {
    active: "Ativo",
    idle: "Disponível",
    busy: "Trabalhando",
  };

  return (
    <Card
      className="p-4 hover:scale-105 transition-all cursor-pointer border-2 border-border hover:border-primary shadow-sm hover:shadow-md bg-card"
      onClick={onClick}
    >
      {/* Avatar with emoji */}
      <div className="text-center mb-3">
        <div className="text-5xl mb-2 inline-block animate-bounce-in">
          {agent.emoji}
        </div>
      </div>

      {/* Breed badge */}
      <div className="flex justify-center mb-3">
        <Badge
          variant="outline"
          className="text-xs font-semibold bg-primary/10 text-primary border-primary/30"
        >
          {agent.breed}
        </Badge>
      </div>

      {/* Name and role */}
      <div className="text-center mb-3">
        <h3 className="font-bold text-sm text-foreground mb-1">{agent.name}</h3>
        <p className="text-xs text-muted-foreground">{agent.role}</p>
      </div>

      {/* Breed trait */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg px-3 py-2 mb-3">
        <p className="text-xs text-center font-medium text-foreground flex items-center justify-center gap-1">
          <span>⭐</span>
          {agent.breedTrait}
        </p>
      </div>

      {/* Status and experience */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${statusColors[agent.status]}`} />
          <span className="text-muted-foreground">{statusLabels[agent.status]}</span>
        </div>
        <span className="text-muted-foreground">
          🦴 {agent.yearsExperience} anos
        </span>
      </div>
    </Card>
  );
}
