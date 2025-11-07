import { createContext, useContext, useState, ReactNode } from 'react';
import { DateRange } from 'react-day-picker';

interface AnalyticsDateContextType {
  dateRange: DateRange | undefined;
  setDateRange: (range: DateRange | undefined) => void;
}

const AnalyticsDateContext = createContext<AnalyticsDateContextType | undefined>(undefined);

export function AnalyticsDateProvider({ children }: { children: ReactNode }) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    // Default to last 30 days
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 30);
    return { from: start, to: end };
  });

  return (
    <AnalyticsDateContext.Provider value={{ dateRange, setDateRange }}>
      {children}
    </AnalyticsDateContext.Provider>
  );
}

export function useAnalyticsDate() {
  const context = useContext(AnalyticsDateContext);
  if (context === undefined) {
    throw new Error('useAnalyticsDate must be used within an AnalyticsDateProvider');
  }
  return context;
}
