import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Shield, Edit, Save, RotateCcw, Eye, FlaskConical, History, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import Editor from "@monaco-editor/react";
import ReactDiffViewer from "react-diff-viewer-continued";
import { Textarea } from "@/components/ui/textarea";

interface AgentConfig {
  id: string;
  agent_id: string;
  name: string;
  role: string;
  team: string;
  level: string;
  system_prompt: string;
  updated_at: string;
}

interface PromptHistory {
  id: string;
  version: number;
  system_prompt: string;
  created_at: string;
  changed_by: string | null;
  change_reason: string | null;
}

const SuperAdminPanel = () => {
  const [agents, setAgents] = useState<AgentConfig[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig | null>(null);
  const [editedPrompt, setEditedPrompt] = useState("");
  const [changeReason, setChangeReason] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [showDiff, setShowDiff] = useState(false);
  const [showTest, setShowTest] = useState(false);
  const [promptHistory, setPromptHistory] = useState<PromptHistory[]>([]);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState<PromptHistory | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAgents();
  }, []);

  const fetchAgents = async () => {
    try {
      const { data, error } = await supabase
        .from('agent_configs')
        .select('*')
        .order('level', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setAgents(data || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os agentes",
        variant: "destructive"
      });
    }
  };

  const fetchPromptHistory = async (agentConfigId: string) => {
    try {
      const { data, error } = await supabase
        .from('agent_prompt_history')
        .select('*')
        .eq('agent_config_id', agentConfigId)
        .order('version', { ascending: false });

      if (error) throw error;
      setPromptHistory(data || []);
    } catch (error) {
      console.error('Error fetching prompt history:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar o histórico",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    setEditedPrompt(agent.system_prompt);
    setIsEditing(true);
  };

  const handleViewHistory = async (agent: AgentConfig) => {
    setSelectedAgent(agent);
    await fetchPromptHistory(agent.id);
    setShowHistory(true);
  };

  const handleSave = async () => {
    if (!selectedAgent || !editedPrompt.trim()) {
      toast({
        title: "Erro",
        description: "Prompt não pode estar vazio",
        variant: "destructive"
      });
      return;
    }

    if (!changeReason.trim()) {
      toast({
        title: "Atenção",
        description: "Por favor, informe o motivo da alteração",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('update-agent-prompt', {
        body: {
          agent_id: selectedAgent.agent_id,
          new_prompt: editedPrompt,
          reason: changeReason,
          user_id: null // TODO: Add actual user ID when auth is implemented
        }
      });

      if (error) throw error;

      toast({
        title: "Prompt atualizado",
        description: `Versão ${data.version} do prompt de ${selectedAgent.name} salva com sucesso`,
      });

      setIsEditing(false);
      setSelectedAgent(null);
      setEditedPrompt("");
      setChangeReason("");
      await fetchAgents();
    } catch (error) {
      console.error('Error updating prompt:', error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRollback = async (version: number) => {
    if (!selectedAgent) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('rollback-agent-prompt', {
        body: {
          agent_id: selectedAgent.agent_id,
          version,
          user_id: null
        }
      });

      if (error) throw error;

      toast({
        title: "Rollback realizado",
        description: `Prompt restaurado para versão ${version}`,
      });

      setShowHistory(false);
      await fetchAgents();
    } catch (error) {
      console.error('Error rolling back:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer o rollback",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestPrompt = async () => {
    if (!testMessage.trim()) {
      toast({
        title: "Erro",
        description: "Digite uma mensagem de teste",
        variant: "destructive"
      });
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('test-agent-prompt', {
        body: {
          system_prompt: editedPrompt,
          test_message: testMessage
        }
      });

      if (error) throw error;

      setTestResponse(data.ai_response);
      toast({
        title: "Teste concluído",
        description: `${data.tokens_used} tokens utilizados`,
      });
    } catch (error) {
      console.error('Error testing prompt:', error);
      toast({
        title: "Erro",
        description: "Não foi possível testar o prompt",
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleCompareVersion = (version: PromptHistory) => {
    setSelectedHistoryVersion(version);
    setShowDiff(true);
  };

  const getLevelBadgeColor = (level: string) => {
    switch (level) {
      case '1': return 'bg-primary text-white';
      case '2': return 'bg-secondary text-white';
      case '3': return 'bg-accent text-white';
      default: return 'bg-muted';
    }
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
            Governança total sobre os system prompts de todos os {agents.length} agentes
          </p>
        </div>
        
        <Badge variant="outline" className="text-red-500 border-red-500">
          Acesso Restrito
        </Badge>
      </div>

      {/* Warning */}
      <Card className="glass-panel p-4 border-red-500/20 bg-red-500/5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {agents.map((agent) => (
          <Card key={agent.id} className="glass-panel p-4 hover:border-primary/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold">{agent.name}</h3>
                <p className="text-xs text-muted-foreground">{agent.role}</p>
              </div>
              <Badge className={getLevelBadgeColor(agent.level)}>
                Nível {agent.level}
              </Badge>
            </div>

            <div className="mb-3 p-2 rounded-lg bg-muted/50 border border-border/50 max-h-20 overflow-hidden">
              <p className="text-xs line-clamp-3 font-mono">{agent.system_prompt}</p>
            </div>

            <div className="text-xs text-muted-foreground mb-3">
              Team: <span className="font-medium">{agent.team}</span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 text-xs"
                onClick={() => handleEdit(agent)}
              >
                <Edit className="w-3 h-3 mr-1" />
                Editar
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => handleViewHistory(agent)}
              >
                <History className="w-3 h-3" />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Editando: {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>
              Nível {selectedAgent?.level} • {selectedAgent?.role}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="editor">
                <Edit className="w-4 h-4 mr-2" />
                Editor
              </TabsTrigger>
              <TabsTrigger value="test">
                <FlaskConical className="w-4 h-4 mr-2" />
                Testar Prompt
              </TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              <div>
                <Label>System Prompt</Label>
                <div className="border rounded-lg overflow-hidden mt-2">
                  {typeof window !== 'undefined' && (
                    <Editor
                      height="400px"
                      defaultLanguage="markdown"
                      value={editedPrompt}
                      onChange={(value) => setEditedPrompt(value || "")}
                      theme="vs-dark"
                      options={{
                        minimap: { enabled: false },
                        fontSize: 13,
                        lineNumbers: 'on',
                        wordWrap: 'on',
                        scrollBeyondLastLine: false
                      }}
                    />
                  )}
                  {typeof window === 'undefined' && (
                    <Textarea
                      value={editedPrompt}
                      onChange={(e) => setEditedPrompt(e.target.value)}
                      className="min-h-[400px] font-mono text-sm"
                    />
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Motivo da alteração *</Label>
                <Input
                  id="reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  placeholder="Ex: Ajuste para ser mais assertivo nas respostas"
                  className="mt-2"
                />
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="bg-gradient-to-br from-primary to-secondary hover:opacity-90"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isLoading ? 'Salvando...' : 'Salvar Nova Versão'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditedPrompt("");
                    setChangeReason("");
                  }}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="test" className="space-y-4">
              <div>
                <Label htmlFor="test-message">Mensagem de Teste</Label>
                <Input
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite uma mensagem para testar o prompt..."
                  className="mt-2"
                />
              </div>

              <Button
                onClick={handleTestPrompt}
                disabled={isTesting}
                className="w-full"
              >
                <FlaskConical className="w-4 h-4 mr-2" />
                {isTesting ? 'Testando...' : 'Testar Prompt'}
              </Button>

              {testResponse && (
                <div>
                  <Label>Resposta da IA</Label>
                  <div className="mt-2 p-4 rounded-lg bg-muted border">
                    <p className="text-sm whitespace-pre-wrap">{testResponse}</p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={showHistory} onOpenChange={setShowHistory}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Histórico: {selectedAgent?.name}
            </DialogTitle>
            <DialogDescription>
              Todas as versões do prompt deste agente
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {promptHistory.map((version) => (
              <Card key={version.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <Badge variant="outline" className="mb-2">Versão {version.version}</Badge>
                    <p className="text-sm text-muted-foreground">
                      {new Date(version.created_at).toLocaleString('pt-BR')}
                    </p>
                    {version.change_reason && (
                      <p className="text-sm mt-1">
                        <span className="font-medium">Motivo:</span> {version.change_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCompareVersion(version)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Comparar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRollback(version.version)}
                      disabled={isLoading}
                    >
                      <RotateCcw className="w-4 h-4 mr-1" />
                      Restaurar
                    </Button>
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 border max-h-32 overflow-y-auto">
                  <p className="text-xs font-mono">{version.system_prompt}</p>
                </div>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Diff Dialog */}
      <Dialog open={showDiff} onOpenChange={setShowDiff}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparação de Versões</DialogTitle>
            <DialogDescription>
              Atual vs Versão {selectedHistoryVersion?.version}
            </DialogDescription>
          </DialogHeader>

          {selectedAgent && selectedHistoryVersion && (
            <div className="border rounded-lg overflow-hidden">
              <ReactDiffViewer
                oldValue={selectedHistoryVersion.system_prompt}
                newValue={selectedAgent.system_prompt}
                splitView={true}
                leftTitle={`Versão ${selectedHistoryVersion.version}`}
                rightTitle="Versão Atual"
                showDiffOnly={false}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuperAdminPanel;
