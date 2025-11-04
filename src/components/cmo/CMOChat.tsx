import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";
import { BuddyButton } from "@/components/buddy/BuddyButton";
import { BuddyLoadingSpinner } from "@/components/buddy/BuddyLoadingSpinner";
import { RAGUploadWidget } from "@/components/rag/RAGUploadWidget";
import { useCMOChat } from "@/hooks/useCMOChat";

const CMOChat = () => {
  const { messages, isLoading, sendMessage } = useCMOChat();
  const [input, setInput] = useState("");

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    const messageToSend = input;
    setInput("");
    await sendMessage(messageToSend);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Welcome Card */}
      <div className="lg:col-span-3">
        <Card className="bg-[#1e1e1e] border-2 border-gray-700/50 text-white p-8">
          <div className="flex items-start gap-6">
            <div className="relative">
              <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-5xl border-4 border-green-400">
                🐕‍🦺
              </div>
              <span className="absolute bottom-0 right-0 h-5 w-5 bg-green-400 rounded-full border-4 border-[#1e1e1e]" />
            </div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3">Oi! Eu sou o Ricardo 👔</h2>
              <p className="text-gray-300 mb-4 text-lg leading-relaxed">
                Como seu <strong>German Shepherd</strong> de confiança, estou aqui para liderar 
                toda a estratégia de marketing. Lidero um time de <strong>16 especialistas</strong> 
                (cada um com sua expertise única) e vamos fazer sua empresa crescer! 🚀
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-[#A1887F]/20 rounded-full text-sm font-semibold">
                  🎯 Estratégia
                </span>
                <span className="px-4 py-2 bg-[#A1887F]/20 rounded-full text-sm font-semibold">
                  📊 Performance
                </span>
                <span className="px-4 py-2 bg-[#A1887F]/20 rounded-full text-sm font-semibold">
                  🚀 Resultados
                </span>
                <span className="px-4 py-2 bg-[#A1887F]/20 rounded-full text-sm font-semibold">
                  💙 Lealdade
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* RAG Upload */}
      {messages.length === 0 && (
        <div className="lg:col-span-3">
          <RAGUploadWidget />
        </div>
      )}

      {/* Chat Area */}
      <Card className="lg:col-span-2 border-2 border-gray-700/50 bg-[#1e1e1e] flex flex-col h-[600px]">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className={message.role === "assistant" ? "ring-2 ring-[#A1887F]" : ""}>
                <AvatarFallback className={message.role === "assistant" ? "bg-gradient-to-br from-[#A1887F] to-[#8D6E63] text-white text-xl" : "bg-[#2a2a2a]"}>
                  {message.role === "assistant" ? "🐕‍🦺" : "👤"}
                </AvatarFallback>
              </Avatar>
              
              <div
                className={`flex flex-col gap-1 max-w-[80%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-5 py-3 ${
                    message.role === "user"
                      ? "bg-[#A1887F] text-white"
                      : "bg-[#2a2a2a] border border-gray-700 text-gray-200"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 px-2">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && <BuddyLoadingSpinner />}
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-gray-700/50 p-4 bg-[#2a2a2a]/30">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Descreva sua necessidade de marketing... 🐾"
              className="min-h-[80px] resize-none bg-[#2a2a2a] border-2 border-gray-600 focus:border-[#A1887F] text-white"
            />
            <BuddyButton
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="h-[80px] w-[80px] text-lg"
            >
              🎾
            </BuddyButton>
          </div>
        </div>
      </Card>

      {/* CMO Profile + Quick Actions */}
      <div className="space-y-6">
        {/* Profile Card */}
        <Card className="p-6 border-2 border-gray-700/50 bg-[#1e1e1e]">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-28 h-28 ring-4 ring-[#A1887F] text-5xl">
                <AvatarFallback className="bg-gradient-to-br from-[#A1887F] to-[#8D6E63] text-white">
                  🐕‍🦺
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-[#1e1e1e] flex items-center justify-center animate-pulse">
                <span className="text-xs">✓</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-white">Ricardo Mendes</h3>
              <p className="text-sm text-gray-400 font-medium">Chief Marketing Officer</p>
              <p className="text-xs text-[#A1887F] font-semibold mt-1">🐕 German Shepherd</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-[#A1887F]">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Powered by Claude Opus</span>
            </div>
            
            <div className="w-full pt-4 border-t border-gray-700 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Trait</span>
                <span className="font-semibold text-white">⭐ Liderança & Estratégia</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Experiência</span>
                <span className="font-semibold text-white">🦴 15 anos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">The Pack</span>
                <span className="font-semibold text-white">16 especialistas</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 border-2 border-gray-700/50 bg-[#1e1e1e]">
          <h4 className="text-sm font-semibold mb-3 text-gray-400">💡 Sugestões rápidas</h4>
          <div className="space-y-2">
            {[
              { emoji: "🚀", title: "Criar nova campanha", desc: "Vamos começar do zero" },
              { emoji: "📊", title: "Ver performance", desc: "Como estão as campanhas?" },
              { emoji: "🐕", title: "Conhecer o time", desc: "Veja todos os especialistas" },
              { emoji: "🎯", title: "Analisar concorrentes", desc: "O que eles estão fazendo?" },
            ].map((action) => (
              <button
                key={action.title}
                className="w-full p-3 bg-[#2a2a2a]/50 hover:bg-[#A1887F]/10 rounded-xl border border-gray-700 hover:border-[#A1887F] text-left transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl group-hover:scale-110 transition-transform">
                    {action.emoji}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-sm text-white">{action.title}</div>
                    <div className="text-xs text-gray-400">{action.desc}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CMOChat;
