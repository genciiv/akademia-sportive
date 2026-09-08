import PaymentsClient from "@/components/pagesat/payments-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <PaymentsClient />;
}