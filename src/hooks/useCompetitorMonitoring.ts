import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export function useCompetitorMonitoring() {
  const [isScrapingLoading, setIsScrapingLoading] = useState(false);

  const startMonitoring = async (
    competitorName: string,
    platforms: Record<string, string>,
    userId: string
  ) => {
    try {
      setIsScrapingLoading(true);

      // Save monitoring config
      await supabase.from("competitor_data").insert({
        user_id: userId,
        competitor_name: competitorName,
        platform: "config",
        data_type: "monitoring_config",
        data: {
          platforms,
          frequency: "daily",
          createdAt: new Date().toISOString(),
        },
        scraped_at: new Date().toISOString(),
      });

      // Start initial scraping
      const { data, error } = await supabase.functions.invoke("scrape-competitor", {
        body: {
          competitorName,
          platforms: Object.fromEntries(
            Object.entries(platforms).filter(([_, v]) => v)
          ),
          scrapeType: "full",
          userId,
        },
      });

      if (error) throw error;

      toast.success(`🐶 Thiago iniciou o monitoramento de ${competitorName}!`);
      return data;
    } catch (error) {
      console.error("Error starting monitoring:", error);
      toast.error("Erro ao iniciar monitoramento");
      throw error;
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const triggerManualScrape = async (
    competitorName: string,
    platforms: Record<string, string>,
    userId: string
  ) => {
    try {
      setIsScrapingLoading(true);

      const { data, error } = await supabase.functions.invoke("scrape-competitor", {
        body: {
          competitorName,
          platforms,
          scrapeType: "quick",
          userId,
          mode: "trigger",
        },
      });

      if (error) throw error;

      toast.success(`🔄 Novo scraping iniciado para ${competitorName}`);
      return data;
    } catch (error) {
      console.error("Error triggering manual scrape:", error);
      toast.error("Erro ao iniciar scraping");
      throw error;
    } finally {
      setIsScrapingLoading(false);
    }
  };

  const syncApifyResults = async (
    competitorName: string,
    platforms: Record<string, string>,
    userId: string
  ) => {
    try {
      setIsScrapingLoading(true);

      const { data, error } = await supabase.functions.invoke("scrape-competitor", {
        body: {
          competitorName,
          platforms,
          scrapeType: "quick",
          userId,
          mode: "fetch",
        },
      });

      if (error) throw error;

      toast.success(`🔄 Dados sincronizados do Apify para ${competitorName}`);
      return data;
    } catch (error) {
      console.error("Error syncing Apify results:", error);
      toast.error("Erro ao sincronizar com Apify");
      throw error;
    } finally {
      setIsScrapingLoading(false);
    }
  };

  return {
    startMonitoring,
    triggerManualScrape,
    syncApifyResults,
    isScrapingLoading,
  };
}
