import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, TrendingUp, Zap } from "lucide-react";

interface Change {
  description: string;
  impact: "alto" | "médio" | "baixo";
  detectedAt: string;
  category: string;
}

interface ChangeTimelineProps {
  changes: any[];
}

const getImpactIcon = (impact: string) => {
  switch (impact) {
    case "alto":
      return <AlertTriangle className="w-5 h-5 text-red-500" />;
    case "médio":
      return <TrendingUp className="w-5 h-5 text-orange-500" />;
    default:
      return <Zap className="w-5 h-5 text-blue-500" />;
  }
};

const getImpactColor = (impact: string) => {
  switch (impact) {
    case "alto":
      return "bg-red-500/10 text-red-500 border-red-500/20";
    case "médio":
      return "bg-orange-500/10 text-orange-500 border-orange-500/20";
    default:
      return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
};

export function ChangeTimeline({ changes }: ChangeTimelineProps) {
  // Extract all changes from insights
  const allChanges: Change[] = changes
    .filter((item) => item.data_type === "ai_insights")
    .flatMap((item) => {
      const analysis = item.data?.analysis;
      return (analysis?.changes || []).map((change: any) => ({
        ...change,
        detectedAt: item.scraped_at,
      }));
    })
    .sort((a, b) => new Date(b.detectedAt).getTime() - new Date(a.detectedAt).getTime());

  if (allChanges.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          Nenhuma mudança significativa detectada ainda.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {allChanges.map((change, index) => (
        <Card key={index} className="p-4">
          <div className="flex items-start gap-4">
            <div className="mt-1">{getImpactIcon(change.impact)}</div>
            
            <div className="flex-1">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-medium">{change.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {new Date(change.detectedAt).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Badge variant="outline" className={getImpactColor(change.impact)}>
                    {change.impact.toUpperCase()}
                  </Badge>
                  <Badge variant="secondary">{change.category}</Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
}
