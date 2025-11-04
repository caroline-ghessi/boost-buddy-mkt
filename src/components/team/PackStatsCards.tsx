import { Users, CheckCircle, Brain, Clock } from "lucide-react";

interface StatsCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  iconBgColor: string;
  iconColor: string;
}

function StatsCard({ icon, label, value, iconBgColor, iconColor }: StatsCardProps) {
  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center gap-3">
        <div className={`h-12 w-12 ${iconBgColor} rounded-lg flex items-center justify-center`}>
          <div className={iconColor}>{icon}</div>
        </div>
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

interface PackStatsCardsProps {
  totalAgents: number;
  activeAgents: number;
  tasksToday: number;
  uptime: string;
}

export function PackStatsCards({ totalAgents, activeAgents, tasksToday, uptime }: PackStatsCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <StatsCard
        icon={<Users className="w-6 h-6" />}
        label="Total de Agentes"
        value={totalAgents}
        iconBgColor="bg-[#A1887F]/20"
        iconColor="text-[#A1887F]"
      />
      <StatsCard
        icon={<CheckCircle className="w-6 h-6" />}
        label="Agentes Ativos"
        value={activeAgents}
        iconBgColor="bg-green-500/20"
        iconColor="text-green-400"
      />
      <StatsCard
        icon={<Brain className="w-6 h-6" />}
        label="Tarefas Hoje"
        value={tasksToday}
        iconBgColor="bg-blue-500/20"
        iconColor="text-blue-400"
      />
      <StatsCard
        icon={<Clock className="w-6 h-6" />}
        label="Uptime Médio"
        value={uptime}
        iconBgColor="bg-yellow-500/20"
        iconColor="text-yellow-400"
      />
    </div>
  );
}
