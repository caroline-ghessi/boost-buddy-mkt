export interface MetricChange {
  value: string;
  isPositive: boolean;
  isZero: boolean;
}

export function calculateMetricChange(
  currentPeriod: number,
  previousPeriod: number
): MetricChange {
  if (previousPeriod === 0 && currentPeriod === 0) {
    return { value: "—", isPositive: true, isZero: true };
  }
  
  if (previousPeriod === 0) {
    return { value: "—", isPositive: true, isZero: true };
  }
  
  const change = ((currentPeriod - previousPeriod) / previousPeriod) * 100;
  
  return {
    value: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
    isPositive: change >= 0,
    isZero: false,
  };
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(0)}K`;
  }
  return num.toLocaleString('pt-BR');
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(amount);
}

export function formatPercentage(value: number): string {
  return `${value.toFixed(2)}%`;
}

export function calculateROAS(revenue: number, cost: number): number {
  if (cost === 0) return 0;
  return revenue / cost;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateConversionRate(conversions: number, clicks: number): number {
  if (clicks === 0) return 0;
  return (conversions / clicks) * 100;
}
