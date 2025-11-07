import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Tag, CheckCircle, Loader2, XCircle } from "lucide-react";

interface DocumentStatsCardProps {
  documents: {
    category: string | null;
    tags: string[] | null;
    status: string;
    file_size: number | null;
  }[];
}

export function DocumentStatsCard({ documents }: DocumentStatsCardProps) {
  // Count by category
  const categoryCount = documents.reduce((acc, doc) => {
    const cat = doc.category || 'Sem Categoria';
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Count by status
  const statusCount = documents.reduce((acc, doc) => {
    acc[doc.status] = (acc[doc.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Top tags
  const tagCount = documents.reduce((acc, doc) => {
    (doc.tags || []).forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Total size
  const totalSize = documents.reduce((sum, doc) => sum + (doc.file_size || 0), 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(categoryCount).map(([category, count]) => (
              <div key={category} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{category}</span>
                <Badge variant="secondary">{count}</Badge>
              </div>
            ))}
            {Object.keys(categoryCount).length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum documento ainda</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Por Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {statusCount.ready && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  Pronto
                </span>
                <Badge variant="default">{statusCount.ready}</Badge>
              </div>
            )}
            {statusCount.processing && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />
                  Processando
                </span>
                <Badge variant="secondary">{statusCount.processing}</Badge>
              </div>
            )}
            {statusCount.error && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-500" />
                  Erro
                </span>
                <Badge variant="destructive">{statusCount.error}</Badge>
              </div>
            )}
          </div>
          <div className="mt-4 pt-3 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">Total</span>
              <span className="text-muted-foreground">{documents.length} documentos</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="font-medium">Tamanho</span>
              <span className="text-muted-foreground">{totalSizeMB} MB</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Tag className="h-4 w-4" />
            Tags Mais Usadas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {topTags.length > 0 ? (
              topTags.map(([tag, count]) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag} ({count})
                </Badge>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Nenhuma tag ainda</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
