import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Rocket, Sparkles, Loader2, Save } from "lucide-react";

interface StepFiveProps {
  data: any;
  onExecute: () => void;
  onSaveDraft: () => void;
  isExecuting: boolean;
}

export default function StepFive({ data, onExecute, onSaveDraft, isExecuting }: StepFiveProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (date: string) => {
    if (!date) return "Não definido";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-6">Revise sua campanha</h2>

        <div className="space-y-6">
          {/* Nome */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📝 Nome da Campanha</h3>
            <p className="text-lg">{data.name || "Sem nome"}</p>
          </div>

          <Separator />

          {/* Objetivos */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📊 Objetivos</h3>
            <div className="flex flex-wrap gap-2">
              {data.objectives?.map((obj: string) => (
                <Badge key={obj} variant="secondary">
                  {obj}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Público-Alvo */}
          <div>
            <h3 className="text-lg font-semibold mb-2">🎯 Público-Alvo</h3>
            <div className="space-y-1 text-sm">
              <p>
                <strong>Idade:</strong> {data.targetAudience.demographics?.age || "Não definido"}
              </p>
              <p>
                <strong>Gênero:</strong> {data.targetAudience.demographics?.gender || "Não definido"}
              </p>
              <p>
                <strong>Localização:</strong> {data.targetAudience.demographics?.location || "Não definido"}
              </p>
              {data.targetAudience.interests?.length > 0 && (
                <p>
                  <strong>Interesses:</strong> {data.targetAudience.interests.join(", ")}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Canais */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📱 Canais</h3>
            <div className="flex flex-wrap gap-2">
              {data.channels?.map((channel: string) => (
                <Badge key={channel} variant="outline">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Investimento */}
          <div>
            <h3 className="text-lg font-semibold mb-2">💰 Investimento</h3>
            <p className="text-xl font-bold mb-2">
              Total: {formatCurrency(data.budget.total)}
            </p>
            {Object.entries(data.budget.distribution || {}).map(([channel, pct]: [string, any]) => (
              <p key={channel} className="text-sm">
                {channel}: {pct}% ({formatCurrency((data.budget.total * pct) / 100)})
              </p>
            ))}
          </div>

          <Separator />

          {/* Timeline */}
          <div>
            <h3 className="text-lg font-semibold mb-2">📅 Timeline</h3>
            <p className="text-sm">
              {formatDate(data.timeline?.startDate)} até {formatDate(data.timeline?.endDate)}
            </p>
          </div>

          <Separator />

          {/* Mensagem */}
          <div>
            <h3 className="text-lg font-semibold mb-2">💬 Mensagem Criativa</h3>
            <p className="text-sm mb-2">{data.creativeBrief?.mainMessage || "Não definida"}</p>
            {data.creativeBrief?.toneOfVoice && (
              <Badge>{data.creativeBrief.toneOfVoice}</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Estimativa */}
      <Alert className="bg-primary/10 border-primary/20">
        <Sparkles className="w-5 h-5" />
        <AlertTitle className="font-bold">Estimativa de Execução</AlertTitle>
        <AlertDescription className="space-y-1 mt-2">
          <p>⏱️ Tempo estimado: ~5-10 minutos</p>
          <p>🐕 Agentes envolvidos: 8-12 especialistas</p>
          <p>📦 Assets esperados: 10-15 peças criativas</p>
        </AlertDescription>
      </Alert>

      {/* Action Buttons */}
      <div className="flex gap-4 justify-end">
        <Button variant="outline" onClick={onSaveDraft} disabled={isExecuting}>
          <Save className="w-4 h-4 mr-2" />
          Salvar Rascunho
        </Button>
        <Button size="lg" onClick={onExecute} disabled={isExecuting}>
          {isExecuting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Executando...
            </>
          ) : (
            <>
              <Rocket className="w-5 h-5 mr-2" />
              🚀 Executar Campanha
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
