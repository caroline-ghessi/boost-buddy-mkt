import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface InstagramPost {
  url: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  timestamp: string;
  type?: string;
  ownerUsername?: string;
}

export interface CompetitorData {
  id: string;
  competitor_name: string;
  platform: string;
  data_type: string;
  data: {
    username?: string;
    
    // Dados do perfil
    profile?: {
      fullName?: string;
      biography?: string;
      followersCount?: number;
      followsCount?: number;
      postsCount?: number;
      verified?: boolean;
      isPrivate?: boolean;
      profilePicUrl?: string;
      externalUrl?: string;
    };
    
    // Posts
    posts?: InstagramPost[];
    
    // Métricas agregadas
    metrics?: {
      totalPostsAnalyzed?: number;
      avgLikes?: number;
      avgComments?: number;
      avgEngagementRate?: string | number;
      postingFrequency?: string;
      mostEngagedPost?: any;
      topHashtags?: string[];
      postTypes?: Record<string, number>;
    };

    // Análise AI
    analysis?: any;
    
    // Legacy fields
    [key: string]: any;
  };
  scraped_at: string;
}

export interface CompetitorSummary {
  name: string;
  platforms: string[];
  lastScraped: string;
  insights: number;
  changesSinceLastWeek: number;
  status: "monitoring" | "paused";
}

export function useCompetitorData(userId?: string) {
  const [competitors, setCompetitors] = useState<CompetitorSummary[]>([]);
  const [recentInsights, setRecentInsights] = useState<CompetitorData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    
    fetchCompetitors();
    fetchRecentInsights();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("competitor-updates")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "competitor_data",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          console.log("New competitor data:", payload);
          fetchCompetitors();
          fetchRecentInsights();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchCompetitors = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("competitor_data")
        .select("*")
        .eq("user_id", userId)
        .order("scraped_at", { ascending: false });

      if (error) throw error;

      // Group by competitor name
      const grouped = (data || []).reduce((acc: any, item) => {
        const name = item.competitor_name;
        if (!acc[name]) {
          acc[name] = {
            name,
            platforms: new Set(),
            lastScraped: item.scraped_at,
            insights: 0,
            changesSinceLastWeek: 0,
            status: "monitoring" as const,
          };
        }

        if (item.platform !== "analysis" && item.platform !== "config") {
          acc[name].platforms.add(item.platform);
        }

        if (item.data_type === "ai_insights") {
          acc[name].insights += 1;
          const dataObj = typeof item.data === 'object' && item.data !== null ? item.data as any : {};
          const changes = dataObj.analysis?.changes || [];
          acc[name].changesSinceLastWeek += changes.length;
        }

        return acc;
      }, {});

      const competitorsList = Object.values(grouped).map((c: any) => ({
        ...c,
        platforms: Array.from(c.platforms),
      }));

      setCompetitors(competitorsList as CompetitorSummary[]);
    } catch (error) {
      console.error("Error fetching competitors:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRecentInsights = async () => {
    if (!userId) return;

    try {
      const { data, error } = await supabase
        .from("competitor_data")
        .select("*")
        .eq("user_id", userId)
        .eq("data_type", "ai_insights")
        .order("scraped_at", { ascending: false })
        .limit(10);

      if (error) throw error;

      setRecentInsights((data || []) as CompetitorData[]);
    } catch (error) {
      console.error("Error fetching insights:", error);
    }
  };

  return {
    competitors,
    recentInsights,
    isLoading,
    refetch: () => {
      fetchCompetitors();
      fetchRecentInsights();
    },
  };
}
