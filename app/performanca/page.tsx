import PerformanceDashboardClient from "@/components/performanca/performance-dashboard-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <PerformanceDashboardClient />;
}