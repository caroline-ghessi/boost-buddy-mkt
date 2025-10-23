import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Image, Video, File } from "lucide-react";

interface AssetPreviewCardProps {
  asset: any;
  onClick?: () => void;
}

export default function AssetPreviewCard({ asset, onClick }: AssetPreviewCardProps) {
  const getAssetIcon = (type: string) => {
    switch (type) {
      case "image":
        return <Image className="w-6 h-6" />;
      case "video":
        return <Video className="w-6 h-6" />;
      case "copy":
        return <FileText className="w-6 h-6" />;
      default:
        return <File className="w-6 h-6" />;
    }
  };

  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      image: "Imagem",
      video: "Vídeo",
      copy: "Copy",
      landing_page: "Landing Page",
      ad_creative: "Criativo",
    };
    return labels[type] || type;
  };

  return (
    <Card
      className="p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          {getAssetIcon(asset.asset_type)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{asset.name || "Sem nome"}</p>
          <Badge variant="secondary" className="text-xs mt-1">
            {getAssetTypeLabel(asset.asset_type)}
          </Badge>
        </div>
      </div>

      {asset.content && (
        <div className="text-xs text-muted-foreground line-clamp-3 bg-muted/50 p-2 rounded">
          {typeof asset.content === "string"
            ? asset.content
            : JSON.stringify(asset.content).substring(0, 100)}
        </div>
      )}

      {asset.created_by_agent && (
        <p className="text-xs text-muted-foreground mt-2">
          Por: {asset.created_by_agent.replace(/_/g, " ")}
        </p>
      )}
    </Card>
  );
}
