import { Users } from "lucide-react";

interface AgentActivity {
  name: string;
  role: string;
  status: "active" | "creating" | "planning";
  activity: string;
  image?: string;
}

const mockActivities: AgentActivity[] = [
  {
    name: "Sparky",
    role: "SEO",
    status: "active",
    activity: "Analisando palavras-chave para o novo produto. Identificando oportunidades de ranking...",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/ea886268d4-149ab5e27ad9e08bf054.png",
  },
  {
    name: "Luna",
    role: "Content",
    status: "creating",
    activity: "Desenvolvendo calendário de conteúdo e copy para landing page do produto...",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/097ef8700a-270b1103ccad4933f76b.png",
  },
  {
    name: "Zeus",
    role: "Ads",
    status: "planning",
    activity: "Estruturando campanhas no Google Ads e Meta Ads. Definindo audiências e orçamentos...",
    image: "https://storage.googleapis.com/uxpilot-auth.appspot.com/c08e99d3f5-82d1187b0160d3348a04.png",
  },
];

export function PackCoordinationPanel() {
  const getStatusColor = (status: AgentActivity["status"]) => {
    switch (status) {
      case "active":
        return "text-green-400 bg-green-400/20";
      case "creating":
      case "planning":
        return "text-yellow-400 bg-yellow-400/20";
      default:
        return "text-gray-400 bg-gray-400/20";
    }
  };

  const getStatusLabel = (status: AgentActivity["status"]) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "creating":
        return "Criando";
      case "planning":
        return "Planejando";
      default:
        return "Idle";
    }
  };

  return (
    <div className="bg-[#2a2a2a]/50 rounded-lg p-6 my-4 border-l-4 border-[#A1887F]">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-[#A1887F]" />
        <span className="font-semibold text-white text-lg">Coordenação da Matilha</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockActivities.map((agent) => (
          <div key={agent.name} className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-full bg-[#A1887F] flex items-center justify-center flex-shrink-0">
              {agent.image ? (
                <img
                  src={agent.image}
                  alt={agent.name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white font-bold">{agent.name[0]}</span>
              )}
            </div>
            <div className="chat-bubble-pack flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold text-white">
                  {agent.name} ({agent.role})
                </span>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(agent.status)}`}>
                  {getStatusLabel(agent.status)}
                </span>
              </div>
              <p className="text-sm">{agent.activity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
