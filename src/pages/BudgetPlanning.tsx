import { useState, useEffect } from "react";
import { useBudgetPlan } from "@/hooks/useBudgetPlan";
import { useBusinessFronts } from "@/hooks/useBusinessFronts";
import { useBudgetAllocations } from "@/hooks/useBudgetAllocations";
import { PlanningHeader } from "@/components/planning/PlanningHeader";
import { BusinessFrontCard } from "@/components/planning/BusinessFrontCard";
import { BudgetSummary } from "@/components/planning/BudgetSummary";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BudgetPlanning() {
  const {
    plans,
    selectedPlan,
    setSelectedPlan,
    createPlan,
    updatePlan,
    duplicatePlan,
    isLoading: plansLoading,
  } = useBudgetPlan();

  const { fronts, createFront, isLoading: frontsLoading } = useBusinessFronts();
  
  const {
    allocations,
    platforms,
    createAllocation,
    updateAllocation,
    refreshAllocations,
  } = useBudgetAllocations(selectedPlan?.id || null);

  const [totalBudget, setTotalBudget] = useState(0);
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [newFrontName, setNewFrontName] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (selectedPlan) {
      setTotalBudget(parseFloat(String(selectedPlan.total_budget)));
      setPeriodStart(new Date(selectedPlan.period_start));
      setPeriodEnd(new Date(selectedPlan.period_end));
    }
  }, [selectedPlan]);

  const handleCreatePlan = async () => {
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    await createPlan({
      name: `Plano ${new Date().toLocaleDateString("pt-BR")}`,
      total_budget: 0,
      period_start: today.toISOString().split("T")[0],
      period_end: nextMonth.toISOString().split("T")[0],
      status: "draft",
    });
  };

  const handleSavePlan = async () => {
    if (!selectedPlan) return;

    await updatePlan(selectedPlan.id, {
      total_budget: totalBudget,
      period_start: periodStart?.toISOString().split("T")[0] || selectedPlan.period_start,
      period_end: periodEnd?.toISOString().split("T")[0] || selectedPlan.period_end,
    });

    // Save allocations
    for (const front of fronts) {
      const existing = allocations.find(a => a.business_front_id === front.id);
      const percentage = existing?.percentage || 0;
      const allocated = (totalBudget * percentage) / 100;

      if (existing) {
        await updateAllocation(existing.id, {
          percentage,
          allocated_amount: allocated,
        });
      } else if (percentage > 0) {
        await createAllocation({
          budget_plan_id: selectedPlan.id,
          business_front_id: front.id,
          percentage,
          allocated_amount: allocated,
        });
      }
    }

    refreshAllocations();
  };

  const handlePercentageChange = async (frontId: string, newPercentage: number) => {
    if (!selectedPlan) return;

    const existing = allocations.find(a => a.business_front_id === frontId);
    const allocated = (totalBudget * newPercentage) / 100;

    if (existing) {
      await updateAllocation(existing.id, {
        percentage: newPercentage,
        allocated_amount: allocated,
      });
    } else {
      await createAllocation({
        budget_plan_id: selectedPlan.id,
        business_front_id: frontId,
        percentage: newPercentage,
        allocated_amount: allocated,
      });
    }

    refreshAllocations();
  };

  const handleCreateFront = async () => {
    if (!newFrontName.trim()) {
      toast.error("Digite um nome para a frente");
      return;
    }

    await createFront({
      name: newFrontName,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      is_active: true,
    });

    setNewFrontName("");
    setIsDialogOpen(false);
  };

  const totalPercentage = allocations.reduce((sum, a) => sum + parseFloat(String(a.percentage)), 0);
  const isValidDistribution = Math.abs(totalPercentage - 100) < 0.1;

  if (plansLoading || frontsLoading) {
    return <div className="p-8">Carregando...</div>;
  }

  return (
    <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
      <PlanningHeader
        plans={plans}
        selectedPlan={selectedPlan}
        onSelectPlan={setSelectedPlan}
        onCreatePlan={handleCreatePlan}
        onSavePlan={handleSavePlan}
        onDuplicatePlan={() => selectedPlan && duplicatePlan(selectedPlan.id)}
        totalBudget={totalBudget}
        onTotalBudgetChange={setTotalBudget}
        periodStart={periodStart}
        periodEnd={periodEnd}
        onPeriodStartChange={setPeriodStart}
        onPeriodEndChange={setPeriodEnd}
      />

      {!isValidDistribution && fronts.length > 0 && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg text-sm">
          Total: {totalPercentage.toFixed(1)}% (deve ser 100%)
        </div>
      )}

      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Frentes de Negócio</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              Nova Frente
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
                />
              </div>
              <Button onClick={handleCreateFront} className="w-full">
                Criar Frente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {fronts.map((front) => {
          const allocation = allocations.find(a => a.business_front_id === front.id);
          const percentage = allocation ? parseFloat(String(allocation.percentage)) : 0;
          const allocated = allocation ? parseFloat(String(allocation.allocated_amount)) : 0;

          return (
            <BusinessFrontCard
              key={front.id}
              front={front}
              percentage={percentage}
              allocatedAmount={allocated}
              onPercentageChange={(value) => handlePercentageChange(front.id, value)}
              allocationId={allocation?.id}
            />
          );
        })}
      </div>

      <div>
        <h2 className="text-2xl font-semibold mb-4">Resumo Consolidado</h2>
        <BudgetSummary platforms={platforms} totalBudget={totalBudget} />
      </div>
    </div>
  );
}