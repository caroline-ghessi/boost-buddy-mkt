import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

interface EmptyStateCardProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyStateCard({ title, description, actionLabel, onAction }: EmptyStateCardProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction}>{actionLabel}</Button>
        )}
      </CardContent>
    </Card>
  );
}
