import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Front {
  id: string;
  name: string;
  percentage: number;
  selected: boolean;
}

interface FrontsAllocationStepProps {
  totalBudget: number;
  fronts: Front[];
  availableFronts: Array<{ id: string; name: string }>;
  onFrontToggle: (frontId: string, name: string) => void;
  onPercentageChange: (frontId: string, percentage: number) => void;
  onCreateFront: (name: string) => void;
  onNext: () => void;
  onBack: () => void;
  totalAllocated: number;
}

export const FrontsAllocationStep = ({
  totalBudget,
  fronts,
  availableFronts,
  onFrontToggle,
  onPercentageChange,
  onCreateFront,
  onNext,
  onBack,
  totalAllocated,
}: FrontsAllocationStepProps) => {
  const [newFrontName, setNewFrontName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const remaining = 100 - totalAllocated;
  const isValid = Math.abs(remaining) < 0.1;

  const handleCreateFront = () => {
    if (newFrontName.trim()) {
      onCreateFront(newFrontName.trim());
      setNewFrontName("");
      setIsDialogOpen(false);
    }
  };

  const allocatedAmount = (totalBudget * totalAllocated) / 100;
  const remainingAmount = totalBudget - allocatedAmount;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold">Distribua entre Frentes de Negócio</h2>
        <p className="text-muted-foreground">
          Aloque percentuais do orçamento para cada frente
        </p>
      </div>

      {/* Budget Summary */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Orçamento Total</p>
            <p className="text-2xl font-bold">
              {new Intl.NumberFormat("pt-BR", {
                style: "currency",
                currency: "BRL",
              }).format(totalBudget)}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">
              {totalAllocated < 100 && "Faltam alocar"}
              {totalAllocated === 100 && "Totalmente alocado"}
              {totalAllocated > 100 && "Excedido em"}
            </p>
            <p
              className={cn(
                "text-2xl font-bold",
                totalAllocated < 100 && "text-yellow-600",
                Math.abs(totalAllocated - 100) < 0.1 && "text-green-600",
                totalAllocated > 100 && "text-destructive"
              )}
            >
              {Math.abs(remaining).toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all rounded-full",
              totalAllocated < 100 && "bg-yellow-500",
              Math.abs(totalAllocated - 100) < 0.1 && "bg-green-500",
              totalAllocated > 100 && "bg-destructive"
            )}
            style={{ width: `${Math.min(totalAllocated, 100)}%` }}
          />
        </div>

        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            Alocado: {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(allocatedAmount)} ({totalAllocated.toFixed(1)}%)
          </span>
          <span className="text-muted-foreground">
            Restante: {new Intl.NumberFormat("pt-BR", {
              style: "currency",
              currency: "BRL",
            }).format(remainingAmount)}
          </span>
        </div>
      </div>

      {/* Fronts List */}
      <div className="space-y-4">
        {fronts.map((front) => (
          <div
            key={front.id}
            className={cn(
              "border rounded-lg p-4 space-y-3 transition-all",
              front.selected ? "bg-card" : "bg-muted/50 opacity-60"
            )}
          >
            <div className="flex items-center gap-3">
              <Checkbox
                checked={front.selected}
                onCheckedChange={() => onFrontToggle(front.id, front.name)}
              />
              <Label className="text-lg font-semibold flex-1 cursor-pointer">
                {front.name}
              </Label>
              {front.selected && (
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {new Intl.NumberFormat("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    }).format((totalBudget * front.percentage) / 100)}
                  </p>
                </div>
              )}
            </div>

            {front.selected && (
              <div className="flex items-center gap-4">
                <Slider
                  value={[front.percentage]}
                  onValueChange={([value]) => onPercentageChange(front.id, value)}
                  max={100}
                  step={0.1}
                  className="flex-1"
                />
                <Input
                  type="number"
                  value={front.percentage.toFixed(1)}
                  onChange={(e) =>
                    onPercentageChange(front.id, parseFloat(e.target.value) || 0)
                  }
                  className="w-20 text-center"
                  min={0}
                  max={100}
                  step={0.1}
                />
                <span className="text-sm font-medium w-8">%</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Front Button */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Nova Frente
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Criar Nova Frente de Negócio</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="front-name">Nome da Frente</Label>
              <Input
                id="front-name"
                value={newFrontName}
                onChange={(e) => setNewFrontName(e.target.value)}
                placeholder="Ex: Telhas Shingle"
                onKeyDown={(e) => e.key === "Enter" && handleCreateFront()}
              />
            </div>
            <Button onClick={handleCreateFront} className="w-full">
              Criar Frente
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          <ChevronLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
        <Button onClick={onNext} disabled={!isValid}>
          Próximo →
        </Button>
      </div>

      {!isValid && fronts.some(f => f.selected) && (
        <p className="text-center text-sm text-destructive">
          A soma dos percentuais deve ser exatamente 100%
        </p>
      )}
    </div>
  );
};
