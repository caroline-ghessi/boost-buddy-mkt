import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, CheckCircle, Clock, Zap } from "lucide-react";

interface Props {
  total: number;
  processed: number;
  byType: Record<string, number>;
}

export const EventStatsCards = ({ total, processed, byType }: Props) => {
  const pending = total - processed;
  const processingRate = total > 0 ? ((processed / total) * 100).toFixed(1) : '0';

  const stats = [
    {
      title: "Eventos Totais (24h)",
      value: total.toLocaleString(),
      icon: Activity,
      description: "Total de eventos percebidos",
    },
    {
      title: "Processados",
      value: processed.toLocaleString(),
      icon: CheckCircle,
      description: `Taxa: ${processingRate}%`,
    },
    {
      title: "Pendentes",
      value: pending.toLocaleString(),
      icon: Clock,
      description: "Aguardando processamento",
    },
    {
      title: "Tipos Únicos",
      value: Object.keys(byType).length.toLocaleString(),
      icon: Zap,
      description: "Diferentes tipos de eventos",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground">{stat.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
