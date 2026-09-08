import { merrAkademineAktive } from "@/lib/academy-context";
import ScoutingClient from "@/components/skautimi/scouting-client";

export default async function Page() {
  await merrAkademineAktive();

  return <ScoutingClient />;
}