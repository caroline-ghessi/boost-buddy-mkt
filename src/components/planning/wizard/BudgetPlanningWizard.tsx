import { useWizardState } from "@/hooks/useWizardState";
import { useBusinessFronts } from "@/hooks/useBusinessFronts";
import { useBudgetPlan } from "@/hooks/useBudgetPlan";
import { useBudgetAllocations } from "@/hooks/useBudgetAllocations";
import { BudgetStep } from "./BudgetStep";
import { FrontsAllocationStep } from "./FrontsAllocationStep";
import { PlatformDistributionStep } from "./PlatformDistributionStep";
import { ReviewStep } from "./ReviewStep";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export const BudgetPlanningWizard = () => {
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const { fronts, createFront } = useBusinessFronts();
  const { createPlan } = useBudgetPlan();
  const { createAllocation, upsertPlatformDistribution } = useBudgetAllocations(null);

  const {
    state,
    setStep,
    setBudgetInfo,
    toggleFront,
    setFrontPercentage,
    setPlatformDistribution,
    getTotalAllocated,
    getSelectedFronts,
    getPlatformTotals,
    canProceedToStep2,
    canProceedToStep3,
    canProceedToStep4,
    reset,
  } = useWizardState();

  const handleNext = (step: number) => {
    setStep(step);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateFront = async (name: string) => {
    await createFront({
      name,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      is_active: true,
    });
  };

  const handleSave = async () => {
    if (!state.periodStart || !state.periodEnd) return;

    setIsSaving(true);
    try {
      // Create budget plan
      const plan = await createPlan({
        name: `Plano ${new Date().toLocaleDateString("pt-BR")}`,
        total_budget: state.totalBudget,
        period_start: state.periodStart.toISOString().split("T")[0],
        period_end: state.periodEnd.toISOString().split("T")[0],
        status: "draft",
      });

      if (!plan) {
        throw new Error("Failed to create plan");
      }

      // Create allocations for each selected front
      const selectedFronts = getSelectedFronts();
      for (const front of selectedFronts) {
        const allocation = await createAllocation({
          budget_plan_id: plan.id,
          business_front_id: front.id,
          percentage: front.percentage,
          allocated_amount: front.amount,
        });

        if (!allocation) continue;

        // Create platform distributions
        const platforms = state.platformDistributions.get(front.id);
        if (platforms) {
          await upsertPlatformDistribution({
            budget_allocation_id: allocation.id,
            platform: "google",
            percentage: platforms.google,
            monthly_amount: (front.amount * platforms.google) / 100,
            daily_amount: (front.amount * platforms.google) / 100 / 30,
          });

          await upsertPlatformDistribution({
            budget_allocation_id: allocation.id,
            platform: "meta",
            percentage: platforms.meta,
            monthly_amount: (front.amount * platforms.meta) / 100,
            daily_amount: (front.amount * platforms.meta) / 100 / 30,
          });

          await upsertPlatformDistribution({
            budget_allocation_id: allocation.id,
            platform: "tiktok",
            percentage: platforms.tiktok,
            monthly_amount: (front.amount * platforms.tiktok) / 100,
            daily_amount: (front.amount * platforms.tiktok) / 100 / 30,
          });
        }
      }

      toast.success("Plano criado com sucesso!");
      reset();
      navigate("/planning");
    } catch (error) {
      console.error("Error saving plan:", error);
      toast.error("Erro ao salvar o plano");
    } finally {
      setIsSaving(false);
    }
  };

  const progress = (state.step / 4) * 100;

  const frontsList = Array.from(state.frontAllocations.values()).map((f) => ({
    ...f,
    name: fronts.find((front) => front.id === f.id)?.name || f.name,
  }));

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span className={state.step >= 1 ? "text-primary font-medium" : ""}>
              1. Orçamento
            </span>
            <span className={state.step >= 2 ? "text-primary font-medium" : ""}>
              2. Frentes
            </span>
            <span className={state.step >= 3 ? "text-primary font-medium" : ""}>
              3. Plataformas
            </span>
            <span className={state.step >= 4 ? "text-primary font-medium" : ""}>
              4. Revisão
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps */}
        {state.step === 1 && (
          <BudgetStep
            initialBudget={state.totalBudget}
            initialPeriodStart={state.periodStart}
            initialPeriodEnd={state.periodEnd}
            onNext={(budget, start, end) => {
              setBudgetInfo(budget, start, end);
              if (canProceedToStep2()) handleNext(2);
            }}
          />
        )}

        {state.step === 2 && (
          <FrontsAllocationStep
            totalBudget={state.totalBudget}
            fronts={frontsList}
            availableFronts={fronts}
            onFrontToggle={toggleFront}
            onPercentageChange={setFrontPercentage}
            onCreateFront={handleCreateFront}
            onNext={() => canProceedToStep3() && handleNext(3)}
            onBack={() => handleNext(1)}
            totalAllocated={getTotalAllocated()}
          />
        )}

        {state.step === 3 && (
          <PlatformDistributionStep
            fronts={getSelectedFronts()}
            distributions={state.platformDistributions}
            onDistributionChange={setPlatformDistribution}
            onNext={() => canProceedToStep4() && handleNext(4)}
            onBack={() => handleNext(2)}
          />
        )}

        {state.step === 4 && state.periodStart && state.periodEnd && (
          <ReviewStep
            totalBudget={state.totalBudget}
            periodStart={state.periodStart}
            periodEnd={state.periodEnd}
            fronts={getSelectedFronts()}
            distributions={state.platformDistributions}
            platformTotals={getPlatformTotals()}
            onBack={() => handleNext(3)}
            onSave={handleSave}
            isSaving={isSaving}
          />
        )}
      </div>
    </div>
  );
};
