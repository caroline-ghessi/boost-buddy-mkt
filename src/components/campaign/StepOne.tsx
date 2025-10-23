import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Target } from "lucide-react";

interface StepOneProps {
  data: any;
  updateData: (field: string, value: any) => void;
}

export default function StepOne({ data, updateData }: StepOneProps) {
  const objectives = [
    { id: "awareness", label: "Awareness (Conhecimento de marca)" },
    { id: "traffic", label: "Traffic (Tráfego para site)" },
    { id: "leads", label: "Leads (Geração de leads)" },
    { id: "sales", label: "Sales (Vendas diretas)" },
    { id: "engagement", label: "Engagement (Engajamento social)" },
  ];

  const toggleObjective = (objective: string) => {
    const current = data.objectives || [];
    const updated = current.includes(objective)
      ? current.filter((o: string) => o !== objective)
      : [...current, objective];
    updateData("objectives", updated);
  };

  const updateKPI = (key: string, value: string) => {
    updateData("kpis", {
      ...data.kpis,
      [key]: parseFloat(value) || 0,
    });
  };

  return (
    <Card className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Target className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Objetivos & KPIs</h2>
      </div>

      {/* Nome da Campanha */}
      <div className="mb-6">
        <Label htmlFor="campaign-name">Nome da Campanha *</Label>
        <Input
          id="campaign-name"
          placeholder="Ex: Campanha Black Friday 2024"
          value={data.name}
          onChange={(e) => updateData("name", e.target.value)}
          className="mt-2"
        />
      </div>

      {/* Objetivos */}
      <div className="mb-6">
        <Label className="mb-3 block">Qual é o objetivo desta campanha? *</Label>
        <div className="space-y-3">
          {objectives.map((obj) => (
            <div key={obj.id} className="flex items-center space-x-2">
              <Checkbox
                id={obj.id}
                checked={data.objectives?.includes(obj.id)}
                onCheckedChange={() => toggleObjective(obj.id)}
              />
              <label
                htmlFor={obj.id}
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                {obj.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div>
        <Label className="mb-3 block">Defina seus KPIs principais</Label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="impressions">Meta de Impressões</Label>
            <Input
              id="impressions"
              type="number"
              placeholder="100000"
              value={data.kpis?.impressions || ""}
              onChange={(e) => updateKPI("impressions", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="conversions">Meta de Conversões</Label>
            <Input
              id="conversions"
              type="number"
              placeholder="500"
              value={data.kpis?.conversions || ""}
              onChange={(e) => updateKPI("conversions", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="cpa">CPA Máximo (R$)</Label>
            <Input
              id="cpa"
              type="number"
              placeholder="50"
              value={data.kpis?.maxCPA || ""}
              onChange={(e) => updateKPI("maxCPA", e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="roi">ROI Esperado (%)</Label>
            <Input
              id="roi"
              type="number"
              placeholder="300"
              value={data.kpis?.expectedROI || ""}
              onChange={(e) => updateKPI("expectedROI", e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </Card>
  );
}
