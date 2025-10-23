import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sparkles, Rocket, BarChart3, Users, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { BuddyButton } from "@/components/buddy/BuddyButton";
import { BuddyLoadingSpinner } from "@/components/buddy/BuddyLoadingSpinner";
import { getRandomMessage } from "@/lib/buddyMessages";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const CMOChat = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "🐕 Oi! Eu sou o Ricardo Mendes, seu CMO e German Shepherd de confiança. Como seu melhor amigo no marketing, estou aqui para liderar toda a estratégia. Lidero um time de 16 especialistas incríveis - cada um com sua expertise única - e juntos vamos fazer sua empresa crescer! Como posso ajudar você hoje? 🎯",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "🐕 " + getRandomMessage("success") + " Vou coordenar com The Pack para executar isso perfeitamente!",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
      
      toast({
        title: "🐾 The Pack foi acionado!",
        description: "Os especialistas estão trabalhando na sua solicitação",
      });
    }, 2000);
  };

  const quickActions = [
    {
      icon: Rocket,
      title: "Criar nova campanha",
      description: "Vamos começar do zero",
      emoji: "🚀",
    },
    {
      icon: BarChart3,
      title: "Ver performance",
      description: "Como estão as campanhas?",
      emoji: "📊",
    },
    {
      icon: Users,
      title: "Conhecer o time",
      description: "Veja todos os especialistas",
      emoji: "🐕",
    },
    {
      icon: Target,
      title: "Analisar concorrentes",
      description: "O que eles estão fazendo?",
      emoji: "🎯",
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Welcome Card - Full width on mobile */}
      <div className="lg:col-span-3">
        <Card className="bg-gradient-to-r from-primary via-secondary to-primary text-white p-8 shadow-xl border-0 card-paw">
          <div className="flex items-start gap-6">
            <div className="text-7xl animate-bounce-in">🐕‍🦺</div>
            <div className="flex-1">
              <h2 className="text-3xl font-bold mb-3 flex items-center gap-2">
                Oi! Eu sou o Ricardo 👔
              </h2>
              <p className="text-white/90 mb-4 text-lg leading-relaxed">
                Como seu <strong>German Shepherd</strong> de confiança, estou aqui para liderar 
                toda a estratégia de marketing. Lidero um time de <strong>16 especialistas</strong> 
                (cada um com sua expertise única) e vamos fazer sua empresa crescer! 🚀
              </p>
              <div className="flex flex-wrap gap-2">
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  🎯 Estratégia
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  📊 Performance
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  🚀 Resultados
                </span>
                <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold">
                  💙 Lealdade
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Chat Area */}
      <Card className="lg:col-span-2 border-2 border-primary/20 flex flex-col h-[600px] shadow-lg">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === "user" ? "flex-row-reverse" : "flex-row"
              }`}
            >
              <Avatar className={message.role === "assistant" ? "ring-2 ring-primary" : ""}>
                <AvatarFallback className={message.role === "assistant" ? "bg-gradient-to-br from-primary to-secondary text-white text-xl" : "bg-muted"}>
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
                      ? "bg-gradient-to-r from-primary to-secondary text-white"
                      : "bg-muted border border-border"
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
                <span className="text-xs text-muted-foreground px-2">
                  {message.timestamp.toLocaleTimeString()}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && <BuddyLoadingSpinner />}
        </div>

        {/* Input Area */}
        <div className="border-t-2 border-primary/20 p-4 bg-muted/30">
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
              className="min-h-[80px] resize-none bg-card border-2 border-primary/20 focus:border-primary"
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
        <Card className="p-6 border-2 border-primary/20 shadow-lg">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="relative">
              <Avatar className="w-28 h-28 ring-4 ring-primary card-paw text-5xl">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  🐕‍🦺
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-green-500 border-4 border-card flex items-center justify-center animate-pulse">
                <span className="text-xs">✓</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-xl font-bold">Ricardo Mendes</h3>
              <p className="text-sm text-muted-foreground font-medium">Chief Marketing Officer</p>
              <p className="text-xs text-primary font-semibold mt-1">🐕 German Shepherd</p>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-accent">
              <Sparkles className="w-4 h-4" />
              <span className="font-medium">Powered by Claude Opus</span>
            </div>
            
            <div className="w-full pt-4 border-t border-border space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Trait</span>
                <span className="font-semibold">⭐ Liderança & Estratégia</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Experiência</span>
                <span className="font-semibold">🦴 15 anos</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">The Pack</span>
                <span className="font-semibold">16 especialistas</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Quick Actions */}
        <Card className="p-4 border-2 border-primary/20 shadow-lg">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground">💡 Sugestões rápidas</h4>
          <div className="space-y-2">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <button
                  key={action.title}
                  className="w-full p-3 bg-muted/50 hover:bg-primary/10 rounded-xl border border-border hover:border-primary text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="text-2xl group-hover:scale-110 transition-transform">
                      {action.emoji}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">{action.title}</div>
                      <div className="text-xs text-muted-foreground">{action.description}</div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CMOChat;
