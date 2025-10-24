/**
 * Date utility functions with Brasília timezone support (UTC-3)
 */

/**
 * Convert UTC timestamp to Brasília time (BRT/BRST - UTC-3)
 */
export function toBrasiliaTime(utcDate: string | Date): Date {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // Brasília is UTC-3 (no DST since 2019)
  const brasiliaOffset = -3 * 60; // minutes
  const utcTime = date.getTime();
  const brasiliaTime = new Date(utcTime + brasiliaOffset * 60 * 1000);
  return brasiliaTime;
}

/**
 * Calculate how many days ago a date was
 */
export function getDaysAgo(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Calculate how many hours ago a date was
 */
export function getHoursAgo(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  return diffHours;
}

/**
 * Format timestamp in a human-readable way (Portuguese)
 */
export function formatTimeAgo(dateString: string): string {
  const hoursAgo = getHoursAgo(dateString);
  const daysAgo = getDaysAgo(dateString);

  if (hoursAgo < 1) {
    return "agora mesmo";
  } else if (hoursAgo < 24) {
    return `há ${hoursAgo}h`;
  } else if (daysAgo === 1) {
    return "ontem";
  } else if (daysAgo < 7) {
    return `há ${daysAgo} dias`;
  } else if (daysAgo < 30) {
    const weeks = Math.floor(daysAgo / 7);
    return `há ${weeks} semana${weeks > 1 ? 's' : ''}`;
  } else {
    const months = Math.floor(daysAgo / 30);
    return `há ${months} mês${months > 1 ? 'es' : ''}`;
  }
}

/**
 * Get next scheduled scrape time (Fridays at 7:00 AM Brasília time)
 */
export function getNextScheduledScrape(): Date {
  const now = new Date();
  const brasiliaTime = toBrasiliaTime(now);
  
  // Get current day of week (0 = Sunday, 5 = Friday)
  const currentDay = brasiliaTime.getDay();
  const currentHour = brasiliaTime.getHours();
  
  // Calculate days until next Friday
  let daysUntilFriday = 5 - currentDay;
  
  // If it's Friday but past 7 AM, or after Friday, go to next Friday
  if (currentDay === 5 && currentHour >= 7) {
    daysUntilFriday = 7;
  } else if (currentDay > 5) {
    daysUntilFriday = 7 - currentDay + 5;
  } else if (daysUntilFriday < 0) {
    daysUntilFriday += 7;
  }
  
  const nextFriday = new Date(brasiliaTime);
  nextFriday.setDate(brasiliaTime.getDate() + daysUntilFriday);
  nextFriday.setHours(7, 0, 0, 0);
  
  return nextFriday;
}

/**
 * Format next scheduled scrape in Portuguese
 */
export function formatNextScheduledScrape(): string {
  const nextScrape = getNextScheduledScrape();
  const daysUntil = getDaysAgo(new Date().toISOString()) - getDaysAgo(nextScrape.toISOString());
  
  if (daysUntil === 0) {
    return "hoje às 7h";
  } else if (daysUntil === 1) {
    return "amanhã às 7h";
  } else {
    return `em ${Math.abs(daysUntil)} dias (sexta 7h)`;
  }
}

/**
 * Check if data is stale (older than threshold days)
 */
export function isDataStale(dateString: string, thresholdDays: number = 3): boolean {
  const daysAgo = getDaysAgo(dateString);
  return daysAgo > thresholdDays;
}

/**
 * Get staleness status and badge variant
 */
export function getStalenessInfo(dateString: string): {
  isStale: boolean;
  severity: 'fresh' | 'recent' | 'stale' | 'very-stale';
  label: string;
  badgeVariant: 'default' | 'secondary' | 'outline' | 'destructive';
} {
  const daysAgo = getDaysAgo(dateString);
  
  if (daysAgo === 0) {
    return {
      isStale: false,
      severity: 'fresh',
      label: 'Atualizado hoje',
      badgeVariant: 'default'
    };
  } else if (daysAgo <= 2) {
    return {
      isStale: false,
      severity: 'recent',
      label: `Atualizado há ${daysAgo} dia${daysAgo > 1 ? 's' : ''}`,
      badgeVariant: 'secondary'
    };
  } else if (daysAgo <= 7) {
    return {
      isStale: true,
      severity: 'stale',
      label: `Atualizado há ${daysAgo} dias`,
      badgeVariant: 'outline'
    };
  } else {
    return {
      isStale: true,
      severity: 'very-stale',
      label: `Atualizado há ${daysAgo} dias`,
      badgeVariant: 'destructive'
    };
  }
}
