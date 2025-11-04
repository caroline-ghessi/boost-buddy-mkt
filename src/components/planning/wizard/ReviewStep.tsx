import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

interface Front {
  id: string;
  name: string;
  percentage: number;
  amount: number;
}

interface PlatformDistribution {
  google: number;
  meta: number;
  tiktok: number;
}

interface PlatformTotals {
  google: number;
  meta: number;
  tiktok: number;
}

interface ReviewStepProps {
  totalBudget: number;
  periodStart: Date;
  periodEnd: Date;
  fronts: Front[];
  distributions: Map<string, PlatformDistribution>;
  platformTotals: PlatformTotals;
  onBack: () => void;
  onSave: () => void;
  isSaving?: boolean;
}

export const ReviewStep = ({
  totalBudget,
  periodStart,
  periodEnd,
  fronts,
  distributions,
  platformTotals,
  onBack,
  onSave,
  isSaving,
}: ReviewStepProps) => {
  const days = Math.ceil(
    (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const dailyBudgets = {
    google: platformTotals.google / days,
    meta: platformTotals.meta / days,
    tiktok: platformTotals.tiktok / days,
    total: totalBudget / days,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
        <h2 className="text-3xl font-bold">Revisão do Plano</h2>
        <p className="text-muted-foreground">
          Confira todos os detalhes antes de salvar
        </p>
      </div>

      {/* General Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Resumo Geral</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Orçamento Total</span>
            <span className="font-bold text-lg">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalBudget)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Período</span>
            <span className="font-medium">
              {format(periodStart, "dd/MM/yyyy")} → {format(periodEnd, "dd/MM/yyyy")}{" "}
              <Badge variant="secondary">{days} dias</Badge>
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Budget Diário Médio</span>
            <span className="font-medium">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(dailyBudgets.total)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge>Rascunho</Badge>
          </div>
        </CardContent>
      </Card>

      {/* By Business Front */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Por Frente de Negócio</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {fronts.map((front) => {
            const dist = distributions.get(front.id);
            if (!dist) return null;

            return (
              <div
                key={front.id}
                className="border rounded-lg p-4 space-y-3 bg-muted/50"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-semibold text-lg">{front.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {front.percentage.toFixed(1)}% do orçamento total
                    </p>
                  </div>
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(front.amount)}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Google Ads</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format((front.amount * dist.google) / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dist.google.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">Meta Ads</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format((front.amount * dist.meta) / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dist.meta.toFixed(1)}%
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-muted-foreground">TikTok Ads</p>
                    <p className="font-medium">
                      {new Intl.NumberFormat("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      }).format((front.amount * dist.tiktok) / 100)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {dist.tiktok.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      {/* By Platform */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Por Plataforma (Total)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Google Ads</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(platformTotals.google)}
              </p>
              <p className="text-xs text-muted-foreground">
                {((platformTotals.google / totalBudget) * 100).toFixed(1)}% •{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(dailyBudgets.google)}
                /dia
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Meta Ads</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(platformTotals.meta)}
              </p>
              <p className="text-xs text-muted-foreground">
                {((platformTotals.meta / totalBudget) * 100).toFixed(1)}% •{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(dailyBudgets.meta)}
                /dia
              </p>
            </div>

            <div className="border rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-muted-foreground">TikTok Ads</p>
              <p className="text-2xl font-bold">
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(platformTotals.tiktok)}
              </p>
              <p className="text-xs text-muted-foreground">
                {((platformTotals.tiktok / totalBudget) * 100).toFixed(1)}% •{" "}
                {new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: "BRL",
                }).format(dailyBudgets.tiktok)}
                /dia
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onSave} size="lg" disabled={isSaving}>
          {isSaving ? "Salvando..." : "Salvar Plano"}
        </Button>
      </div>
    </div>
  );
};
