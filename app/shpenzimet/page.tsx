import ExpensesClient from "@/components/shpenzimet/expenses-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <ExpensesClient />;
}