import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompetitorData } from "@/hooks/useCompetitorData";
import { Users, UserPlus, Image, Heart, MessageCircle, Calendar, CheckCircle, BarChart, Clock, AlertCircle } from "lucide-react";
import { formatTimeAgo, getStalenessInfo, formatNextScheduledScrape } from "@/lib/dateUtils";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CompetitorOverviewProps {
  competitor: any;
  insights: CompetitorData[];
}

export function CompetitorOverview({ competitor, insights }: CompetitorOverviewProps) {
  const latestData = insights[0];
  const profile = latestData?.data?.profile;
  const metrics = latestData?.data?.metrics;
  const analysis = latestData?.data?.analysis;
  const scrapeMetadata = latestData?.data?.scrapeMetadata;
  
  // Get staleness information
  const scrapedAt = latestData?.scraped_at || latestData?.data?.scrapeMetadata?.scrapedAt;
  const stalenessInfo = scrapedAt ? getStalenessInfo(scrapedAt) : null;

  if (!latestData) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          Aguardando análise do Thiago Costa... 🐶
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Data Freshness Alert */}
      {stalenessInfo && (
        <Alert variant={stalenessInfo.severity === 'very-stale' ? 'destructive' : 'default'}>
          <Clock className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <span className="font-medium">{stalenessInfo.label}</span>
              {' • '}
              <span className="text-sm opacity-90">
                {scrapeMetadata?.dataSource === 'scheduled_run' 
                  ? '📅 Scraping programado (sextas 7h)' 
                  : '🔄 Scraping manual'}
              </span>
              {stalenessInfo.isStale && (
                <>
                  {' • '}
                  <span className="text-sm">
                    Próxima atualização automática: {formatNextScheduledScrape()}
                  </span>
                </>
              )}
            </div>
            {stalenessInfo.isStale && (
              <Badge variant={stalenessInfo.badgeVariant} className="ml-2">
                <AlertCircle className="w-3 h-3 mr-1" />
                Dados desatualizados
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      )}
      
      {/* SEÇÃO 1: Dados do Perfil */}
      {profile && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Users className="w-5 h-5" />
            Perfil do Instagram
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Seguidores"
              value={profile.followersCount?.toLocaleString()}
              icon={<Users className="w-4 h-4" />}
            />
            <MetricCard
              label="Seguindo"
              value={profile.followsCount?.toLocaleString()}
              icon={<UserPlus className="w-4 h-4" />}
            />
            <MetricCard
              label="Posts"
              value={profile.postsCount?.toLocaleString()}
              icon={<Image className="w-4 h-4" />}
            />
            <MetricCard
              label="Status"
              value={profile.verified ? "Verificado ✓" : "Público"}
              icon={<CheckCircle className="w-4 h-4" />}
            />
          </div>
          
          {profile.biography && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground mb-1">Bio:</p>
              <p className="text-sm">{profile.biography}</p>
            </div>
          )}
        </Card>
      )}

      {/* SEÇÃO 2: Métricas de Conteúdo */}
      {metrics && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5" />
            Performance de Conteúdo
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              label="Posts Analisados"
              value={metrics.totalPostsAnalyzed?.toString()}
              icon={<Image className="w-4 h-4" />}
            />
            <MetricCard
              label="Média de Likes"
              value={metrics.avgLikes?.toLocaleString()}
              icon={<Heart className="w-4 h-4" />}
            />
            <MetricCard
              label="Média de Comentários"
              value={metrics.avgComments?.toLocaleString()}
              icon={<MessageCircle className="w-4 h-4" />}
            />
            <MetricCard
              label="Frequência"
              value={metrics.postingFrequency}
              icon={<Calendar className="w-4 h-4" />}
            />
          </div>

          {/* Engagement Rate */}
          {metrics.avgEngagementRate && (
            <div className="mt-4 p-4 bg-primary/5 rounded-lg">
              <p className="text-sm font-medium">Taxa de Engajamento:</p>
              <p className="text-2xl font-bold text-primary">{metrics.avgEngagementRate}%</p>
            </div>
          )}

          {/* Top Hashtags */}
          {metrics.topHashtags?.length > 0 && (
            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Hashtags mais usadas:</p>
              <div className="flex flex-wrap gap-2">
                {metrics.topHashtags.map((tag: string, i: number) => (
                  <Badge key={i} variant="secondary">{tag}</Badge>
                ))}
              </div>
            </div>
          )}
        </Card>
      )}

      {/* SEÇÃO 3: Análise do Thiago */}
      {analysis && (
        <>
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">🐶 Análise do Thiago Costa</h3>
            <p className="text-muted-foreground">{analysis.summary}</p>
          </Card>

          {/* Profile Analysis */}
          {analysis.profile_analysis && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">👤 Análise do Perfil</h3>
              <div className="space-y-3">
                <div>
                  <Label>Posicionamento:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.profile_analysis.positioning}</p>
                </div>
                <div>
                  <Label>Tamanho da Audiência:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.profile_analysis.audience_size}</p>
                </div>
                <div>
                  <Label>Autoridade:</Label>
                  <p className="text-sm text-muted-foreground mt-1">{analysis.profile_analysis.authority}</p>
                </div>
              </div>
            </Card>
          )}

          {/* Content Strategy */}
          {analysis.content_strategy && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">🎯 Estratégia de Conteúdo</h3>
              <div className="space-y-3">
                {analysis.content_strategy.themes && (
                  <div>
                    <Label>Temas principais:</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {analysis.content_strategy.themes.map((theme: string, i: number) => (
                        <Badge key={i}>{theme}</Badge>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.content_strategy.best_performing_content && (
                  <div>
                    <Label>Conteúdo de melhor performance:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{analysis.content_strategy.best_performing_content}</p>
                  </div>
                )}
                {analysis.content_strategy.hashtag_strategy && (
                  <div>
                    <Label>Estratégia de hashtags:</Label>
                    <p className="text-sm text-muted-foreground mt-1">{analysis.content_strategy.hashtag_strategy}</p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Opportunities */}
          {analysis.opportunities && analysis.opportunities.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">💡 Oportunidades de Diferenciação</h3>
              <ul className="space-y-2">
                {analysis.opportunities.map((opp: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    <span className="text-sm">{opp}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Recommended Actions */}
          {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
            <Card className="p-6 bg-primary/5">
              <h3 className="text-lg font-semibold mb-4">🎯 Ações Recomendadas</h3>
              <ul className="space-y-2">
                {analysis.recommended_actions.map((action: string, i: number) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary">→</span>
                    <span className="text-sm">{action}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function MetricCard({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-semibold">{value || "N/A"}</p>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium mb-1">{children}</p>;
}
