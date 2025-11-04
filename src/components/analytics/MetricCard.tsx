interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  icon: React.ReactNode;
  color: "green" | "blue" | "yellow" | "purple";
  progress: number;
}

export function MetricCard({ title, value, change, icon, color, progress }: MetricCardProps) {
  const colorClasses = {
    green: {
      bg: "bg-green-500/20",
      text: "text-green-400",
      progress: "bg-green-400",
    },
    blue: {
      bg: "bg-blue-500/20",
      text: "text-blue-400",
      progress: "bg-blue-400",
    },
    yellow: {
      bg: "bg-yellow-500/20",
      text: "text-yellow-400",
      progress: "bg-yellow-400",
    },
    purple: {
      bg: "bg-purple-500/20",
      text: "text-purple-400",
      progress: "bg-purple-400",
    },
  };

  const classes = colorClasses[color];

  return (
    <div className="metric-card rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`h-12 w-12 ${classes.bg} rounded-lg flex items-center justify-center`}>
            <div className={classes.text}>{icon}</div>
          </div>
          <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        </div>
        <span className={`text-sm font-semibold ${classes.text}`}>{change}</span>
      </div>
      <div className="w-full bg-gray-700 rounded-full h-2">
        <div 
          className={`${classes.progress} h-2 rounded-full transition-all duration-300`} 
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
