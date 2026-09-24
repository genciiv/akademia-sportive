import { redirect } from "next/navigation";

import ScoutingClient from "@/components/skautimi/scouting-client";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SCOUTING_VIEW
    );

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  return <ScoutingClient />;
}