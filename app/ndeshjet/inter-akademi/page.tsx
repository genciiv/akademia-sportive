import { merrAkademineAktive } from "@/lib/academy-context";

import InterAcademyClient from "@/components/ndeshjet/inter-akademi-client";

export default async function Page() {
  await merrAkademineAktive();

  return <InterAcademyClient />;
}