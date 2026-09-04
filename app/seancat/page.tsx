import { merrAkademineAktive } from "@/lib/academy-context";
import SeancatClient from "@/components/seancat/seancat-client";

export default async function Page() {
  await merrAkademineAktive();

  return <SeancatClient />;
}