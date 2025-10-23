import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { CompetitorCard } from "@/components/intelligence/CompetitorCard";
import { AddCompetitorModal } from "@/components/intelligence/AddCompetitorModal";
import { CompetitorComparison } from "@/components/intelligence/CompetitorComparison";
import { useCompetitorData } from "@/hooks/useCompetitorData";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export default function CompetitiveIntelligence() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const navigate = useNavigate();

  const { competitors, recentInsights, isLoading, refetch } = useCompetitorData(userId);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id);
    });
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold">🔍 Inteligência Competitiva</h1>
          <p className="text-muted-foreground mt-2">
            Monitoramento automático de concorrentes by Thiago Costa 🐶
          </p>
        </div>

        <Button onClick={() => setIsAddModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Concorrente
        </Button>
      </div>

      {isLoading ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Carregando dados...</p>
        </Card>
      ) : competitors.length === 0 ? (
        <Card className="p-12 text-center">
          <h3 className="text-xl font-semibold mb-2">Nenhum concorrente monitorado ainda</h3>
          <p className="text-muted-foreground mb-6">
            Adicione seu primeiro concorrente para começar o monitoramento automático.
          </p>
          <Button onClick={() => setIsAddModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Primeiro Concorrente
          </Button>
        </Card>
      ) : (
        <>
          {/* Grid de Concorrentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {competitors.map((competitor) => (
              <CompetitorCard
                key={competitor.name}
                competitor={competitor}
                onClick={() => navigate(`/competitive-intelligence/${competitor.name}`)}
              />
            ))}
          </div>

          {/* Insights Recentes */}
          {recentInsights.length > 0 && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold mb-4">🎯 Insights Recentes</h3>
              <div className="space-y-4">
                {recentInsights.slice(0, 5).map((insight) => {
                  const analysis = insight.data?.analysis;
                  return (
                    <div
                      key={insight.id}
                      className="p-4 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
                      onClick={() => navigate(`/competitive-intelligence/${insight.competitor_name}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium">{insight.competitor_name}</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            {analysis?.summary?.substring(0, 150)}...
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap ml-4">
                          {new Date(insight.scraped_at).toLocaleDateString("pt-BR")}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}

          {/* Análise Comparativa */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">📊 Análise Comparativa</h3>
            <CompetitorComparison competitors={competitors} />
          </Card>
        </>
      )}

      {/* Add Competitor Modal */}
      <AddCompetitorModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={refetch}
      />
    </div>
  );
}
