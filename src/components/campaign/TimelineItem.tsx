import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TimelineItemProps {
  agentName: string;
  action: string;
  status: string;
  timestamp: string;
}

export default function TimelineItem({ agentName, action, status, timestamp }: TimelineItemProps) {
  const getAgentEmoji = (name: string) => {
    const emojiMap: Record<string, string> = {
      cmo_ricardo: "🐕",
      ana_costa: "🔍",
      thiago_silva: "🎯",
      camila_santos: "📊",
      pedro_lima: "✍️",
      marina_oliveira: "🎨",
      lucas_ferreira: "🎬",
      rafael_costa: "🔍",
      isabela_martins: "📱",
      renata_alves: "✅",
      andre_silva: "👔",
    };
    return emojiMap[name] || "🐕";
  };

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "agora";
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500/10 text-green-500 border-green-500/20";
      case "in_progress":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "failed":
        return "bg-red-500/10 text-red-500 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Avatar className="w-10 h-10">
        <AvatarFallback className="text-lg">
          {getAgentEmoji(agentName)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{agentName.replace(/_/g, " ")}</p>
        <p className="text-xs text-muted-foreground truncate">{action}</p>
        <p className="text-xs text-muted-foreground mt-1">{formatTimeAgo(timestamp)}</p>
      </div>

      <Badge variant="outline" className={cn("text-xs", getStatusColor(status))}>
        {status}
      </Badge>
    </div>
  );
}
