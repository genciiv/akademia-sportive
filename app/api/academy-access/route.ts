import { NextResponse } from "next/server";

import {
  getCurrentAcademyAccess,
} from "@/lib/academy-permissions";
import {
  ROLE_LABELS,
  type AcademyRoleName,
} from "@/lib/permissions";

export async function GET() {
  const access =
    await getCurrentAcademyAccess();

  if (!access.ok) {
    return access.response;
  }

  const role =
    access.role as AcademyRoleName;

  return NextResponse.json({
    academy: access.academy,
    membership: {
      id: access.membership.id,
      role,
      roleLabel:
        ROLE_LABELS[role] ??
        "Anëtar",
      status:
        access.membership.status,
    },
    permissions:
      access.permissions,
  });
}