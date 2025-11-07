import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RecentLogData } from "@/hooks/useAgentPerformance";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

interface Props {
  data: RecentLogData[];
}

export const RecentLogsTable = ({ data }: Props) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'timeout':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return null;
    }
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs Recentes</CardTitle>
        <CardDescription>Últimas execuções de ferramentas (atualização automática)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Agente</TableHead>
                <TableHead>Ferramenta</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Duração</TableHead>
                <TableHead className="text-right">Tokens</TableHead>
                <TableHead className="text-right">Custo</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.agent_name || log.agent_id}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{log.tool_name}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(log.status)}
                      {log.status}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {log.duration_ms ? formatDuration(log.duration_ms) : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.tokens_used?.toLocaleString() || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    {log.cost_usd ? `$${log.cost_usd.toFixed(4)}` : '-'}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(log.created_at), { 
                      addSuffix: true, 
                      locale: ptBR 
                    })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
