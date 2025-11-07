import PerformanceDashboard from "@/components/dashboard/PerformanceDashboard";
import { AnalyticsDateProvider } from "@/contexts/AnalyticsDateContext";

export default function Performance() {
  return (
    <AnalyticsDateProvider>
      <PerformanceDashboard />
    </AnalyticsDateProvider>
  );
}
