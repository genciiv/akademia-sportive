import { redirect } from "next/navigation";

import MedicalClient from "@/components/mjekesore/medical-client";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.MEDICAL_VIEW
    );

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  const canManageMedical =
    access.permissions.includes(
      PERMISSIONS.MEDICAL_MANAGE
    );

  return (
    <MedicalClient
      canManageMedical={
        canManageMedical
      }
    />
  );
}
