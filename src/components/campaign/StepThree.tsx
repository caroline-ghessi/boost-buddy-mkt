import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { DollarSign, Calendar } from "lucide-react";

interface StepThreeProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

export default function StepThree({ data, updateData }: StepThreeProps) {
  const channels = [
    { id: "Google Ads", label: "Google Ads (Search + Display)" },
    { id: "Meta Ads", label: "Meta Ads (Facebook + Instagram)" },
    { id: "LinkedIn Ads", label: "LinkedIn Ads" },
    { id: "TikTok Ads", label: "TikTok Ads" },
    { id: "Organic", label: "Orgânico (SEO + Social)" },
  ];

  const toggleChannel = (channel: string) => {
    const current = data.channels || [];
    const updated = current.includes(channel)
      ? current.filter((c: string) => c !== channel)
      : [...current, channel];
    
    updateData("channels", updated);

    // Reset distribution if channels change
    if (!current.includes(channel)) {
      const newDistribution = { ...data.budget.distribution };
      const paidChannels = updated.filter((c: string) => !c.includes("Organic"));
      const equalShare = paidChannels.length > 0 ? Math.floor(100 / paidChannels.length) : 0;
      
      paidChannels.forEach((c: string) => {
        newDistribution[c] = equalShare;
      });

      updateData("budget", {
        ...data.budget,
        distribution: newDistribution,
      });
    }
  };

  const updateBudgetDistribution = (channel: string, value: number[]) => {
    updateData("budget", {
      ...data.budget,
      distribution: {
        ...data.budget.distribution,
        [channel]: value[0],
      },
    });
  };

  const calculateAmount = (channel: string) => {
    const percentage = data.budget.distribution?.[channel] || 0;
    const total = data.budget.total || 0;
    return ((total * percentage) / 100).toFixed(2);
  };

  const paidChannels = (data.channels || []).filter((c: string) => !c.includes("Organic"));

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <DollarSign className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Canais & Budget</h2>
      </div>

      {/* Canais */}
      <div className="mb-6">
        <Label className="mb-3 block">Onde vamos anunciar? *</Label>
        <div className="space-y-3">
          {channels.map((channel) => (
            <div key={channel.id} className="flex items-center space-x-2">
              <Checkbox
                id={channel.id}
                checked={data.channels?.includes(channel.id)}
                onCheckedChange={() => toggleChannel(channel.id)}
              />
              <label
                htmlFor={channel.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {channel.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Budget Total */}
      <div className="mb-6">
        <Label htmlFor="budget-total">Orçamento Total (R$) *</Label>
        <Input
          id="budget-total"
          type="number"
          placeholder="10000"
          value={data.budget.total || ""}
          onChange={(e) =>
            updateData("budget", {
              ...data.budget,
              total: parseFloat(e.target.value) || 0,
            })
          }
          className="mt-2"
        />
      </div>

      {/* Budget Distribution */}
      {paidChannels.length > 0 && data.budget.total > 0 && (
        <div className="mb-6">
          <Label className="mb-3 block">Distribuição de Orçamento</Label>
          <div className="space-y-4">
            {paidChannels.map((channel: string) => (
              <div key={channel}>
                <div className="flex justify-between mb-2">
                  <Label>{channel}</Label>
                  <span className="text-sm text-muted-foreground">
                    {data.budget.distribution?.[channel] || 0}% = R${" "}
                    {calculateAmount(channel)}
                  </span>
                </div>
                <Slider
                  value={[data.budget.distribution?.[channel] || 0]}
                  onValueChange={(val) => updateBudgetDistribution(channel, val)}
                  max={100}
                  step={5}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <Label className="mb-3 block flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Período da Campanha
        </Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="start-date" className="text-sm text-muted-foreground">
              Data de Início
            </Label>
            <Input
              id="start-date"
              type="date"
              value={data.timeline?.startDate || ""}
              onChange={(e) =>
                updateData("timeline", {
                  ...data.timeline,
                  startDate: e.target.value,
                })
              }
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="end-date" className="text-sm text-muted-foreground">
              Data de Término
            </Label>
            <Input
              id="end-date"
              type="date"
              value={data.timeline?.endDate || ""}
              onChange={(e) =>
                updateData("timeline", {
                  ...data.timeline,
                  endDate: e.target.value,
                })
              }
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
