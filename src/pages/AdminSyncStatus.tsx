import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, AlertCircle, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SyncHealth {
  source: string;
  success_count_7d: number;
  failed_count_7d: number;
  success_count_24h: number;
  failed_count_24h: number;
  avg_duration_seconds: number;
  last_success_at: string | null;
  last_failure_at: string | null;
  total_rows_7d: number;
}

interface JobRun {
  id: string;
  job_name: string;
  source: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  rows_processed: number;
  error_message: string | null;
}

export default function AdminSyncStatus() {
  const [healthMetrics, setHealthMetrics] = useState<SyncHealth[]>([]);
  const [recentJobs, setRecentJobs] = useState<JobRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
    
    const interval = setInterval(loadData, 30000); // Atualizar a cada 30s
    return () => clearInterval(interval);
  }, []);

  const loadData = async () => {
    try {
      // Carregar métricas de saúde
      const { data: health, error: healthError } = await supabase
        .from('v_sync_health')
        .select('*');

      if (healthError) throw healthError;
      setHealthMetrics(health || []);

      // Carregar últimas execuções
      const { data: jobs, error: jobsError } = await supabase
        .from('sync_job_runs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(20);

      if (jobsError) throw jobsError;
      setRecentJobs(jobs || []);
    } catch (error) {
      console.error('Error loading sync status:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSourceLabel = (source: string) => {
    const labels: Record<string, string> = {
      google_ads: 'Google Ads',
      google_analytics: 'Google Analytics',
      meta_ads: 'Meta Ads',
      social_media: 'Redes Sociais',
    };
    return labels[source] || source;
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: 'default' | 'destructive' | 'outline' | 'secondary'; icon: any; className?: string }> = {
      success: { variant: 'default' as const, icon: CheckCircle2, className: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
      failed: { variant: 'destructive' as const, icon: AlertCircle },
      running: { variant: 'secondary' as const, icon: Activity, className: 'bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-500/20' },
    };
    
    const config = variants[status] || { variant: 'default' as const, icon: Clock };
    const Icon = config.icon;
    
    return (
      <Badge variant={config.variant} className={`gap-1 ${config.className || ''}`}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    return `${Math.round(seconds / 60)}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Status de Sincronização</h1>
        <p className="text-muted-foreground">Monitoramento de pipelines de dados de terceiros</p>
      </div>

      {/* Métricas de Saúde */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {healthMetrics.map((metric) => {
          const successRate24h = metric.success_count_24h + metric.failed_count_24h > 0
            ? (metric.success_count_24h / (metric.success_count_24h + metric.failed_count_24h)) * 100
            : 0;
          
          const successRate7d = metric.success_count_7d + metric.failed_count_7d > 0
            ? (metric.success_count_7d / (metric.success_count_7d + metric.failed_count_7d)) * 100
            : 0;

          return (
            <Card key={metric.source}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {getSourceLabel(metric.source)}
                  {successRate24h >= 90 ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-orange-500" />
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Sucesso (24h)</span>
                  <span className="text-sm font-semibold">{successRate24h.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Sucesso (7d)</span>
                  <span className="text-sm font-semibold">{successRate7d.toFixed(0)}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Duração média</span>
                  <span className="text-sm">{formatDuration(metric.avg_duration_seconds)}</span>
                </div>
                {metric.last_success_at && (
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    Último sucesso: {formatDistanceToNow(new Date(metric.last_success_at), { locale: ptBR, addSuffix: true })}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Histórico de Execuções */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Execuções Recentes
          </CardTitle>
          <CardDescription>Últimas 20 sincronizações realizadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{getSourceLabel(job.source)}</span>
                    {getStatusBadge(job.status)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {job.job_name} • {formatDistanceToNow(new Date(job.started_at), { locale: ptBR, addSuffix: true })}
                  </div>
                  {job.error_message && (
                    <div className="text-xs text-destructive mt-1 font-mono">{job.error_message}</div>
                  )}
                </div>
                <div className="text-right">
                  {job.finished_at && (
                    <div className="text-sm font-medium">{job.rows_processed} linhas</div>
                  )}
                  {job.finished_at && (
                    <div className="text-xs text-muted-foreground">
                      {formatDuration((new Date(job.finished_at).getTime() - new Date(job.started_at).getTime()) / 1000)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}