import { Input } from "@/components/ui/input";
import { Send } from "lucide-react";
import { useState } from "react";

interface Insight {
  message: string;
  timestamp: string;
  type: "info" | "suggestion" | "warning";
}

const initialInsights: Insight[] = [
  {
    message: "Olá! Identifiquei que sua campanha 'Black Friday 2024' teve um CTR 23% acima da média. Quer saber o que funcionou?",
    timestamp: "Agora",
    type: "info",
  },
  {
    message: "💡 Insight: Dispositivos mobile representam 68% das conversões, mas apenas 45% do investimento. Considere realocar budget.",
    timestamp: "5 min atrás",
    type: "suggestion",
  },
  {
    message: "🔍 Análise: Horário entre 19h-22h apresenta CPA 35% menor. Recomendo aumentar lances neste período.",
    timestamp: "15 min atrás",
    type: "info",
  },
];

const quickQuestions = [
  "Qual campanha tem melhor ROI?",
  "Por que as conversões caíram?",
  "Onde investir mais budget?",
  "Análise de sazonalidade",
];

export function InsightsAgentSidebar() {
  const [insights] = useState<Insight[]>(initialInsights);
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (!message.trim()) return;
    // Aqui você pode integrar com um agente real
    setMessage("");
  };

  return (
    <section className="w-80 bg-[#1e1e1e] rounded-xl border border-gray-700/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-700/50">
        <div className="flex items-center gap-3 mb-3">
          <img 
            className="h-12 w-12 rounded-full object-cover border-2 border-[#A1887F]" 
            src="https://storage.googleapis.com/uxpilot-auth.appspot.com/8c3e7d9f2a-4b1a2c8e9f7d6e5a3b2c.png" 
            alt="Sherlock"
          />
          <div>
            <h3 className="text-lg font-bold text-white">Sherlock</h3>
            <p className="text-sm text-[#A1887F]">Agente de Insights</p>
          </div>
        </div>
        <p className="text-xs text-gray-400">Pergunte sobre insights específicos dos seus dados</p>
      </div>

      {/* Insights Chat */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {insights.map((insight, index) => (
          <div key={index} className="insight-bubble p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <img 
                className="h-6 w-6 rounded-full object-cover" 
                src="https://storage.googleapis.com/uxpilot-auth.appspot.com/8c3e7d9f2a-4b1a2c8e9f7d6e5a3b2c.png" 
                alt="Sherlock"
              />
              <div className="flex-1">
                <p className="text-sm text-white">{insight.message}</p>
                <span className="text-xs text-gray-400 mt-1 block">{insight.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Insights */}
      <div className="p-4 border-t border-gray-700/50">
        <h4 className="font-semibold text-white text-sm mb-3">Perguntas Rápidas</h4>
        <div className="space-y-2">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              className="w-full text-left p-2 bg-[#2a2a2a] rounded-lg text-sm text-gray-300 hover:bg-[#333333] hover:text-white transition-all duration-200"
            >
              {question}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-700/50">
        <div className="relative">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Pergunte sobre seus dados..."
            className="w-full bg-[#2a2a2a] border-gray-600 text-white pr-12"
          />
          <button
            onClick={handleSend}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-xs text-green-400">Sherlock está online</span>
          <span className="text-xs text-gray-400">Análise em tempo real</span>
        </div>
      </div>
    </section>
  );
}
