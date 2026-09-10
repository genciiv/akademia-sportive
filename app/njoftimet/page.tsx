import NotificationsClient from "@/components/njoftimet/notifications-client";
import { merrAkademineAktive } from "@/lib/academy-context";

export default async function Page() {
  await merrAkademineAktive();

  return <NotificationsClient />;
}