import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { AgentPerformanceData } from "@/hooks/useAgentPerformance";
import { format } from "date-fns";

interface Props {
  data: AgentPerformanceData[];
}

export const AgentPerformanceChart = ({ data }: Props) => {
  // Agrupar dados por agente
  const agentIds = Array.from(new Set(data.map(d => d.agent_id)));
  
  // Preparar dados para o gráfico
  const chartData = data.reduce((acc, curr) => {
    const dateKey = format(new Date(curr.day), 'MMM dd');
    const existing = acc.find(item => item.date === dateKey);
    
    if (existing) {
      existing[curr.agent_id] = curr.success_rate_pct;
    } else {
      acc.push({
        date: dateKey,
        [curr.agent_id]: curr.success_rate_pct,
      });
    }
    
    return acc;
  }, [] as any[]);

  // Cores para diferentes agentes
  const colors = [
    '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', 
    '#06b6d4', '#6366f1', '#f43f5e', '#14b8a6', '#a855f7'
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Sucesso por Agente</CardTitle>
        <CardDescription>Performance diária dos agentes ao longo do tempo</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis 
              label={{ value: 'Taxa de Sucesso (%)', angle: -90, position: 'insideLeft' }}
              domain={[0, 100]}
            />
            <Tooltip />
            <Legend />
            {agentIds.map((agentId, idx) => (
              <Line
                key={agentId}
                type="monotone"
                dataKey={agentId}
                stroke={colors[idx % colors.length]}
                name={agentId}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
