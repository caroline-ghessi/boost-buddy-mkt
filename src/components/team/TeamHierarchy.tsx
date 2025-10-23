import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Palette, TrendingUp, Video, Megaphone } from "lucide-react";

interface Agent {
  id: string;
  name: string;
  role: string;
  level: number;
  specialty: string;
  avatar: string;
  status: "active" | "idle" | "busy";
  icon: any;
}

const agents: Agent[] = [
  // Level 1 - CMO
  {
    id: "cmo",
    name: "Ricardo Mendes",
    role: "CMO",
    level: 1,
    specialty: "Marketing Strategy",
    avatar: "RM",
    status: "active",
    icon: Target,
  },
  // Level 2 - Intelligence
  {
    id: "ana",
    name: "Ana Costa",
    role: "Market Research",
    level: 2,
    specialty: "Intelligence",
    avatar: "AC",
    status: "active",
    icon: Brain,
  },
  {
    id: "thiago",
    name: "Thiago Silva",
    role: "Data Analyst",
    level: 2,
    specialty: "Intelligence",
    avatar: "TS",
    status: "idle",
    icon: TrendingUp,
  },
  {
    id: "camila",
    name: "Camila Rocha",
    role: "Competitive Intel",
    level: 2,
    specialty: "Intelligence",
    avatar: "CR",
    status: "busy",
    icon: Target,
  },
  // Level 2 - Strategy
  {
    id: "fernando",
    name: "Fernando Lima",
    role: "Brand Strategist",
    level: 2,
    specialty: "Strategy",
    avatar: "FL",
    status: "active",
    icon: Palette,
  },
  {
    id: "juliana",
    name: "Juliana Santos",
    role: "Content Strategist",
    level: 2,
    specialty: "Strategy",
    avatar: "JS",
    status: "idle",
    icon: Megaphone,
  },
  // Level 3 - Executors
  {
    id: "pedro",
    name: "Pedro Alves",
    role: "Copywriter",
    level: 3,
    specialty: "Content Creation",
    avatar: "PA",
    status: "busy",
    icon: Palette,
  },
  {
    id: "larissa",
    name: "Larissa Martins",
    role: "Designer",
    level: 3,
    specialty: "Visual Design",
    avatar: "LM",
    status: "active",
    icon: Palette,
  },
  {
    id: "gustavo",
    name: "Gustavo Freitas",
    role: "Video Producer",
    level: 3,
    specialty: "Video Content",
    avatar: "GF",
    status: "idle",
    icon: Video,
  },
  // Level 3 - Paid Media
  {
    id: "rafael",
    name: "Rafael Torres",
    role: "Google Ads Specialist",
    level: 3,
    specialty: "Paid Search",
    avatar: "RT",
    status: "active",
    icon: TrendingUp,
  },
  {
    id: "isabela",
    name: "Isabela Mendes",
    role: "Meta Ads Specialist",
    level: 3,
    specialty: "Social Ads",
    avatar: "IM",
    status: "busy",
    icon: Megaphone,
  },
];

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

const AgentCard = ({ agent }: { agent: Agent }) => {
  const Icon = agent.icon;
  
  return (
    <Card className="glass-panel p-4 hover:scale-105 transition-transform cursor-pointer group">
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="w-12 h-12 ring-2 ring-primary/50 group-hover:ring-primary transition-all">
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white font-semibold">
              {agent.avatar}
            </AvatarFallback>
          </Avatar>
          <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full ${statusColors[agent.status]} border-2 border-background`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h4 className="font-semibold text-sm truncate">{agent.name}</h4>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
            <Icon className="w-4 h-4 text-primary shrink-0" />
          </div>
          
          <div className="mt-2 flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {agent.specialty}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {statusLabels[agent.status]}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

const TeamHierarchy = () => {
  const level1 = agents.filter((a) => a.level === 1);
  const level2 = agents.filter((a) => a.level === 2);
  const level3 = agents.filter((a) => a.level === 3);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-bold text-gradient mb-2">Hierarquia de Agentes</h2>
        <p className="text-muted-foreground">
          Estrutura organizacional com 3 níveis hierárquicos
        </p>
      </div>

      {/* Level 1 - CMO */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
            1
          </div>
          <h3 className="text-xl font-semibold">Nível 1 - CMO</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {level1.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-gradient-to-b from-primary to-transparent" />
      </div>

      {/* Level 2 - Specialists */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-sm">
            2
          </div>
          <h3 className="text-xl font-semibold">Nível 2 - Especialistas</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {level2.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* Connector */}
      <div className="flex justify-center">
        <div className="w-px h-8 bg-gradient-to-b from-secondary to-transparent" />
      </div>

      {/* Level 3 - Executors */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-sm">
            3
          </div>
          <h3 className="text-xl font-semibold">Nível 3 - Executores</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {level3.map((agent) => (
            <AgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TeamHierarchy;
