import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompetitorData } from "@/hooks/useCompetitorData";

interface CompetitorOverviewProps {
  competitor: any;
  insights: CompetitorData[];
}

export function CompetitorOverview({ competitor, insights }: CompetitorOverviewProps) {
  const latestInsight = insights[0];
  const analysis = latestInsight?.data?.analysis;

  if (!analysis) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          Aguardando análise do Thiago Costa... 🐶
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">📊 Resumo Executivo</h3>
        <p className="text-muted-foreground">{analysis.summary}</p>
      </Card>

      {/* Messaging */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">💬 Mensagem e Posicionamento</h3>
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">Mensagem Principal</Label>
            <p className="text-muted-foreground">{analysis.messaging?.mainMessage}</p>
          </div>
          <div>
            <Label className="text-sm font-medium">Tom de Voz</Label>
            <p className="text-muted-foreground">{analysis.messaging?.tone}</p>
          </div>
          {analysis.messaging?.keywords && (
            <div>
              <Label className="text-sm font-medium">Keywords</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {analysis.messaging.keywords.map((keyword: string, i: number) => (
                  <Badge key={i} variant="secondary">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Features */}
      {analysis.features && analysis.features.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">🎯 Features e Diferenciais</h3>
          <ul className="space-y-2">
            {analysis.features.map((feature: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span className="text-muted-foreground">{feature}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Strategic Actions */}
      {analysis.strategicActions && analysis.strategicActions.length > 0 && (
        <Card className="p-6 bg-primary/5">
          <h3 className="text-lg font-semibold mb-4">🎯 Ações Estratégicas Sugeridas</h3>
          <ul className="space-y-2">
            {analysis.strategicActions.map((action: string, i: number) => (
              <li key={i} className="flex items-start gap-2">
                <span className="text-primary">→</span>
                <span>{action}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-sm font-medium mb-1 ${className}`}>{children}</p>;
}
