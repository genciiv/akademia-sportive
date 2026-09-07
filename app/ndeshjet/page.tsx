import { merrAkademineAktive } from "@/lib/academy-context";
import NdeshjetClient from "@/components/ndeshjet/ndeshjet-client";

export default async function Page() {
  await merrAkademineAktive();

  return <NdeshjetClient />;
}