import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
      content: "Olá! Eu sou Ricardo Mendes, seu CMO de IA. Como posso ajudar você hoje? Posso coordenar toda a equipe para criar campanhas, gerar conteúdo, analisar concorrentes ou executar estratégias de marketing completas.",
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

    // Simulate AI response (will be replaced with actual Lovable AI call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Entendido! Vou coordenar com minha equipe para executar isso. Estou acionando os agentes especializados agora...",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
      
      toast({
        title: "Equipe acionada",
        description: "Os agentes estão trabalhando na sua solicitação",
      });
    }, 1500);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Chat Area */}
      <Card className="lg:col-span-2 glass-panel flex flex-col h-[calc(100vh-16rem)]">
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
                <AvatarFallback className={message.role === "assistant" ? "bg-gradient-to-br from-primary to-secondary text-white" : "bg-muted"}>
                  {message.role === "assistant" ? "RM" : "CEO"}
                </AvatarFallback>
              </Avatar>
              
              <div
                className={`flex flex-col gap-1 max-w-[80%] ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <div
                  className={`rounded-2xl px-4 py-3 ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
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
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="ring-2 ring-primary">
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                  RM
                </AvatarFallback>
              </Avatar>
              <div className="bg-muted rounded-2xl px-4 py-3">
                <div className="flex gap-1">
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.2s]" />
                  <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 p-4">
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
              placeholder="Descreva sua necessidade de marketing..."
              className="min-h-[60px] resize-none bg-background/50"
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-[60px] w-[60px] bg-gradient-to-br from-primary to-secondary hover:opacity-90 transition-opacity"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      {/* CMO Profile */}
      <Card className="glass-panel p-6">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <Avatar className="w-24 h-24 ring-4 ring-primary card-glow">
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl">
                RM
              </AvatarFallback>
            </Avatar>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-green-500 border-4 border-background" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold">Ricardo Mendes</h3>
            <p className="text-sm text-muted-foreground">Chief Marketing Officer</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-accent">
            <Sparkles className="w-4 h-4" />
            <span>Powered by Claude Opus 4</span>
          </div>
          
          <div className="w-full pt-4 border-t border-border/50 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Especialidade</span>
              <span className="font-medium">Marketing Strategy</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Experiência</span>
              <span className="font-medium">15 anos</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Equipe</span>
              <span className="font-medium">12 agentes</span>
            </div>
          </div>
          
          <div className="w-full pt-4">
            <h4 className="text-sm font-semibold mb-2">Capacidades</h4>
            <div className="flex flex-wrap gap-2">
              {["Estratégia", "Campanhas", "Análise", "Creative", "Paid Media"].map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-full text-xs bg-primary/10 text-primary border border-primary/20"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default CMOChat;
