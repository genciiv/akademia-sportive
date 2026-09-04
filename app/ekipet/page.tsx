import { merrAkademineAktive } from "@/lib/academy-context";
import EkipetClient from "@/components/ekipet/ekipet-client";

export default async function Page() {
  await merrAkademineAktive();

  return <EkipetClient />;
}