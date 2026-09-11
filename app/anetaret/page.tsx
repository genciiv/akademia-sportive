import { redirect } from "next/navigation";

import SportistetClient from "@/components/sportistet/sportistet-client";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PLAYERS_VIEW
    );

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  return <SportistetClient />;
}