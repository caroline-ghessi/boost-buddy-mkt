import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { RAGUploadWidget } from "@/components/rag/RAGUploadWidget";

interface StepFourProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

export default function StepFour({ data, updateData }: StepFourProps) {
  const updateCreativeBrief = (key: string, value: any) => {
    updateData("creativeBrief", {
      ...data.creativeBrief,
      [key]: value,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Sparkles className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Brief Criativo</h2>
      </div>

      <div className="space-y-6">
        {/* Mensagem Principal */}
        <div>
          <Label htmlFor="main-message">Mensagem Principal *</Label>
          <Textarea
            id="main-message"
            placeholder="Ex: Somos a melhor solução para transformar seu negócio digital..."
            rows={4}
            value={data.creativeBrief?.mainMessage || ""}
            onChange={(e) => updateCreativeBrief("mainMessage", e.target.value)}
            className="mt-2"
          />
        </div>

        {/* Tom de Voz */}
        <div>
          <Label htmlFor="tone">Tom de Voz</Label>
          <Select
            value={data.creativeBrief?.toneOfVoice || ""}
            onValueChange={(val) => updateCreativeBrief("toneOfVoice", val)}
          >
            <SelectTrigger id="tone" className="mt-2">
              <SelectValue placeholder="Selecione o tom" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="professional">Profissional</SelectItem>
              <SelectItem value="friendly">Amigável</SelectItem>
              <SelectItem value="fun">Divertido</SelectItem>
              <SelectItem value="inspirational">Inspiracional</SelectItem>
              <SelectItem value="urgent">Urgente</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Palavras-chave */}
        <div>
          <Label htmlFor="keywords">Palavras-chave Obrigatórias</Label>
          <Textarea
            id="keywords"
            placeholder="Ex: inovador, sustentável, premium, tecnologia..."
            rows={2}
            value={data.creativeBrief?.keywords?.join(", ") || ""}
            onChange={(e) =>
              updateCreativeBrief(
                "keywords",
                e.target.value.split(",").map((k) => k.trim()).filter(Boolean)
              )
            }
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separe com vírgulas
          </p>
        </div>

        {/* Palavras a Evitar */}
        <div>
          <Label htmlFor="avoid-words">Palavras/Temas a Evitar</Label>
          <Textarea
            id="avoid-words"
            placeholder="Ex: barato, desconto, promoção, queima..."
            rows={2}
            value={data.creativeBrief?.avoidWords?.join(", ") || ""}
            onChange={(e) =>
              updateCreativeBrief(
                "avoidWords",
                e.target.value.split(",").map((w) => w.trim()).filter(Boolean)
              )
            }
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Separe com vírgulas
          </p>
        </div>

        {/* Brand Guidelines Upload */}
        <Card className="p-4 bg-muted/50">
          <h3 className="font-semibold mb-2">🎨 Brand Guidelines</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Envie documentos com diretrizes da marca para a base de conhecimento
          </p>
          <RAGUploadWidget
            onUploadComplete={() => toast.success("Guidelines atualizadas!")}
          />
        </Card>

        {/* Visual References */}
        <div>
          <Label htmlFor="visual-refs">Referências Visuais (opcional)</Label>
          <Input
            id="visual-refs"
            type="file"
            multiple
            accept="image/*"
            className="mt-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload de imagens inspiracionais
          </p>
        </div>
      </div>
    </Card>
  );
}
