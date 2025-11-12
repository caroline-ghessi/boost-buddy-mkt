import { useState } from "react";
import { Send, Paperclip, Download, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCMOChat } from "@/hooks/useCMOChat";
import { useAgents } from "@/hooks/useAgents";
import { ConversationHistorySidebar } from "./ConversationHistorySidebar";
import { PackKPISidebar } from "./PackKPISidebar";
import { QuickSuggestions } from "./QuickSuggestions";
import { PackCoordinationPanel } from "./PackCoordinationPanel";
import { ConversationHistoryCondensed } from "./ConversationHistoryCondensed";

export default function CMOChat() {
  const { messages, isLoading, sendMessage } = useCMOChat();
  const { agents } = useAgents();
  const [input, setInput] = useState("");

  // Buscar CMO real (level_1)
  const cmoAgent = agents.find(agent => agent.level === 'level_1' && agent.is_active);

  const handleSend = () => {
    if (input.trim()) {
      sendMessage(input);
      setInput("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  return (
    <div className="flex gap-6 h-[calc(100vh-120px)] overflow-hidden">
      {/* Left Sidebar - Conversation History */}
      <ConversationHistorySidebar />

      {/* Main Chat Section */}
      <section className="flex-1 bg-[#1e1e1e] rounded-xl border border-gray-700/50 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 p-6 border-b border-gray-700/50">
          <div className="relative">
            {cmoAgent?.avatar ? (
              <img 
                src={cmoAgent.avatar} 
                alt={cmoAgent.name}
                className="h-16 w-16 rounded-full object-cover border-4 border-green-400"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-3xl border-4 border-green-400">
                {cmoAgent?.emoji || '🐕‍🦺'}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-4 w-4 bg-green-400 rounded-full border-2 border-[#1e1e1e]" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{cmoAgent?.name || 'CMO'} (CMO)</h2>
            <p className="text-sm text-green-400">Online e coordenando a matilha</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="bg-[#2a2a2a] text-gray-300 hover:bg-[#333333]"
            >
              <Clock className="w-4 h-4 mr-2" />
              Histórico Completo
            </Button>
            <Button
              size="sm"
              className="bg-[#A1887F] text-white hover:bg-[#8D6E63]"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar Chat
            </Button>
          </div>
        </div>

        {/* Chat Window */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {/* Welcome Message */}
          {messages.length === 0 && (
            <>
              <div className="flex justify-start items-end gap-3">
                {cmoAgent?.avatar ? (
                  <img 
                    src={cmoAgent.avatar} 
                    alt={cmoAgent.name}
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#A1887F] flex items-center justify-center text-xl">
                    {cmoAgent?.emoji || '🐕‍🦺'}
                  </div>
                )}
                <div className="chat-bubble-ai max-w-2xl">
                  <p className="text-sm">
                    Olá! Sou o {cmoAgent?.name || 'CMO'}, seu CMO. Estou aqui para coordenar toda a
                    matilha e executar suas estratégias de marketing. Como posso ajudá-lo hoje?
                  </p>
                  <span className="text-xs text-gray-400 mt-2 block">
                    {new Date().toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* Messages */}
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.role === "user" ? "justify-end" : "justify-start"
              } items-end gap-3`}
            >
              {message.role === "assistant" && (
                cmoAgent?.avatar ? (
                  <img 
                    src={cmoAgent.avatar} 
                    alt={cmoAgent.name}
                    className="h-10 w-10 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-[#A1887F] flex items-center justify-center flex-shrink-0">
                    {cmoAgent?.emoji || '🐕‍🦺'}
                  </div>
                )
              )}
              <div
                className={`p-4 rounded-lg max-w-2xl ${
                  message.role === "user" ? "chat-bubble-user" : "chat-bubble-ai"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <span
                  className={`text-xs mt-2 block ${
                    message.role === "user" ? "text-white/70" : "text-gray-400"
                  }`}
                >
                  {message.timestamp.toLocaleTimeString("pt-BR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              {message.role === "user" && (
                <div className="h-10 w-10 rounded-full bg-[#A1887F] flex items-center justify-center flex-shrink-0">
                  👤
                </div>
              )}
            </div>
          ))}

          {/* Pack Coordination Panel - Show after user sends first message */}
          {messages.length > 1 && <PackCoordinationPanel />}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start items-end gap-3">
              {cmoAgent?.avatar ? (
                <img 
                  src={cmoAgent.avatar} 
                  alt={cmoAgent.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-[#A1887F] flex items-center justify-center">
                  {cmoAgent?.emoji || '🐕‍🦺'}
                </div>
              )}
              <div className="chat-bubble-ai p-4 rounded-lg typing-indicator">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conversation History Condensed */}
        {messages.length > 0 && <ConversationHistoryCondensed />}

        {/* Input Section */}
        <div className="p-6 border-t border-gray-700/50">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={`Digite sua solicitação para ${cmoAgent?.name || 'o CMO'}...`}
              className="w-full bg-[#2a2a2a] border border-gray-600 rounded-lg py-4 pl-4 pr-20 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#A1887F]"
              disabled={isLoading}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button className="text-gray-400 hover:text-white transition-colors">
                <Paperclip className="w-5 h-5" />
              </button>
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
          <div className="flex justify-between items-center mt-3">
            <QuickSuggestions onSuggestionClick={handleSuggestionClick} />
            <span className="text-xs text-gray-400">{cmoAgent?.name || 'CMO'} está online</span>
          </div>
        </div>
      </section>

      {/* Right Sidebar - Pack KPIs */}
      <PackKPISidebar />
    </div>
  );
}
