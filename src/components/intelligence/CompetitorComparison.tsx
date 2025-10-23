import { Card } from "@/components/ui/card";
import { CompetitorSummary } from "@/hooks/useCompetitorData";

interface CompetitorComparisonProps {
  competitors: CompetitorSummary[];
}

export function CompetitorComparison({ competitors }: CompetitorComparisonProps) {
  if (competitors.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          Adicione concorrentes para ver análises comparativas.
        </p>
      </Card>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left p-4">Concorrente</th>
            <th className="text-center p-4">Plataformas</th>
            <th className="text-center p-4">Insights</th>
            <th className="text-center p-4">Mudanças (7d)</th>
            <th className="text-center p-4">Status</th>
          </tr>
        </thead>
        <tbody>
          {competitors.map((competitor) => (
            <tr key={competitor.name} className="border-b hover:bg-muted/50">
              <td className="p-4 font-medium">{competitor.name}</td>
              <td className="p-4 text-center">{competitor.platforms.length}</td>
              <td className="p-4 text-center">{competitor.insights}</td>
              <td className="p-4 text-center">
                <span
                  className={`font-bold ${
                    competitor.changesSinceLastWeek > 0
                      ? "text-orange-500"
                      : "text-green-500"
                  }`}
                >
                  {competitor.changesSinceLastWeek > 0 ? "+" : ""}
                  {competitor.changesSinceLastWeek}
                </span>
              </td>
              <td className="p-4 text-center">
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    competitor.status === "monitoring"
                      ? "bg-green-500/10 text-green-500"
                      : "bg-gray-500/10 text-gray-500"
                  }`}
                >
                  {competitor.status === "monitoring" ? "Ativo" : "Pausado"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
