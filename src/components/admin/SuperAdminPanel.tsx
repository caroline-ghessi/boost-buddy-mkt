import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Shield, Edit, Save, RotateCcw, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentPrompt {
  agentId: string;
  agentName: string;
  role: string;
  currentPrompt: string;
  version: number;
  lastUpdated: Date;
}

const mockPrompts: AgentPrompt[] = [
  {
    agentId: "cmo",
    agentName: "Ricardo Mendes",
    role: "CMO",
    currentPrompt: "Você é Ricardo Mendes, CMO experiente com 15 anos de experiência. Sua missão é coordenar toda a equipe de marketing e garantir o sucesso das campanhas...",
    version: 3,
    lastUpdated: new Date(),
  },
  {
    agentId: "market-research",
    agentName: "Ana Costa",
    role: "Market Research",
    currentPrompt: "Você é Ana Costa, especialista em pesquisa de mercado. Seu foco é coletar e analisar dados de mercado para informar decisões estratégicas...",
    version: 2,
    lastUpdated: new Date(Date.now() - 86400000),
  },
];

const SuperAdminPanel = () => {
  const [selectedAgent, setSelectedAgent] = useState<AgentPrompt | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const { toast } = useToast();

  const handleEdit = (agent: AgentPrompt) => {
    setSelectedAgent(agent);
    setEditedPrompt(agent.currentPrompt);
    setIsEditing(true);
  };

  const handleSave = () => {
    toast({
      title: "Prompt atualizado",
      description: `Versão ${(selectedAgent?.version || 0) + 1} do prompt de ${selectedAgent?.agentName} salva com sucesso`,
    });
    setIsEditing(false);
    setSelectedAgent(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedAgent(null);
    setEditedPrompt("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center card-glow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-3xl font-bold text-gradient">SuperAdmin Panel</h2>
          </div>
          <p className="text-muted-foreground">
            Governança total sobre os system prompts de todos os agentes
          </p>
        </div>
        
        <Badge variant="outline" className="text-red-500 border-red-500">
          Acesso Restrito
        </Badge>
      </div>

      {/* Warning */}
      <Card className="glass-panel p-4 border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold text-red-500 mb-1">Zona de Alta Autoridade</h4>
            <p className="text-sm text-muted-foreground">
              Alterações nos prompts afetam diretamente o comportamento dos agentes.
              Todas as mudanças são versionadas e auditadas.
            </p>
          </div>
        </div>
      </Card>

      {/* Agent Prompts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {mockPrompts.map((agent) => (
          <Card key={agent.agentId} className="glass-panel p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold">{agent.agentName}</h3>
                <p className="text-sm text-muted-foreground">{agent.role}</p>
              </div>
              <Badge variant="outline">v{agent.version}</Badge>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-muted/50 border border-border/50">
              <p className="text-sm line-clamp-3">{agent.currentPrompt}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
              <span>Última atualização: {agent.lastUpdated.toLocaleDateString()}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => handleEdit(agent)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Editar Prompt
              </Button>
              <Button variant="outline" size="sm">
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm">
                <RotateCcw className="w-4 h-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Modal/Panel */}
      {isEditing && selectedAgent && (
        <Card className="glass-panel p-6 border-2 border-primary">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-semibold">
                Editando: {selectedAgent.agentName}
              </h3>
              <p className="text-sm text-muted-foreground">
                Nova versão: v{selectedAgent.version + 1}
              </p>
            </div>
          </div>

          <Textarea
            value={editedPrompt}
            onChange={(e) => setEditedPrompt(e.target.value)}
            className="min-h-[300px] mb-4 font-mono text-sm"
            placeholder="System prompt do agente..."
          />

          <div className="flex gap-3">
            <Button
              onClick={handleSave}
              className="bg-gradient-to-br from-primary to-secondary hover:opacity-90"
            >
              <Save className="w-4 h-4 mr-2" />
              Salvar Nova Versão
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancelar
            </Button>
          </div>
        </Card>
      )}

      {/* Changelog */}
      <Card className="glass-panel p-6">
        <h3 className="text-xl font-semibold mb-4">Histórico de Alterações</h3>
        <div className="space-y-3">
          {[
            {
              agent: "Ricardo Mendes",
              version: "v2 → v3",
              reason: "Ajuste na personalidade para ser mais assertivo",
              date: new Date(),
              user: "Admin",
            },
            {
              agent: "Ana Costa",
              version: "v1 → v2",
              reason: "Adição de contexto sobre análise competitiva",
              date: new Date(Date.now() - 86400000),
              user: "Admin",
            },
          ].map((log, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border border-border/50 bg-background/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium">{log.agent}</h4>
                  <p className="text-sm text-muted-foreground">{log.reason}</p>
                </div>
                <Badge variant="outline">{log.version}</Badge>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{log.date.toLocaleString()}</span>
                <span>•</span>
                <span>Por: {log.user}</span>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default SuperAdminPanel;
