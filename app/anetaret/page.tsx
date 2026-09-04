import { merrAkademineAktive } from "@/lib/academy-context";
import SportistetClient from "@/components/sportistet/sportistet-client";

export default async function Page() {
  await merrAkademineAktive();

  return <SportistetClient />;
}