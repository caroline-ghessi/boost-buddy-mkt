import { useState, useEffect, useRef } from "react";
import { Agent } from "@/hooks/useAgents";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Upload, Trash2, History } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface AgentDetailModalProps {
  agent: Agent | null;
  isOpen: boolean;
  onClose: () => void;
  onSave?: (agentId: string, updates: Partial<Agent>) => Promise<boolean>;
  onUploadPhoto?: (file: File, agentId: string) => Promise<string | null>;
  onDelete?: (agentId: string) => Promise<void>;
}

export function AgentDetailModal({ agent, isOpen, onClose, onSave, onUploadPhoto, onDelete }: AgentDetailModalProps) {
  const [name, setName] = useState("");
  const [role, setRole] = useState("");
  const [llmModel, setLlmModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (agent) {
      setName(agent.name);
      setRole(agent.role);
      setLlmModel(agent.llm_model || "gpt-4");
      setTemperature(agent.temperature || 0.7);
      setSystemPrompt(agent.system_prompt || "");
      // Revogar URL antiga antes de resetar
      if (previewImageUrl) {
        URL.revokeObjectURL(previewImageUrl);
      }
      setPreviewImageUrl(null);
      setUploadedImageUrl(null);
    }
  }, [agent]);

  if (!agent) return null;

  const handleSave = async () => {
    if (!agent || !onSave) {
      console.log('❌ handleSave: Missing agent or onSave', { agent: !!agent, onSave: !!onSave });
      return;
    }
    
    console.log('🔵 handleSave called', { agentId: agent.id, name, role, llmModel, temperature });
    
    setIsSaving(true);
    const updates: Partial<Agent> = {
      name,
      role,
      llm_model: llmModel,
      temperature,
      system_prompt: systemPrompt,
    };

    // Se houver uma nova foto, adicionar ao update
    if (uploadedImageUrl) {
      updates.image_url = uploadedImageUrl;
      console.log('🖼️ Including uploaded image:', uploadedImageUrl);
    }

    console.log('💾 Calling onSave with:', { agentId: agent.id, updates });
    const success = await onSave(agent.id, updates);
    console.log('✅ Save result:', success);
    
    setIsSaving(false);
    
    if (success) {
      onClose();
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
    if (!file || !agent || !onUploadPhoto) return;

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
      
      // Upload para Supabase Storage
      const publicUrl = await onUploadPhoto(file, agent.id);
      
      if (publicUrl) {
        setUploadedImageUrl(publicUrl);
        toast({
          title: "Foto carregada",
          description: "Clique em 'Salvar Alterações' para aplicar",
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
    console.log('Mostrando histórico de prompts para:', agent.name);
    // TODO: Implementar modal de histórico quando tiver tabela agent_prompt_history
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border border-gray-700/50 max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <DialogHeader className="flex flex-row items-center justify-between p-6 border-b border-gray-700/50">
          <div className="flex items-center gap-4">
            {(previewImageUrl || agent.image_url) ? (
              <img 
                className="h-16 w-16 rounded-full object-cover border-2 border-[#A1887F]" 
                src={previewImageUrl || agent.image_url} 
                alt={agent.name}
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-3xl">
                {agent.emoji}
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold text-white">{agent.name}</h2>
              <p className="text-[#A1887F]">{agent.role}</p>
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

              <div>
                <Label className="text-gray-400">Modelo LLM</Label>
                <Select value={llmModel} onValueChange={setLlmModel}>
                  <SelectTrigger className="mt-2 bg-[#2a2a2a] border-gray-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gpt-4">GPT-4</SelectItem>
                    <SelectItem value="gpt-3.5">GPT-3.5 Turbo</SelectItem>
                    <SelectItem value="claude-3">Claude 3</SelectItem>
                    <SelectItem value="dall-e-3">DALL-E 3</SelectItem>
                  </SelectContent>
                </Select>
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
                  {(previewImageUrl || agent.image_url) ? (
                    <img 
                      className="h-20 w-20 rounded-full object-cover border-2 border-[#A1887F]" 
                      src={previewImageUrl || agent.image_url} 
                      alt={agent.name}
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-gradient-to-br from-[#A1887F] to-[#8D6E63] flex items-center justify-center text-4xl">
                      {agent.emoji}
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

              <div className="bg-[#2a2a2a]/50 rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Informações do Agente</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Raça:</span>
                    <span className="text-white">{agent.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trait:</span>
                    <span className="text-white">{agent.breed_trait}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Experiência:</span>
                    <span className="text-white">{agent.years_experience || 0} anos</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time:</span>
                    <span className="text-white">{agent.team}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-700/50">
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Deletar Agente
            </Button>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose} disabled={isSaving}>
                Cancelar
              </Button>
              <Button 
                className="bg-[#A1887F] hover:bg-[#8D6E63]" 
                onClick={handleSave}
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
