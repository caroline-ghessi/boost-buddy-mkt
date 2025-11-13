import { StatsOverview } from "@/components/performance/StatsOverview";
import { AgentPerformanceChart } from "@/components/performance/AgentPerformanceChart";
import { ToolPerformanceTable } from "@/components/performance/ToolPerformanceTable";
import { RecentLogsTable } from "@/components/performance/RecentLogsTable";
import { useAgentPerformance, useToolPerformance, useRecentLogs, useAgentStats } from "@/hooks/useAgentPerformance";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const AgentsPerformance = () => {
  const { data: performanceData, isLoading: perfLoading } = useAgentPerformance(30);
  const { data: toolData, isLoading: toolLoading } = useToolPerformance();
  const { data: logsData, isLoading: logsLoading } = useRecentLogs(100);
  const { data: statsData, isLoading: statsLoading } = useAgentStats();

  if (perfLoading || toolLoading || logsLoading || statsLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Performance dos Agentes</h1>
            <p className="text-muted-foreground mt-1">
              Monitoramento e observabilidade do sistema agêntico
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-[400px]" />
        <Skeleton className="h-[400px]" />
      </div>
    );
  }

  const hasData = performanceData && performanceData.length > 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Performance dos Agentes</h1>
          <p className="text-muted-foreground mt-1">
            Monitoramento e observabilidade do sistema agêntico
          </p>
        </div>
      </div>

      {!hasData && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sem dados ainda</AlertTitle>
          <AlertDescription>
            Ainda não há dados de performance. Os agentes começarão a gerar logs assim que executarem tarefas.
          </AlertDescription>
        </Alert>
      )}

      <StatsOverview
        totalExecutions={statsData?.total_executions_24h || 0}
        totalCost={statsData?.total_cost_24h || 0}
        totalTokens={statsData?.total_tokens_24h || 0}
        avgDuration={statsData?.avg_duration_24h || 0}
      />

      {hasData && performanceData && (
        <AgentPerformanceChart data={performanceData} />
      )}

      {toolData && toolData.length > 0 && (
        <ToolPerformanceTable data={toolData} />
      )}

      {logsData && logsData.length > 0 && (
        <RecentLogsTable data={logsData} />
      )}
    </div>
  );
};

export default AgentsPerformance;
