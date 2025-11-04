import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface ChartCardProps {
  title: string;
  subtitle?: string;
  type: "line" | "area" | "bar" | "pie";
  data: any[];
  actions?: React.ReactNode;
}

export function ChartCard({ title, subtitle, type, data, actions }: ChartCardProps) {
  const renderChart = () => {
    switch (type) {
      case "line":
        return (
          <ResponsiveContainer width="100%" height={256}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #374151' }}
                labelStyle={{ color: '#E0E0E0' }}
              />
              <Line type="monotone" dataKey="value" stroke="#A1887F" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case "area":
        return (
          <ResponsiveContainer width="100%" height={256}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #374151' }}
              />
              <Legend />
              <Area type="monotone" dataKey="organic" stackId="1" stroke="#10B981" fill="#10B981" fillOpacity={0.6} name="Orgânico" />
              <Area type="monotone" dataKey="paid" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} name="Pago" />
            </AreaChart>
          </ResponsiveContainer>
        );
      case "bar":
        return (
          <ResponsiveContainer width="100%" height={256}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #374151' }}
              />
              <Bar dataKey="value" fill="#A1887F" />
            </BarChart>
          </ResponsiveContainer>
        );
      case "pie":
        return (
          <ResponsiveContainer width="100%" height={256}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => entry.name}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e1e1e', border: '1px solid #374151' }}
              />
            </PieChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <div className="bg-[#1e1e1e] rounded-xl border border-gray-700/50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-white">{title}</h3>
          {subtitle && <p className="text-sm text-gray-400 mt-1">{subtitle}</p>}
        </div>
        {actions}
      </div>
      {renderChart()}
    </div>
  );
}
