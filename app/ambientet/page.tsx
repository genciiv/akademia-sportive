import { redirect } from "next/navigation";

import FacilitiesClient from "@/components/ambientet/facilities-client";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.FACILITIES_VIEW
    );

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  const canManageFacilities =
    access.permissions.includes(
      PERMISSIONS.FACILITIES_MANAGE
    );

  return (
    <FacilitiesClient
      canManageFacilities={
        canManageFacilities
      }
    />
  );
}
