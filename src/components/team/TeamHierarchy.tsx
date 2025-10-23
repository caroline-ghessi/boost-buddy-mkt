import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getAgentsByLevel, getAgentsByTeam, BuddyAgent } from "@/lib/buddyAgents";
import { BuddyAgentCard } from "@/components/buddy/BuddyAgentCard";
import { supabase } from "@/integrations/supabase/client";

interface AgentStatus {
  agent_id: string;
  status: 'available' | 'busy' | 'offline';
  pending_tasks: number;
  active_tasks: number;
}

const TeamHierarchy = () => {
  const level1 = getAgentsByLevel(1);
  const level2 = getAgentsByLevel(2);
  const level3 = getAgentsByLevel(3);
  
  const [agentStatuses, setAgentStatuses] = useState<Record<string, AgentStatus>>({});

  useEffect(() => {
    fetchAgentStatuses();

    // Subscribe to real-time task updates
    const channel = supabase
      .channel('team-hierarchy-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_tasks'
        },
        () => {
          fetchAgentStatuses();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchAgentStatuses = async () => {
    try {
      const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('agent_id, status');

      if (!tasks) return;

      const statusMap: Record<string, AgentStatus> = {};

      tasks.forEach(task => {
        if (!statusMap[task.agent_id]) {
          statusMap[task.agent_id] = {
            agent_id: task.agent_id,
            status: 'available',
            pending_tasks: 0,
            active_tasks: 0,
          };
        }

        if (task.status === 'pending') {
          statusMap[task.agent_id].pending_tasks++;
        } else if (task.status === 'in_progress') {
          statusMap[task.agent_id].active_tasks++;
          statusMap[task.agent_id].status = 'busy';
        }
      });

      setAgentStatuses(statusMap);
    } catch (error) {
      console.error('Error fetching agent statuses:', error);
    }
  };

  const getAgentStatus = (agentId: string) => {
    return agentStatuses[agentId] || {
      agent_id: agentId,
      status: 'available',
      pending_tasks: 0,
      active_tasks: 0,
    };
  };

  const getStatusBadge = (status: 'available' | 'busy' | 'offline') => {
    const colors = {
      available: 'bg-green-500/10 text-green-600',
      busy: 'bg-yellow-500/10 text-yellow-600',
      offline: 'bg-gray-500/10 text-gray-600',
    };
    const labels = {
      available: 'Disponível',
      busy: 'Ocupado',
      offline: 'Offline',
    };
    return <Badge className={colors[status]}>{labels[status]}</Badge>;
  };

  const renderAgentWithStatus = (agent: BuddyAgent) => {
    const status = getAgentStatus(agent.id);
    return (
      <div key={agent.id} className="relative">
        <BuddyAgentCard agent={agent} />
        <div className="absolute top-2 right-2 flex flex-col gap-1 items-end">
          {getStatusBadge(status.status)}
          {status.pending_tasks > 0 && (
            <Badge variant="outline" className="text-xs">
              {status.pending_tasks} pendente{status.pending_tasks > 1 ? 's' : ''}
            </Badge>
          )}
          {status.active_tasks > 0 && (
            <Badge className="bg-blue-500/10 text-blue-600 text-xs">
              {status.active_tasks} em andamento
            </Badge>
          )}
        </div>
      </div>
    );
  };

  // Group level 2 by team
  const intelligenceTeam = getAgentsByTeam("Intelligence");
  const strategyTeam = getAgentsByTeam("Strategy");

  // Group level 3 by team
  const contentTeam = level3.filter(a => a.team === "Content");
  const creativeTeam = level3.filter(a => a.team === "Creative");
  const paidMediaTeam = level3.filter(a => a.team === "Paid Media");
  const qualityTeam = level3.filter(a => a.team === "Quality");

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <span className="text-5xl animate-bounce-in">🐕</span>
          <h2 className="text-4xl font-bold text-gradient">The Pack</h2>
          <span className="text-5xl animate-bounce-in">🐾</span>
        </div>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Conheça os <strong className="text-primary">17 especialistas</strong> que formam o melhor time de marketing. 
          Cada um com sua raça, personalidade e superpoder único!
        </p>
      </div>

      {/* Fun Facts Card */}
      <Card className="bg-gradient-to-r from-accent/10 to-primary/10 p-6 border-2 border-primary/20">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <span>🦴</span>
          Fun Facts sobre The Pack
        </h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-4xl font-bold text-primary mb-1">17</div>
            <div className="text-sm text-muted-foreground font-medium">Especialistas</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-secondary mb-1">15</div>
            <div className="text-sm text-muted-foreground font-medium">Raças diferentes</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-accent mb-1">∞</div>
            <div className="text-sm text-muted-foreground font-medium">Lealdade e dedicação</div>
          </div>
        </div>
      </Card>

      {/* Hierarchy */}
      <div className="space-y-8">
        {/* Level 1 - CMO */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-lg shadow-lg">
              1
            </div>
            <h3 className="text-2xl font-bold">Nível 1 - Liderança</h3>
          </div>
          
          <div className="flex justify-center">
            <div className="w-full max-w-sm">
              {level1.map((agent) => (
                <Card
                  key={agent.id}
                  className="bg-gradient-to-br from-primary to-secondary text-white p-8 shadow-xl border-0 card-paw relative"
                >
                  <div className="absolute top-2 right-2">
                    {getStatusBadge(getAgentStatus(agent.id).status)}
                  </div>
                  <div className="text-center">
                    <div className="text-6xl mb-4 animate-bounce-in">{agent.emoji}</div>
                    <h4 className="text-2xl font-bold mb-2">{agent.name}</h4>
                    <p className="text-white/90 mb-3">{agent.role}</p>
                    <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-semibold mb-4">
                      🐕 {agent.breed}
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                      <p className="text-sm font-medium">⭐ {agent.breedTrait}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-1 h-12 bg-gradient-to-b from-primary to-primary/20 rounded-full" />
        </div>

        {/* Level 2 - Specialists */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center text-white font-bold text-lg shadow-lg">
              2
            </div>
            <h3 className="text-2xl font-bold">Nível 2 - Especialistas</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Intelligence Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🧠</span>
                Intelligence Team
              </h4>
              <div className="space-y-3">
                {intelligenceTeam.map((agent) => renderAgentWithStatus(agent))}
              </div>
            </Card>

            {/* Strategy Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎯</span>
                Strategy Team
              </h4>
              <div className="space-y-3">
                {strategyTeam.map((agent) => renderAgentWithStatus(agent))}
              </div>
            </Card>
          </div>
        </div>

        {/* Connector */}
        <div className="flex justify-center">
          <div className="w-1 h-12 bg-gradient-to-b from-secondary to-secondary/20 rounded-full" />
        </div>

        {/* Level 3 - Executors */}
        <div>
          <div className="flex items-center gap-3 mb-6 justify-center">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
              3
            </div>
            <h3 className="text-2xl font-bold">Nível 3 - Executores</h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Content Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">✍️</span>
                Content Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contentTeam.map((agent) => renderAgentWithStatus(agent))}
              </div>
            </Card>

            {/* Creative Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">🎨</span>
                Creative Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {creativeTeam.map((agent) => renderAgentWithStatus(agent))}
              </div>
            </Card>

            {/* Paid Media Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-accent/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span>
                Paid Media Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {paidMediaTeam.map((agent) => renderAgentWithStatus(agent))}
              </div>
            </Card>

            {/* Quality Team */}
            <Card className="p-6 border-2 border-primary/20 bg-gradient-to-br from-card to-secondary/5">
              <h4 className="text-lg font-bold mb-4 flex items-center gap-2">
                <span className="text-2xl">✅</span>
                Quality Team
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {qualityTeam.map((agent) => renderAgentWithStatus(agent))}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Loyalty Message */}
      <Card className="bg-gradient-to-r from-primary to-secondary text-white p-8 text-center border-0 shadow-xl">
        <div className="text-5xl mb-4">🐕💙</div>
        <h3 className="text-2xl font-bold mb-2">
          Loyalty. Strategy. Results.
        </h3>
        <p className="text-white/90 text-lg">
          The Pack nunca dorme e está sempre pronto para buscar os melhores resultados para você!
        </p>
      </Card>
    </div>
  );
};

export default TeamHierarchy;
