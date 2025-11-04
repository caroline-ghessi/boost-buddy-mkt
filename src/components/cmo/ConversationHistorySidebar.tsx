import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Conversation {
  id: string;
  title: string;
  preview: string;
  status: "completed" | "in_progress";
  timeAgo: string;
}

const mockConversations: Conversation[] = [
  {
    id: "1",
    title: "Campanha Black Friday",
    preview: "Criação de estratégia completa...",
    status: "completed",
    timeAgo: "2h atrás",
  },
  {
    id: "2",
    title: "Análise de Concorrentes",
    preview: "Benchmark da concorrência...",
    status: "in_progress",
    timeAgo: "5h atrás",
  },
  {
    id: "3",
    title: "Otimização SEO",
    preview: "Melhoria do ranking orgânico...",
    status: "completed",
    timeAgo: "1 dia",
  },
  {
    id: "4",
    title: "Conteúdo Redes Sociais",
    preview: "Planejamento de posts mensais...",
    status: "completed",
    timeAgo: "3 dias",
  },
];

export function ConversationHistorySidebar() {
  return (
    <section className="w-80 bg-[#1e1e1e] rounded-xl border border-gray-700/50 flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white">Histórico de Conversas</h3>
        <Button className="mt-3 w-full bg-[#A1887F] text-white hover:bg-[#8D6E63]">
          <Plus className="w-4 h-4 mr-2" />
          Nova Conversa
        </Button>
      </div>
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {mockConversations.map((conv) => (
          <div
            key={conv.id}
            className={`p-3 bg-[#2a2a2a] rounded-lg cursor-pointer hover:bg-[#333333] transition-all duration-200 ${
              conv.id === "1" ? "border-l-4 border-[#A1887F]" : ""
            }`}
          >
            <h4 className="font-semibold text-white text-sm">{conv.title}</h4>
            <p className="text-xs text-gray-400 mt-1">{conv.preview}</p>
            <div className="flex justify-between items-center mt-2">
              <span
                className={`text-xs ${
                  conv.status === "completed" ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {conv.status === "completed" ? "Concluída" : "Em andamento"}
              </span>
              <span className="text-xs text-gray-500">{conv.timeAgo}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
