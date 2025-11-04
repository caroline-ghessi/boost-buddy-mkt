import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, DollarSign } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface BudgetStepProps {
  initialBudget?: number;
  initialPeriodStart?: Date;
  initialPeriodEnd?: Date;
  onNext: (budget: number, periodStart: Date, periodEnd: Date) => void;
}

export const BudgetStep = ({
  initialBudget = 0,
  initialPeriodStart,
  initialPeriodEnd,
  onNext,
}: BudgetStepProps) => {
  const [budget, setBudget] = useState(initialBudget);
  const [periodStart, setPeriodStart] = useState<Date | undefined>(initialPeriodStart);
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(initialPeriodEnd);

  useEffect(() => {
    setBudget(initialBudget);
    setPeriodStart(initialPeriodStart);
    setPeriodEnd(initialPeriodEnd);
  }, [initialBudget, initialPeriodStart, initialPeriodEnd]);

  const handleNext = () => {
    if (budget > 0 && periodStart && periodEnd) {
      onNext(budget, periodStart, periodEnd);
    }
  };

  const isValid = budget > 0 && periodStart && periodEnd;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <DollarSign className="h-16 w-16 mx-auto text-primary" />
        <h2 className="text-3xl font-bold">Defina o Orçamento Total</h2>
        <p className="text-muted-foreground">
          Comece definindo o valor total disponível para investimento
        </p>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="budget" className="text-lg">
            Orçamento Total (R$)
          </Label>
          <Input
            id="budget"
            type="number"
            value={budget || ""}
            onChange={(e) => setBudget(parseFloat(e.target.value) || 0)}
            placeholder="10000.00"
            className="text-2xl h-16 text-center font-bold"
            min={0}
            step={100}
          />
          {budget > 0 && (
            <p className="text-sm text-muted-foreground text-center">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(budget)}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Data de Início</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !periodStart && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodStart ? (
                    format(periodStart, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodStart}
                  onSelect={setPeriodStart}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label>Data de Término</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-12",
                    !periodEnd && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {periodEnd ? (
                    format(periodEnd, "dd/MM/yyyy")
                  ) : (
                    <span>Selecione...</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={periodEnd}
                  onSelect={setPeriodEnd}
                  disabled={(date) =>
                    periodStart ? date < periodStart : false
                  }
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {periodStart && periodEnd && (
          <div className="text-center text-sm text-muted-foreground bg-muted p-3 rounded-lg">
            Período de{" "}
            {Math.ceil(
              (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24)
            )}{" "}
            dias
          </div>
        )}
      </div>

      <div className="flex justify-center pt-4">
        <Button
          size="lg"
          onClick={handleNext}
          disabled={!isValid}
          className="min-w-[200px]"
        >
          Próximo →
        </Button>
      </div>
    </div>
  );
};
