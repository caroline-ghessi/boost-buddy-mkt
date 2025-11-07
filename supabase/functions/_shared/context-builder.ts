import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

interface ContextOptions {
  userId: string;
  taskType: string;
  campaignId?: string;
  query?: string;
  includeRAG?: boolean;
  includeMetrics?: boolean;
  includeCompetitors?: boolean;
  includeSocialMedia?: boolean;
}

interface ContextData {
  ragContext: string;
  metricsContext: string;
  competitorsContext: string;
  socialMediaContext: string;
  fullContext: string;
}

export async function buildAgentContext(
  options: ContextOptions,
  supabase: any
): Promise<ContextData> {
  const parts: string[] = [];
  let ragContext = '';
  let metricsContext = '';
  let competitorsContext = '';
  let socialMediaContext = '';

  // 1. RAG Context - Buscar conhecimento relevante
  if (options.includeRAG !== false) {
    try {
      const queryText = options.query || `${options.taskType} for campaign`;
      
      const { data: ragData, error: ragError } = await supabase.functions.invoke('query-rag', {
        body: { 
          query: queryText,
          matchThreshold: 0.7,
          matchCount: 5 
        }
      });

      if (!ragError && ragData?.chunks?.length > 0) {
        const ragChunks = ragData.chunks
          .map((chunk: any) => `- ${chunk.content} (relevância: ${(chunk.similarity * 100).toFixed(0)}%)`)
          .join('\n');
        
        ragContext = `\n## 📚 Conhecimento Base Relevante:\n${ragChunks}\n`;
        parts.push(ragContext);
      }
    } catch (error) {
      console.error('Error fetching RAG context:', error);
    }
  }

  // 2. Métricas de Ads (Google + Meta)
  if (options.includeMetrics !== false) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      // Google Ads Metrics
      const { data: googleAds } = await supabase
        .from('google_ads_metrics')
        .select('*')
        .eq('user_id', options.userId)
        .gte('date', dateStr)
        .order('date', { ascending: false })
        .limit(30) as { data: any[] | null };

      // Meta Ads Metrics
      const { data: metaAds } = await supabase
        .from('meta_ads_metrics')
        .select('*')
        .eq('user_id', options.userId)
        .gte('date', dateStr)
        .order('date', { ascending: false })
        .limit(30) as { data: any[] | null };

      if (googleAds && googleAds.length > 0) {
        const totalImpressions = googleAds.reduce((sum, m) => sum + Number(m.impressions || 0), 0);
        const totalClicks = googleAds.reduce((sum, m) => sum + Number(m.clicks || 0), 0);
        const totalCost = googleAds.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        const totalConversions = googleAds.reduce((sum, m) => sum + Number(m.conversions || 0), 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0';
        const avgCPC = totalClicks > 0 ? (totalCost / totalClicks).toFixed(2) : '0';

        metricsContext += `\n### Google Ads (últimos 30 dias):
- Impressões: ${totalImpressions.toLocaleString()}
- Cliques: ${totalClicks.toLocaleString()}
- CTR Médio: ${avgCTR}%
- CPC Médio: R$ ${avgCPC}
- Conversões: ${totalConversions}
- Investimento Total: R$ ${totalCost.toFixed(2)}
- Campanhas Ativas: ${new Set(googleAds.map(m => m.campaign_id)).size}\n`;
      }

      if (metaAds && metaAds.length > 0) {
        const totalImpressions = metaAds.reduce((sum, m) => sum + Number(m.impressions || 0), 0);
        const totalClicks = metaAds.reduce((sum, m) => sum + Number(m.clicks || 0), 0);
        const totalCost = metaAds.reduce((sum, m) => sum + Number(m.cost || 0), 0);
        const totalConversions = metaAds.reduce((sum, m) => sum + Number(m.conversions || 0), 0);
        const totalReach = metaAds.reduce((sum, m) => sum + Number(m.reach || 0), 0);
        const avgCTR = totalImpressions > 0 ? (totalClicks / totalImpressions * 100).toFixed(2) : '0';

        metricsContext += `\n### Meta Ads (últimos 30 dias):
- Impressões: ${totalImpressions.toLocaleString()}
- Alcance: ${totalReach.toLocaleString()}
- Cliques: ${totalClicks.toLocaleString()}
- CTR Médio: ${avgCTR}%
- Conversões: ${totalConversions}
- Investimento Total: R$ ${totalCost.toFixed(2)}
- Campanhas Ativas: ${new Set(metaAds.map(m => m.campaign_id)).size}\n`;
      }

      if (metricsContext) {
        metricsContext = `\n## 📊 Métricas de Performance:${metricsContext}`;
        parts.push(metricsContext);
      }
    } catch (error) {
      console.error('Error fetching metrics context:', error);
    }
  }

  // 3. Dados de Competidores
  if (options.includeCompetitors !== false) {
    try {
      const { data: competitorData } = await supabase
        .from('competitor_data')
        .select('*')
        .eq('user_id', options.userId)
        .order('scraped_at', { ascending: false })
        .limit(10) as { data: any[] | null };

      if (competitorData && competitorData.length > 0) {
        const competitors = new Set(competitorData.map(c => c.competitor_name));
        
        competitorsContext = `\n## 🎯 Inteligência Competitiva:
- Competidores Monitorados: ${competitors.size}
- Última Atualização: ${new Date(competitorData[0].scraped_at).toLocaleDateString('pt-BR')}
- Plataformas: ${new Set(competitorData.map(c => c.platform)).size}

### Principais Competidores:
${Array.from(competitors).slice(0, 5).map(name => {
  const compData = competitorData.filter(c => c.competitor_name === name);
  const platforms = new Set(compData.map(c => c.platform));
  return `- ${name} (${Array.from(platforms).join(', ')})`;
}).join('\n')}
`;
        parts.push(competitorsContext);
      }
    } catch (error) {
      console.error('Error fetching competitor context:', error);
    }
  }

  // 4. Social Media Metrics
  if (options.includeSocialMedia !== false) {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

      const { data: socialMetrics } = await supabase
        .from('social_media_metrics')
        .select('*')
        .eq('user_id', options.userId)
        .gte('date', dateStr)
        .order('date', { ascending: false }) as { data: any[] | null };

      if (socialMetrics && socialMetrics.length > 0) {
        const platforms = new Set(socialMetrics.map(m => m.platform));
        
        socialMediaContext = `\n## 📱 Redes Sociais:`;
        
        platforms.forEach(platform => {
          const platformData = socialMetrics.filter(m => m.platform === platform);
          if (platformData.length > 0) {
            const latest = platformData[0];
            const totalEngagement = platformData.reduce((sum, m) => 
              sum + Number(m.total_likes || 0) + Number(m.total_comments || 0) + Number(m.total_shares || 0), 0
            );
            
            socialMediaContext += `\n### ${platform.charAt(0).toUpperCase() + platform.slice(1)}:
- Seguidores: ${latest.followers?.toLocaleString() || 0}
- Posts: ${latest.posts_count || 0}
- Engajamento Total: ${totalEngagement.toLocaleString()}
- Taxa de Engajamento: ${(latest.engagement_rate || 0).toFixed(2)}%`;
          }
        });
        
        socialMediaContext += '\n';
        parts.push(socialMediaContext);
      }
    } catch (error) {
      console.error('Error fetching social media context:', error);
    }
  }

  // 5. Informações da Campanha (se aplicável)
  if (options.campaignId) {
    try {
      const { data: campaign } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', options.campaignId)
        .single() as { data: any | null };

      if (campaign) {
        const campaignContext = `\n## 🎯 Contexto da Campanha:
- Nome: ${campaign.name}
- Status: ${campaign.status}
- Objetivos: ${campaign.objectives?.join(', ') || 'N/A'}
- Canais: ${campaign.channels?.join(', ') || 'N/A'}
- Orçamento Total: R$ ${campaign.budget_total || 0}
- Período: ${campaign.start_date ? new Date(campaign.start_date).toLocaleDateString('pt-BR') : 'N/A'} até ${campaign.end_date ? new Date(campaign.end_date).toLocaleDateString('pt-BR') : 'N/A'}
`;
        parts.push(campaignContext);
      }
    } catch (error) {
      console.error('Error fetching campaign context:', error);
    }
  }

  const fullContext = parts.length > 0 
    ? `\n# 🔍 CONTEXTO ENRIQUECIDO PARA ANÁLISE\n${parts.join('\n')}`
    : '';

  return {
    ragContext,
    metricsContext,
    competitorsContext,
    socialMediaContext,
    fullContext
  };
}
