import { merrAkademineAktive } from "@/lib/academy-context";
import TrajneretClient from "@/components/trajneret/trajneret-client";

export default async function Page() {
  await merrAkademineAktive();

  return <TrajneretClient />;
}