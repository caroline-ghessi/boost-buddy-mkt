interface PackKPISidebarProps {
  agentImages?: Record<string, string>;
}

export function PackKPISidebar({ agentImages }: PackKPISidebarProps) {
  const agents = [
    { name: "Sparky", tasks: 15, image: agentImages?.sparky },
    { name: "Luna", tasks: 12, image: agentImages?.luna },
    { name: "Zeus", tasks: 9, image: agentImages?.zeus },
  ];

  return (
    <section className="w-80 bg-[#1e1e1e] rounded-xl border border-gray-700/50 flex flex-col">
      <div className="p-4 border-b border-gray-700/50">
        <h3 className="text-lg font-bold text-white">KPIs da Matilha</h3>
        <p className="text-sm text-gray-400">Performance das solicitações</p>
      </div>
      <div className="flex-1 p-4 space-y-4 overflow-y-auto">
        {/* Tarefas Concluídas */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-white">Tarefas Concluídas</h4>
            <span className="text-green-400 font-bold">87%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-green-400 h-2 rounded-full" style={{ width: "87%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">23 de 26 tarefas este mês</p>
        </div>

        {/* Tempo Médio */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-white">Tempo Médio</h4>
            <span className="text-blue-400 font-bold">12min</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-blue-400 h-2 rounded-full" style={{ width: "75%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Resposta da matilha</p>
        </div>

        {/* Qualidade */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-white">Qualidade</h4>
            <span className="text-yellow-400 font-bold">9.2/10</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div className="bg-yellow-400 h-2 rounded-full" style={{ width: "92%" }} />
          </div>
          <p className="text-xs text-gray-400 mt-1">Avaliação média das entregas</p>
        </div>

        {/* Produtividade Semanal */}
        <div className="bg-[#2a2a2a] rounded-lg p-4">
          <h4 className="font-semibold text-white mb-3">Produtividade Semanal</h4>
          <div className="h-32 flex items-end justify-between gap-2">
            {[65, 78, 85, 72, 90, 88, 95].map((height, idx) => (
              <div key={idx} className="flex-1 bg-[#A1887F] rounded-t" style={{ height: `${height}%` }} />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-gray-400">
            <span>Seg</span>
            <span>Ter</span>
            <span>Qua</span>
            <span>Qui</span>
            <span>Sex</span>
            <span>Sab</span>
            <span>Dom</span>
          </div>
        </div>

        {/* Agentes Mais Ativos */}
        <div className="space-y-2">
          <h4 className="font-semibold text-white">Agentes Mais Ativos</h4>
          <div className="space-y-2">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-[#A1887F] flex items-center justify-center text-xs">
                    {agent.image ? (
                      <img src={agent.image} alt={agent.name} className="h-full w-full rounded-full object-cover" />
                    ) : (
                      agent.name[0]
                    )}
                  </div>
                  <span className="text-sm text-white">{agent.name}</span>
                </div>
                <span className="text-sm text-green-400">{agent.tasks} tarefas</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
