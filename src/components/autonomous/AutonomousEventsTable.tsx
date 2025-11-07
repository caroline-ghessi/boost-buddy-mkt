import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AutonomousEvent } from "@/hooks/useAutonomousEvents";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CheckCircle2, Clock, Zap, TrendingUp, AlertCircle, Calendar } from "lucide-react";

interface Props {
  data: AutonomousEvent[];
}

export const AutonomousEventsTable = ({ data }: Props) => {
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'new_competitor_data':
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'campaign_created':
        return <Zap className="h-4 w-4 text-green-500" />;
      case 'daily_review':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      case 'performance_degradation':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getEventLabel = (eventType: string) => {
    const labels: Record<string, string> = {
      new_competitor_data: 'Dados de Competidor',
      campaign_created: 'Campanha Criada',
      daily_review: 'Revisão Diária',
      performance_degradation: 'Performance Degradada',
      metrics_alert: 'Alerta de Métricas'
    };
    return labels[eventType] || eventType;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Eventos Autônomos</CardTitle>
        <CardDescription>Sistema de percepção e decisão proativa (atualização automática)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-[600px] overflow-y-auto">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Tipo de Evento</TableHead>
                <TableHead>Metadados</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tarefas Criadas</TableHead>
                <TableHead>Quando</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((event) => (
                <TableRow key={event.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getEventIcon(event.event_type)}
                      <span className="font-medium">{getEventLabel(event.event_type)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-xs text-muted-foreground max-w-xs truncate">
                      {JSON.stringify(event.metadata)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {event.processed ? (
                      <Badge className="bg-green-500 flex items-center gap-1 w-fit">
                        <CheckCircle2 className="h-3 w-3" />
                        Processado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="flex items-center gap-1 w-fit">
                        <Clock className="h-3 w-3" />
                        Pendente
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {event.processing_result?.tasks_created ? (
                      <Badge variant="secondary">
                        {event.processing_result.tasks_created} tarefas
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(event.created_at), {
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
