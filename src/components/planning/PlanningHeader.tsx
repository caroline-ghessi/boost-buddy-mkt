import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Plus, Save, Copy } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BudgetPlan } from "@/hooks/useBudgetPlan";
import { cn } from "@/lib/utils";

interface PlanningHeaderProps {
  plans: BudgetPlan[];
  selectedPlan: BudgetPlan | null;
  onSelectPlan: (plan: BudgetPlan) => void;
  onCreatePlan: () => void;
  onSavePlan: () => void;
  onDuplicatePlan: () => void;
  totalBudget: number;
  onTotalBudgetChange: (value: number) => void;
  periodStart: Date | undefined;
  periodEnd: Date | undefined;
  onPeriodStartChange: (date: Date | undefined) => void;
  onPeriodEndChange: (date: Date | undefined) => void;
}

export const PlanningHeader = ({
  plans,
  selectedPlan,
  onSelectPlan,
  onCreatePlan,
  onSavePlan,
  onDuplicatePlan,
  totalBudget,
  onTotalBudgetChange,
  periodStart,
  periodEnd,
  onPeriodStartChange,
  onPeriodEndChange,
}: PlanningHeaderProps) => {
  return (
    <div className="bg-card p-6 rounded-lg border shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Planejamento de Campanhas</h1>
        <div className="flex gap-2">
          <Button onClick={onCreatePlan} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Novo Plano
          </Button>
          <Button onClick={onDuplicatePlan} variant="outline" size="sm" disabled={!selectedPlan}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicar
          </Button>
          <Button onClick={onSavePlan} size="sm" disabled={!selectedPlan}>
            <Save className="h-4 w-4 mr-2" />
            Salvar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="space-y-2">
          <Label htmlFor="plan-select">Plano Selecionado</Label>
          <Select
            value={selectedPlan?.id || ""}
            onValueChange={(value) => {
              const plan = plans.find((p) => p.id === value);
              if (plan) onSelectPlan(plan);
            }}
          >
            <SelectTrigger id="plan-select">
              <SelectValue placeholder="Selecione um plano" />
            </SelectTrigger>
            <SelectContent>
              {plans.map((plan) => (
                <SelectItem key={plan.id} value={plan.id}>
                  {plan.name} ({plan.status})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="total-budget">Orçamento Total (R$)</Label>
          <Input
            id="total-budget"
            type="number"
            value={totalBudget}
            onChange={(e) => onTotalBudgetChange(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
          />
        </div>

        <div className="space-y-2">
          <Label>Data Início</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !periodStart && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {periodStart ? (
                  format(periodStart, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={periodStart}
                onSelect={onPeriodStartChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label>Data Fim</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !periodEnd && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {periodEnd ? (
                  format(periodEnd, "PPP", { locale: ptBR })
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={periodEnd}
                onSelect={onPeriodEndChange}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
};