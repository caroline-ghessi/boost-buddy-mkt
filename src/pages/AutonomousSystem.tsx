import AppLayout from "@/components/layout/AppLayout";
import { EventStatsCards } from "@/components/autonomous/EventStatsCards";
import { AutonomousEventsTable } from "@/components/autonomous/AutonomousEventsTable";
import { useAutonomousEvents, useEventStats } from "@/hooks/useAutonomousEvents";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Brain, AlertCircle } from "lucide-react";

const AutonomousSystem = () => {
  const { data: eventsData, isLoading: eventsLoading } = useAutonomousEvents(100);
  const { data: statsData, isLoading: statsLoading } = useEventStats();

  if (eventsLoading || statsLoading) {
    return (
      <AppLayout>
        <div className="container mx-auto p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Sistema Autônomo</h1>
              <p className="text-muted-foreground mt-1">
                Loop de Percepção-Planejamento-Ação
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-[400px]" />
        </div>
      </AppLayout>
    );
  }

  const hasEvents = eventsData && eventsData.length > 0;

  return (
    <AppLayout>
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <Brain className="h-8 w-8 text-primary" />
              <h1 className="text-3xl font-bold">Sistema Autônomo</h1>
            </div>
            <p className="text-muted-foreground mt-1">
              Loop de Percepção-Planejamento-Ação em tempo real
            </p>
          </div>
        </div>

        <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <Brain className="h-4 w-4 text-blue-600 dark:text-blue-400" />
          <AlertTitle className="text-blue-900 dark:text-blue-100">Sistema Agêntico Ativo</AlertTitle>
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            O sistema está monitorando continuamente eventos e tomando decisões proativas:
            <ul className="list-disc ml-4 mt-2 space-y-1">
              <li>Novos dados de competidores disparam análises automáticas</li>
              <li>Campanhas criadas geram tarefas de planejamento</li>
              <li>Performance degradada aciona investigações</li>
              <li>Revisões diárias às 9h avaliam oportunidades</li>
            </ul>
          </AlertDescription>
        </Alert>

        {!hasEvents && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Aguardando eventos</AlertTitle>
            <AlertDescription>
              O sistema ainda não detectou eventos. Crie uma campanha ou adicione dados de competidores para ativar o sistema autônomo.
            </AlertDescription>
          </Alert>
        )}

        <EventStatsCards
          total={statsData?.total || 0}
          processed={statsData?.processed || 0}
          byType={statsData?.byType || {}}
        />

        {hasEvents && eventsData && (
          <AutonomousEventsTable data={eventsData} />
        )}

        <div className="bg-muted p-4 rounded-lg space-y-2">
          <h3 className="font-semibold">Como Funciona</h3>
          <ol className="list-decimal ml-4 space-y-1 text-sm text-muted-foreground">
            <li><strong>Percepção:</strong> Triggers detectam eventos importantes (novos dados, campanhas, alertas)</li>
            <li><strong>Contexto:</strong> Sistema coleta informações relevantes (RAG, métricas, competidores)</li>
            <li><strong>Planejamento:</strong> IA analisa situação e decide quais tarefas criar</li>
            <li><strong>Ação:</strong> Tarefas são roteadas e enfileiradas para execução assíncrona</li>
            <li><strong>Feedback:</strong> Resultados são registrados e informam próximas decisões</li>
          </ol>
        </div>
      </div>
    </AppLayout>
  );
};

export default AutonomousSystem;
