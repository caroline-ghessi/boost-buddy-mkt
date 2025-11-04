interface ConversationPreview {
  id: string;
  title: string;
  preview: string;
  status: "completed" | "in_progress";
}

const recentConversations: ConversationPreview[] = [
  {
    id: "1",
    title: "Campanha Black Friday",
    preview: "Estratégia completa...",
    status: "completed",
  },
  {
    id: "2",
    title: "Análise Competitiva",
    preview: "Benchmark da concorrência...",
    status: "in_progress",
  },
  {
    id: "3",
    title: "Otimização SEO",
    preview: "Melhoria do ranking...",
    status: "completed",
  },
];

export function ConversationHistoryCondensed() {
  return (
    <div className="border-t border-gray-700/50 bg-[#2a2a2a]/30">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-white text-sm">Conversas Recentes</h4>
          <button className="text-xs text-[#A1887F] hover:text-white transition-colors">
            Ver Todas
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {recentConversations.map((conv) => (
            <div
              key={conv.id}
              className="min-w-48 p-3 bg-[#1e1e1e] rounded-lg border border-gray-700/50 cursor-pointer hover:border-[#A1887F]/50 transition-all duration-200"
            >
              <h5 className="font-semibold text-white text-xs">{conv.title}</h5>
              <p className="text-xs text-gray-400 mt-1">{conv.preview}</p>
              <span
                className={`text-xs ${
                  conv.status === "completed" ? "text-green-400" : "text-yellow-400"
                }`}
              >
                {conv.status === "completed" ? "Concluída" : "Em andamento"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
