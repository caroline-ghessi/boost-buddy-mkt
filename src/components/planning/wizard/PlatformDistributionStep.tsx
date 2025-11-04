import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface Front {
  id: string;
  name: string;
  amount: number;
}

interface PlatformDistribution {
  google: number;
  meta: number;
  tiktok: number;
}

interface PlatformDistributionStepProps {
  fronts: Front[];
  distributions: Map<string, PlatformDistribution>;
  onDistributionChange: (frontId: string, distribution: PlatformDistribution) => void;
  onNext: () => void;
  onBack: () => void;
}

export const PlatformDistributionStep = ({
  fronts,
  distributions,
  onDistributionChange,
  onNext,
  onBack,
}: PlatformDistributionStepProps) => {
  const handlePlatformChange = (
    frontId: string,
    platform: keyof PlatformDistribution,
    value: number
  ) => {
    const current = distributions.get(frontId) || { google: 0, meta: 0, tiktok: 0 };
    onDistributionChange(frontId, {
      ...current,
      [platform]: value,
    });
  };

  const isValid = fronts.every((front) => {
    const dist = distributions.get(front.id);
    if (!dist) return false;
    const total = dist.google + dist.meta + dist.tiktok;
    return Math.abs(total - 100) < 0.1;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Distribua entre Plataformas</h2>
        <p className="text-muted-foreground">
          Para cada frente, defina o percentual de cada plataforma
        </p>
      </div>

      <div className="space-y-6">
        {fronts.map((front) => {
          const dist = distributions.get(front.id) || { google: 0, meta: 0, tiktok: 0 };
          const total = dist.google + dist.meta + dist.tiktok;
          const isValidDist = Math.abs(total - 100) < 0.1;

          return (
            <div key={front.id} className="border rounded-lg p-6 space-y-4 bg-card">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-semibold">{front.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format(front.amount)}
                  </p>
                </div>
                <div className="text-right">
                  <p
                    className={cn(
                      "text-lg font-bold",
                      total < 100 && "text-yellow-600",
                      isValidDist && "text-green-600",
                      total > 100 && "text-destructive"
                    )}
                  >
                    {total.toFixed(1)}%
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {isValidDist ? "✓ Completo" : `Falta ${(100 - total).toFixed(1)}%`}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {/* Google Ads */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Google Ads</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format((front.amount * dist.google) / 100)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[dist.google]}
                      onValueChange={([value]) =>
                        handlePlatformChange(front.id, "google", value)
                      }
                      max={100}
                      step={0.1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={dist.google.toFixed(1)}
                      onChange={(e) =>
                        handlePlatformChange(
                          front.id,
                          "google",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 text-center"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-sm font-medium w-8">%</span>
                  </div>
                </div>

                {/* Meta Ads */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">Meta Ads</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format((front.amount * dist.meta) / 100)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[dist.meta]}
                      onValueChange={([value]) =>
                        handlePlatformChange(front.id, "meta", value)
                      }
                      max={100}
                      step={0.1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={dist.meta.toFixed(1)}
                      onChange={(e) =>
                        handlePlatformChange(
                          front.id,
                          "meta",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 text-center"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-sm font-medium w-8">%</span>
                  </div>
                </div>

                {/* TikTok Ads */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium">TikTok Ads</label>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format((front.amount * dist.tiktok) / 100)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Slider
                      value={[dist.tiktok]}
                      onValueChange={([value]) =>
                        handlePlatformChange(front.id, "tiktok", value)
                      }
                      max={100}
                      step={0.1}
                      className="flex-1"
                    />
                    <Input
                      type="number"
                      value={dist.tiktok.toFixed(1)}
                      onChange={(e) =>
                        handlePlatformChange(
                          front.id,
                          "tiktok",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      className="w-20 text-center"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                    <span className="text-sm font-medium w-8">%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Revisar e Salvar →
        </Button>
      </div>

      {!isValid && (
        <p className="text-center text-sm text-destructive">
          Todas as frentes devem ter exatamente 100% distribuído entre as plataformas
        </p>
      )}
    </div>
  );
};
