import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { getAgentById } from "@/lib/buddyAgents";

interface Activity {
  id: string;
  type: 'communication' | 'task';
  timestamp: string;
  from_agent?: string;
  to_agent?: string;
  agent_id?: string;
  content: string;
  communication_type?: string;
  task_status?: string;
  task_title?: string;
  campaign_id?: string;
}

export function ActivityFeed() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [filter, setFilter] = useState<'all' | 'communications' | 'tasks'>('all');

  useEffect(() => {
    fetchActivities();
    
    // Subscribe to real-time updates
    const communicationsChannel = supabase
      .channel('activity-feed-communications')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_communications'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    const tasksChannel = supabase
      .channel('activity-feed-tasks')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'agent_tasks'
        },
        () => {
          fetchActivities();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(communicationsChannel);
      supabase.removeChannel(tasksChannel);
    };
  }, []);

  const fetchActivities = async () => {
    try {
      // Fetch recent communications
      const { data: communications } = await supabase
        .from('agent_communications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      // Fetch recent task updates
      const { data: tasks } = await supabase
        .from('agent_tasks')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(20);

      // Merge and sort activities
      const allActivities: Activity[] = [
        ...(communications || []).map(comm => ({
          id: comm.id,
          type: 'communication' as const,
          timestamp: comm.created_at,
          from_agent: comm.from_agent,
          to_agent: comm.to_agent,
          content: comm.content,
          communication_type: comm.type,
          campaign_id: comm.campaign_id,
        })),
        ...(tasks || []).map(task => ({
          id: task.id,
          type: 'task' as const,
          timestamp: task.updated_at,
          agent_id: task.agent_id,
          content: task.description,
          task_status: task.status,
          task_title: task.title,
          campaign_id: task.campaign_id,
        }))
      ];

      allActivities.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setActivities(allActivities.slice(0, 30));
    } catch (error) {
      console.error('Error fetching activities:', error);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'communications') return activity.type === 'communication';
    if (filter === 'tasks') return activity.type === 'task';
    return true;
  });

  const getActivityIcon = (activity: Activity) => {
    if (activity.type === 'communication') {
      switch (activity.communication_type) {
        case 'delegation': return '🎯';
        case 'question': return '❓';
        case 'result': return '✅';
        case 'escalation': return '⚠️';
        case 'update': return '📢';
        default: return '💬';
      }
    } else {
      switch (activity.task_status) {
        case 'completed': return '✅';
        case 'in_progress': return '🔄';
        case 'pending': return '⏳';
        case 'blocked': return '🚫';
        default: return '📋';
      }
    }
  };

  const getActivityMessage = (activity: Activity) => {
    if (activity.type === 'communication') {
      const fromAgent = getAgentById(activity.from_agent || '');
      const toAgent = getAgentById(activity.to_agent || '');
      
      switch (activity.communication_type) {
        case 'delegation':
          return `${fromAgent?.name} delegou tarefa para ${toAgent?.name}`;
        case 'question':
          return `${fromAgent?.name} perguntou para ${toAgent?.name}`;
        case 'result':
          return `${fromAgent?.name} entregou resultado para ${toAgent?.name}`;
        case 'escalation':
          return `${fromAgent?.name} escalou problema para ${toAgent?.name}`;
        case 'update':
          return `${fromAgent?.name} enviou atualização para ${toAgent?.name}`;
        default:
          return `${fromAgent?.name} → ${toAgent?.name}`;
      }
    } else {
      const agent = getAgentById(activity.agent_id || '');
      
      switch (activity.task_status) {
        case 'completed':
          return `${agent?.name} finalizou: ${activity.task_title}`;
        case 'in_progress':
          return `${agent?.name} está trabalhando em: ${activity.task_title}`;
        case 'pending':
          return `Nova tarefa para ${agent?.name}: ${activity.task_title}`;
        case 'blocked':
          return `Tarefa bloqueada para ${agent?.name}: ${activity.task_title}`;
        default:
          return `${agent?.name}: ${activity.task_title}`;
      }
    }
  };

  const getCommunicationTypeColor = (type?: string) => {
    switch (type) {
      case 'delegation': return 'bg-primary/10 text-primary';
      case 'question': return 'bg-blue-500/10 text-blue-600';
      case 'result': return 'bg-green-500/10 text-green-600';
      case 'escalation': return 'bg-red-500/10 text-red-600';
      case 'update': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTaskStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/10 text-green-600';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600';
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'blocked': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Feed de Atividades</h3>
          <p className="text-sm text-muted-foreground">Acompanhe as ações da equipe em tempo real</p>
        </div>
        
        <div className="flex gap-2">
          <Badge
            variant={filter === 'all' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('all')}
          >
            Todas
          </Badge>
          <Badge
            variant={filter === 'communications' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('communications')}
          >
            Comunicações
          </Badge>
          <Badge
            variant={filter === 'tasks' ? 'default' : 'outline'}
            className="cursor-pointer"
            onClick={() => setFilter('tasks')}
          >
            Tarefas
          </Badge>
        </div>
      </div>

      <ScrollArea className="h-[600px]">
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-start gap-4 p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="text-2xl">{getActivityIcon(activity)}</div>
              
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium">{getActivityMessage(activity)}</p>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {activity.content}
                </p>
                
                <div className="flex gap-2">
                  {activity.type === 'communication' && (
                    <Badge className={getCommunicationTypeColor(activity.communication_type)}>
                      {activity.communication_type}
                    </Badge>
                  )}
                  {activity.type === 'task' && (
                    <Badge className={getTaskStatusColor(activity.task_status)}>
                      {activity.task_status}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
}
