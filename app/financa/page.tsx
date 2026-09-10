import FinanceDashboardClient from "@/components/financa/finance-dashboard-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <FinanceDashboardClient />;
}