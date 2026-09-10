import ReportsClient from "@/components/raportet/reports-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <ReportsClient />;
}