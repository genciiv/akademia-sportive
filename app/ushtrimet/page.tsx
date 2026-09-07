import { merrAkademineAktive } from "@/lib/academy-context";
import UshtrimetClient from "@/components/ushtrimet/ushtrimet-client";

export default async function Page() {
  await merrAkademineAktive();

  return <UshtrimetClient />;
}