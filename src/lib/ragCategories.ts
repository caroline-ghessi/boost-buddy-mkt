export const RAG_CATEGORIES = {
  COMPANY: 'Empresa',
  SOCIAL_MEDIA: 'Social Media',
  GOOGLE_ADS: 'Google Ads',
  META_ADS: 'Meta Ads',
  BRAND_GUIDELINES: 'Diretrizes de Marca',
  MARKET_RESEARCH: 'Pesquisa de Mercado',
  COMPETITOR_ANALYSIS: 'Análise Competitiva',
  CONTENT_STRATEGY: 'Estratégia de Conteúdo',
  ANALYTICS: 'Analytics',
  SEO: 'SEO',
  OTHER: 'Outros'
} as const;

export type RAGCategory = typeof RAG_CATEGORIES[keyof typeof RAG_CATEGORIES];

export const CATEGORY_OPTIONS = Object.values(RAG_CATEGORIES);

// Map agents to their preferred categories
export const AGENT_CATEGORY_PREFERENCES: Record<string, {
  priority: RAGCategory[];
  secondary: RAGCategory[];
}> = {
  // Camila - Analytics
  'camila': {
    priority: [RAG_CATEGORIES.ANALYTICS, RAG_CATEGORIES.GOOGLE_ADS, RAG_CATEGORIES.META_ADS],
    secondary: [RAG_CATEGORIES.MARKET_RESEARCH]
  },
  // Thiago - Competitive Intelligence
  'thiago': {
    priority: [RAG_CATEGORIES.COMPETITOR_ANALYSIS, RAG_CATEGORIES.MARKET_RESEARCH],
    secondary: [RAG_CATEGORIES.SOCIAL_MEDIA]
  },
  // Ana - Market Research
  'ana': {
    priority: [RAG_CATEGORIES.MARKET_RESEARCH, RAG_CATEGORIES.COMPETITOR_ANALYSIS],
    secondary: [RAG_CATEGORIES.ANALYTICS, RAG_CATEGORIES.SOCIAL_MEDIA]
  },
  // Renata - Brand Strategy
  'renata': {
    priority: [RAG_CATEGORIES.BRAND_GUIDELINES, RAG_CATEGORIES.COMPANY, RAG_CATEGORIES.CONTENT_STRATEGY],
    secondary: [RAG_CATEGORIES.SOCIAL_MEDIA]
  },
  // Pedro - Google Ads Specialist
  'pedro': {
    priority: [RAG_CATEGORIES.GOOGLE_ADS, RAG_CATEGORIES.SEO],
    secondary: [RAG_CATEGORIES.BRAND_GUIDELINES, RAG_CATEGORIES.CONTENT_STRATEGY]
  },
  // Marina - Meta Ads Specialist
  'marina': {
    priority: [RAG_CATEGORIES.META_ADS],
    secondary: [RAG_CATEGORIES.BRAND_GUIDELINES, RAG_CATEGORIES.CONTENT_STRATEGY]
  },
  // Lucas - Social Media Manager
  'lucas': {
    priority: [RAG_CATEGORIES.SOCIAL_MEDIA, RAG_CATEGORIES.CONTENT_STRATEGY],
    secondary: [RAG_CATEGORIES.BRAND_GUIDELINES]
  },
  // Default for CMO and others
  'default': {
    priority: Object.values(RAG_CATEGORIES),
    secondary: []
  }
};

export function getAgentCategories(agentId: string): {
  priority: RAGCategory[];
  secondary: RAGCategory[];
} {
  return AGENT_CATEGORY_PREFERENCES[agentId.toLowerCase()] || AGENT_CATEGORY_PREFERENCES.default;
}
