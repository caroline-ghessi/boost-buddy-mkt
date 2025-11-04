import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { useBudgetAllocations } from "@/hooks/useBudgetAllocations";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
import { toast } from "sonner";

interface PlatformDistributionProps {
  allocationId: string;
  totalAmount: number;
}

export const PlatformDistribution = ({
  allocationId,
  totalAmount,
}: PlatformDistributionProps) => {
  const { platforms, upsertPlatformDistribution } = useBudgetAllocations(null);
  const [google, setGoogle] = useState(33.33);
  const [meta, setMeta] = useState(33.33);
  const [tiktok, setTiktok] = useState(33.34);

  useEffect(() => {
    const existing = platforms.filter(p => p.budget_allocation_id === allocationId);
    if (existing.length > 0) {
      const googlePlatform = existing.find(p => p.platform === "google");
      const metaPlatform = existing.find(p => p.platform === "meta");
      const tiktokPlatform = existing.find(p => p.platform === "tiktok");
      
      if (googlePlatform) setGoogle(googlePlatform.percentage);
      if (metaPlatform) setMeta(metaPlatform.percentage);
      if (tiktokPlatform) setTiktok(tiktokPlatform.percentage);
    }
  }, [platforms, allocationId]);

  const totalPercentage = google + meta + tiktok;
  const isValid = Math.abs(totalPercentage - 100) < 0.1;

  const calculateAmounts = (percentage: number) => {
    const monthly = (totalAmount * percentage) / 100;
    const daily = monthly / 30;
    return { monthly, daily };
  };

  const handleSave = async () => {
    if (!isValid) {
      toast.error("A soma dos percentuais deve ser 100%");
      return;
    }

    try {
      const googleAmounts = calculateAmounts(google);
      const metaAmounts = calculateAmounts(meta);
      const tiktokAmounts = calculateAmounts(tiktok);

      await Promise.all([
        upsertPlatformDistribution({
          budget_allocation_id: allocationId,
          platform: "google",
          percentage: google,
          monthly_amount: googleAmounts.monthly,
          daily_amount: googleAmounts.daily,
        }),
        upsertPlatformDistribution({
          budget_allocation_id: allocationId,
          platform: "meta",
          percentage: meta,
          monthly_amount: metaAmounts.monthly,
          daily_amount: metaAmounts.daily,
        }),
        upsertPlatformDistribution({
          budget_allocation_id: allocationId,
          platform: "tiktok",
          percentage: tiktok,
          monthly_amount: tiktokAmounts.monthly,
          daily_amount: tiktokAmounts.daily,
        }),
      ]);

      toast.success("Distribuição de plataformas salva!");
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">Distribuição por Plataforma</h4>
        <Button onClick={handleSave} size="sm" disabled={!isValid}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </div>

      {!isValid && (
        <div className="text-sm text-destructive">
          Total: {totalPercentage.toFixed(1)}% (deve ser 100%)
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Google Ads</Label>
              <span className="text-sm">{google.toFixed(1)}%</span>
            </div>
            <Slider
              value={[google]}
              onValueChange={(values) => setGoogle(values[0])}
              max={100}
              step={0.1}
            />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensal:</span>
                <span className="font-medium">
                  R$ {calculateAmounts(google).monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diário:</span>
                <span className="font-medium">
                  R$ {calculateAmounts(google).daily.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Meta Ads</Label>
              <span className="text-sm">{meta.toFixed(1)}%</span>
            </div>
            <Slider
              value={[meta]}
              onValueChange={(values) => setMeta(values[0])}
              max={100}
              step={0.1}
            />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensal:</span>
                <span className="font-medium">
                  R$ {calculateAmounts(meta).monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diário:</span>
                <span className="font-medium">
                  R$ {calculateAmounts(meta).daily.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">TikTok Ads</Label>
              <span className="text-sm">{tiktok.toFixed(1)}%</span>
            </div>
            <Slider
              value={[tiktok]}
              onValueChange={(values) => setTiktok(values[0])}
              max={100}
              step={0.1}
            />
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Mensal:</span>
                <span className="font-medium">
                  R$ {calculateAmounts(tiktok).monthly.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Diário:</span>
                <span className="font-medium">
                  R$ {calculateAmounts(tiktok).daily.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};