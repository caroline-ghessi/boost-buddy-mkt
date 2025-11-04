import { useState, useCallback } from "react";

export interface FrontAllocation {
  id: string;
  name: string;
  percentage: number;
  amount: number;
  selected: boolean;
}

export interface PlatformDistribution {
  google: number;
  meta: number;
  tiktok: number;
}

export interface WizardState {
  step: number;
  totalBudget: number;
  periodStart?: Date;
  periodEnd?: Date;
  frontAllocations: Map<string, FrontAllocation>;
  platformDistributions: Map<string, PlatformDistribution>;
}

export const useWizardState = () => {
  const [state, setState] = useState<WizardState>({
    step: 1,
    totalBudget: 0,
    frontAllocations: new Map(),
    platformDistributions: new Map(),
  });

  const setStep = useCallback((step: number) => {
    setState(prev => ({ ...prev, step }));
  }, []);

  const setBudgetInfo = useCallback((budget: number, start?: Date, end?: Date) => {
    setState(prev => ({
      ...prev,
      totalBudget: budget,
      periodStart: start,
      periodEnd: end,
    }));
  }, []);

  const toggleFront = useCallback((frontId: string, name: string) => {
    setState(prev => {
      const newFronts = new Map(prev.frontAllocations);
      const existing = newFronts.get(frontId);
      
      if (existing) {
        newFronts.set(frontId, {
          ...existing,
          selected: !existing.selected,
        });
      } else {
        newFronts.set(frontId, {
          id: frontId,
          name,
          percentage: 0,
          amount: 0,
          selected: true,
        });
      }
      
      return { ...prev, frontAllocations: newFronts };
    });
  }, []);

  const setFrontPercentage = useCallback((frontId: string, percentage: number) => {
    setState(prev => {
      const newFronts = new Map(prev.frontAllocations);
      const front = newFronts.get(frontId);
      
      if (front) {
        newFronts.set(frontId, {
          ...front,
          percentage,
          amount: (prev.totalBudget * percentage) / 100,
        });
      }
      
      return { ...prev, frontAllocations: newFronts };
    });
  }, []);

  const setPlatformDistribution = useCallback((frontId: string, distribution: PlatformDistribution) => {
    setState(prev => {
      const newPlatforms = new Map(prev.platformDistributions);
      newPlatforms.set(frontId, distribution);
      return { ...prev, platformDistributions: newPlatforms };
    });
  }, []);

  const getTotalAllocated = useCallback(() => {
    let total = 0;
    state.frontAllocations.forEach(front => {
      if (front.selected) {
        total += front.percentage;
      }
    });
    return total;
  }, [state.frontAllocations]);

  const getSelectedFronts = useCallback(() => {
    return Array.from(state.frontAllocations.values()).filter(f => f.selected);
  }, [state.frontAllocations]);

  const getPlatformTotals = useCallback(() => {
    const totals = { google: 0, meta: 0, tiktok: 0 };
    
    state.frontAllocations.forEach((front, frontId) => {
      if (!front.selected) return;
      
      const platforms = state.platformDistributions.get(frontId);
      if (!platforms) return;
      
      totals.google += (front.amount * platforms.google) / 100;
      totals.meta += (front.amount * platforms.meta) / 100;
      totals.tiktok += (front.amount * platforms.tiktok) / 100;
    });
    
    return totals;
  }, [state.frontAllocations, state.platformDistributions]);

  const canProceedToStep2 = useCallback(() => {
    return state.totalBudget > 0 && state.periodStart && state.periodEnd;
  }, [state.totalBudget, state.periodStart, state.periodEnd]);

  const canProceedToStep3 = useCallback(() => {
    const total = getTotalAllocated();
    return Math.abs(total - 100) < 0.1 && getSelectedFronts().length > 0;
  }, [getTotalAllocated, getSelectedFronts]);

  const canProceedToStep4 = useCallback(() => {
    const selectedFronts = getSelectedFronts();
    
    for (const front of selectedFronts) {
      const platforms = state.platformDistributions.get(front.id);
      if (!platforms) return false;
      
      const total = platforms.google + platforms.meta + platforms.tiktok;
      if (Math.abs(total - 100) > 0.1) return false;
    }
    
    return true;
  }, [getSelectedFronts, state.platformDistributions]);

  const reset = useCallback(() => {
    setState({
      step: 1,
      totalBudget: 0,
      frontAllocations: new Map(),
      platformDistributions: new Map(),
    });
  }, []);

  return {
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
  };
};
