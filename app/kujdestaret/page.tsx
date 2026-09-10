import GuardiansClient from "@/components/kujdestaret/guardians-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <GuardiansClient />;
}