import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Globe, Instagram, Facebook, Linkedin } from "lucide-react";
import { CompetitorSummary } from "@/hooks/useCompetitorData";

interface CompetitorCardProps {
  competitor: CompetitorSummary;
  onClick: () => void;
}

const getPlatformIcon = (platform: string) => {
  switch (platform) {
    case "website":
      return <Globe className="w-4 h-4" />;
    case "instagram":
      return <Instagram className="w-4 h-4" />;
    case "facebook":
      return <Facebook className="w-4 h-4" />;
    case "linkedin":
      return <Linkedin className="w-4 h-4" />;
    default:
      return <Globe className="w-4 h-4" />;
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `há ${diffDays}d`;
  if (diffHours > 0) return `há ${diffHours}h`;
  if (diffMins > 0) return `há ${diffMins}m`;
  return "agora";
};

export function CompetitorCard({ competitor, onClick }: CompetitorCardProps) {
  return (
    <Card
      className="glass-panel p-6 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold">{competitor.name}</h3>
          <p className="text-sm text-muted-foreground">
            {competitor.platforms.length} plataforma{competitor.platforms.length > 1 ? "s" : ""} monitorada{competitor.platforms.length > 1 ? "s" : ""}
          </p>
        </div>
        <Badge variant={competitor.status === "monitoring" ? "default" : "secondary"}>
          {competitor.status === "monitoring" ? "🟢 Ativo" : "⏸️ Pausado"}
        </Badge>
      </div>

      {/* Platform icons */}
      <div className="flex gap-2 mb-4">
        {competitor.platforms.map((platform) => (
          <div
            key={platform}
            className="w-8 h-8 rounded-full bg-muted flex items-center justify-center"
            title={platform}
          >
            {getPlatformIcon(platform)}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-2xl font-bold">{competitor.insights}</p>
          <p className="text-xs text-muted-foreground">Insights</p>
        </div>
        <div>
          <p
            className={`text-2xl font-bold ${
              competitor.changesSinceLastWeek > 0 ? "text-orange-500" : "text-green-500"
            }`}
          >
            {competitor.changesSinceLastWeek > 0 ? "+" : ""}
            {competitor.changesSinceLastWeek}
          </p>
          <p className="text-xs text-muted-foreground">Mudanças (7d)</p>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-border/50">
        <p className="text-xs text-muted-foreground">
          Última atualização: {formatTimeAgo(competitor.lastScraped)}
        </p>
      </div>
    </Card>
  );
}
