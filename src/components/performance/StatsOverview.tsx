import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Activity, DollarSign, Zap, TrendingUp } from "lucide-react";

interface Props {
  totalExecutions: number;
  totalCost: number;
  totalTokens: number;
  avgDuration: number;
}

export const StatsOverview = ({ totalExecutions, totalCost, totalTokens, avgDuration }: Props) => {
  const stats = [
    {
      title: "Execuções (24h)",
      value: totalExecutions.toLocaleString(),
      icon: Activity,
      description: "Total de ações executadas",
    },
    {
      title: "Custo Total (24h)",
      value: `$${totalCost.toFixed(2)}`,
      icon: DollarSign,
      description: "Custo de LLM e APIs",
    },
    {
      title: "Tokens Usados (24h)",
      value: totalTokens.toLocaleString(),
      icon: Zap,
      description: "Consumo de tokens",
    },
    {
      title: "Duração Média",
      value: `${(avgDuration / 1000).toFixed(2)}s`,
      icon: TrendingUp,
      description: "Tempo médio de execução",
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
