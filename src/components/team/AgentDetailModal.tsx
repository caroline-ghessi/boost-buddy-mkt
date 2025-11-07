import { useState, useEffect, useRef } from "react";
import { Agent } from "@/hooks/useAgents";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ModelSelector } from "@/components/admin/ModelSelector";
import { X, Upload, Trash2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (agentId: string, updates: Partial<Agent>) => Promise<boolean>;
  onCreate?: (newAgent: Omit<Agent, 'id' | 'created_at' | 'updated_at'>) => Promise<boolean>;
  onUploadPhoto?: (file: File, agentId: string) => Promise<string | null>;
  onDelete?: (agentId: string) => Promise<void>;
}

export function AgentDetailModal({ agent, isOpen, onClose, onSave, onCreate, onUploadPhoto, onDelete }: AgentDetailModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [agentId, setAgentId] = useState("");
  const [breed, setBreed] = useState("");
  const [breedTrait, setBreedTrait] = useState("");
  const [emoji, setEmoji] = useState("");
  const [team, setTeam] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [yearsExperience, setYearsExperience] = useState(0);
  const [llmModel, setLlmModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const isCreating = !agent;

  useEffect(() => {
    if (agent) {
      // Modo de edição
      setName(agent.name);
      setRole(agent.role);
      setAgentId(agent.agent_id);
      setBreed(agent.breed || "");
      setBreedTrait(agent.breed_trait || "");
      setEmoji(agent.emoji || "🐕");
      setTeam(agent.team || "");
      setSpecialty(agent.specialty || "");
      setYearsExperience(agent.years_experience || 0);
      setLlmModel(agent.llm_model || "gpt-4");
      setTemperature(agent.temperature || 0.7);
      setSystemPrompt(agent.system_prompt || "");
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
      setPreviewImageUrl(null);
      setUploadedImageUrl(null);
    } else {
      // Modo de criação - valores padrão
      setName("");
      setRole("");
      setAgentId("");
      setBreed("Golden Retriever");
      setBreedTrait("Friendly and reliable");
      setEmoji("🐕");
      setTeam("marketing");
      setSpecialty("general");
      setYearsExperience(0);
      setLlmModel("gpt-4o");
      setTemperature(0.7);
      setSystemPrompt("You are a helpful AI assistant.");
      setPreviewImageUrl(null);
      setUploadedImageUrl(null);
    }
  }, [agent]);

  const handleSave = async () => {
    // Validação básica
    if (!name || !role || (!agentId && isCreating)) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha nome, role e agent ID",
        variant: "destructive",
      });
      return;
    }

    // Validar se upload ainda está em andamento
    if (isUploading) {
      toast({
        title: "Upload em andamento",
        description: "Aguarde o upload da foto terminar antes de salvar",
        variant: "destructive",
      });
      return;
    }

    // Validar se usuário selecionou arquivo mas upload falhou
    if (previewImageUrl && !uploadedImageUrl && !agent?.avatar) {
      toast({
        title: "Upload não concluído",
        description: "A foto não foi carregada corretamente. Tente fazer upload novamente.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);

    try {
      if (isCreating && onCreate) {
        // Modo de criação
        const newAgent: Omit<Agent, 'id' | 'created_at' | 'updated_at'> = {
          agent_id: agentId,
          name,
          role,
          breed,
          breed_trait: breedTrait,
          emoji,
          team,
          specialty,
          years_experience: yearsExperience,
          is_active: true,
          llm_model: llmModel,
          temperature,
          system_prompt: systemPrompt,
          avatar: uploadedImageUrl || null,
          level: 'level_1',
        };

        const success = await onCreate(newAgent);
        if (success) {
          onClose();
        }
      } else if (!isCreating && agent && onSave) {
        // Modo de edição
        const updates: Partial<Agent> = {
          name,
          role,
          llm_model: llmModel,
          temperature,
          system_prompt: systemPrompt,
        };

        if (uploadedImageUrl) {
          updates.avatar = uploadedImageUrl;
        }

        const success = await onSave(agent.id, updates);
        if (success) {
          onClose();
        }
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!agent || !onDelete) return;
    
    if (window.confirm(`Tem certeza que deseja deletar o agente ${agent.name}?`)) {
      await onDelete(agent.id);
    }
  };

  const handlePhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onUploadPhoto) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione um arquivo de imagem",
        variant: "destructive",
      });
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O tamanho máximo é 5MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Criar preview local imediato
      const objectUrl = URL.createObjectURL(file);
      setPreviewImageUrl(objectUrl);
      
      // Upload para Supabase Storage (usar temp ID para criação)
      const uploadId = agent?.id || 'temp-' + Date.now();
      const publicUrl = await onUploadPhoto(file, uploadId);
      
      if (publicUrl) {
        setUploadedImageUrl(publicUrl);
        toast({
          title: "✅ Foto carregada com sucesso",
          description: isCreating ? "Agora você pode criar o agente" : "Clique em 'Salvar Alterações' para aplicar",
        });
      }
    } catch (error) {
      toast({
        title: "Erro ao processar imagem",
        description: "Não foi possível carregar a imagem",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleShowHistory = () => {
    toast({
      title: "Histórico de Prompts",
      description: "Funcionalidade em desenvolvimento",
    });
    if (!isCreating) {
      console.log('Mostrando histórico de prompts para:', name);
    }
    // TODO: Implementar modal de histórico quando tiver tabela agent_prompt_history
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border border-gray-700/50 max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            {(previewImageUrl || (!isCreating && agent?.avatar)) ? (
              <img 
                className="h-16 w-16 rounded-full object-cover border-2 border-[#A1887F]" 
                src={previewImageUrl || agent?.avatar} 
                alt={name || "Novo Agente"}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-3xl">
                {emoji}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">
                {isCreating ? "Novo Agente" : name}
              </h2>
              <p className="text-[#A1887F]">{role || "Defina a função"}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-5 w-5 text-gray-400" />
          </Button>
        </DialogHeader>

        {/* Content */}
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <Label className="text-gray-400">Nome do Agente</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>

              <div>
                <Label className="text-gray-400">Função/Especialidade</Label>
                <Input
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                />
              </div>

              {/* Campos adicionais apenas em modo de criação */}
              {isCreating && (
                <>
                  <div>
                    <Label className="text-gray-400">Agent ID *</Label>
                    <Input
                      value={agentId}
                      onChange={(e) => setAgentId(e.target.value)}
                      placeholder="ex: content-writer"
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Raça</Label>
                    <Input
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="ex: Golden Retriever"
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Característica da Raça</Label>
                    <Input
                      value={breedTrait}
                      onChange={(e) => setBreedTrait(e.target.value)}
                      placeholder="ex: Friendly and reliable"
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Emoji</Label>
                    <Input
                      value={emoji}
                      onChange={(e) => setEmoji(e.target.value)}
                      placeholder="🐕"
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Time</Label>
                    <Input
                      value={team}
                      onChange={(e) => setTeam(e.target.value)}
                      placeholder="ex: marketing"
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Especialidade</Label>
                    <Input
                      value={specialty}
                      onChange={(e) => setSpecialty(e.target.value)}
                      placeholder="ex: content creation"
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>

                  <div>
                    <Label className="text-gray-400">Anos de Experiência</Label>
                    <Input
                      type="number"
                      value={yearsExperience}
                      onChange={(e) => setYearsExperience(parseInt(e.target.value) || 0)}
                      className="mt-2 bg-[#2a2a2a] border-gray-600 text-white"
                    />
                  </div>
                </>
              )}

              <div>
                <Label className="text-gray-400">Modelo LLM</Label>
                <div className="mt-2">
                  <ModelSelector 
                    value={llmModel} 
                    onValueChange={setLlmModel} 
                  />
                </div>
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">
                  Temperatura: <span className="text-white font-semibold">{temperature.toFixed(1)}</span>
                </Label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="temp-slider w-full"
                />
              </div>

              <div>
                <Label className="text-gray-400 mb-2 block">Foto do Agente</Label>
                <div className="flex items-center gap-4">
                  {(previewImageUrl || (!isCreating && agent?.avatar)) ? (
                    <img 
                      className="h-20 w-20 rounded-full object-cover border-2 border-[#A1887F]" 
                      src={previewImageUrl || agent?.avatar} 
                      alt={name || "Agente"}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-4xl">
                      {emoji}
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <Button 
                    onClick={handlePhotoUpload}
                    disabled={isUploading}
                    className="bg-[#A1887F] hover:bg-[#8D6E63]"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Enviando..." : "Alterar Foto"}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-gray-400">Prompt do Sistema</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-[#A1887F] hover:text-white"
                    onClick={handleShowHistory}
                  >
                    <History className="w-4 h-4 mr-2" />
                    Ver Histórico
                  </Button>
                </div>
                <Textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  placeholder="Digite o system prompt para este agente..."
                  className="mt-2 bg-[#2a2a2a] border-gray-600 text-white min-h-[300px]"
                />
              </div>

              {!isCreating && (
                <div className="bg-[#2a2a2a]/50 rounded-lg p-4">
                  <h4 className="font-semibold text-white mb-2">Informações do Agente</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Raça:</span>
                      <span className="text-white">{breed}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Trait:</span>
                      <span className="text-white">{breedTrait}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Experiência:</span>
                      <span className="text-white">{yearsExperience} anos</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Time:</span>
                      <span className="text-white">{team}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700/50">
            {!isCreating && (
              <Button
                variant="destructive"
                onClick={handleDelete}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Deletar Agente
              </Button>
            )}
            <div className={`flex gap-3 ${isCreating ? 'ml-auto' : ''}`}>
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#A1887F] hover:bg-[#8D6E63]" 
                onClick={handleSave}
                disabled={isSaving || isUploading}
              >
                {isUploading ? "Upload em andamento..." : (isSaving ? (isCreating ? "Criando..." : "Salvando...") : (isCreating ? "Criar Agente" : "Salvar Alterações"))}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
