import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ToolPerformanceData } from "@/hooks/useAgentPerformance";

interface Props {
  data: ToolPerformanceData[];
}

export const ToolPerformanceTable = ({ data }: Props) => {
  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const getStatusBadge = (successRate: number) => {
    if (successRate >= 95) return <Badge className="bg-green-500">Excelente</Badge>;
    if (successRate >= 80) return <Badge className="bg-yellow-500">Bom</Badge>;
    return <Badge className="bg-red-500">Atenção</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Performance por Ferramenta</CardTitle>
        <CardDescription>Estatísticas de uso das ferramentas nos últimos 30 dias</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Ferramenta</TableHead>
              <TableHead className="text-right">Chamadas</TableHead>
              <TableHead className="text-right">Duração Média</TableHead>
              <TableHead className="text-right">Tokens</TableHead>
              <TableHead className="text-right">Custo</TableHead>
              <TableHead className="text-right">Taxa de Sucesso</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((tool) => (
              <TableRow key={tool.tool_name}>
                <TableCell className="font-medium">{tool.tool_name}</TableCell>
                <TableCell className="text-right">{tool.total_calls.toLocaleString()}</TableCell>
                <TableCell className="text-right">{formatDuration(tool.avg_duration_ms)}</TableCell>
                <TableCell className="text-right">{tool.total_tokens?.toLocaleString() || '-'}</TableCell>
                <TableCell className="text-right">{formatCost(tool.total_cost_usd || 0)}</TableCell>
                <TableCell className="text-right">{tool.success_rate_pct.toFixed(1)}%</TableCell>
                <TableCell className="text-right">{getStatusBadge(tool.success_rate_pct)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
