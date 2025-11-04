import { Card } from "@/components/ui/card";
import { PlatformDistribution } from "@/hooks/useBudgetAllocations";

interface BudgetSummaryProps {
  platforms: PlatformDistribution[];
  totalBudget: number;
}

export const BudgetSummary = ({ platforms, totalBudget }: BudgetSummaryProps) => {
  const calculatePlatformTotals = () => {
    const totals = {
      google: { amount: 0, percentage: 0 },
      meta: { amount: 0, percentage: 0 },
      tiktok: { amount: 0, percentage: 0 },
    };

    platforms.forEach((p) => {
      totals[p.platform].amount += p.monthly_amount;
    });

    // Calculate percentages
    if (totalBudget > 0) {
      Object.keys(totals).forEach((key) => {
        const platform = key as keyof typeof totals;
        totals[platform].percentage = (totals[platform].amount / totalBudget) * 100;
      });
    }

    return totals;
  };

  const totals = calculatePlatformTotals();
  const totalAllocated = totals.google.amount + totals.meta.amount + totals.tiktok.amount;
  const avgDailySpend = totalAllocated / 30;

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Google Ads</p>
          <p className="text-2xl font-bold">
            R$ {totals.google.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">{totals.google.percentage.toFixed(1)}%</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Meta Ads</p>
          <p className="text-2xl font-bold">
            R$ {totals.meta.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">{totals.meta.percentage.toFixed(1)}%</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">TikTok Ads</p>
          <p className="text-2xl font-bold">
            R$ {totals.tiktok.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">{totals.tiktok.percentage.toFixed(1)}%</p>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Gasto Médio Diário</p>
          <p className="text-2xl font-bold">
            R$ {avgDailySpend.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-sm text-muted-foreground">Total: R$ {totalAllocated.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
      </Card>
    </div>
  );
};