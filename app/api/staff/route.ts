import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
  ROLE_LABELS,
  type AcademyRoleName,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  INVITED: "Ftesë në pritje",
  SUSPENDED: "Pezulluar",
  REMOVED: "Hequr",
};

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const memberships =
    await prisma.academyMembership.findMany({
      where: {
        academyId: access.academyId,
        status: {
          not: "REMOVED",
        },
      },
      select: {
        id: true,
        role: true,
        status: true,
        joinedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },

        coachProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
      orderBy: {
        joinedAt: "asc",
      },
    });

  const staff = memberships.map(
    (membership) => {
      const role =
        String(
          membership.role
        ) as AcademyRoleName;

      const status =
        String(
          membership.status
        );

      return {
        id: membership.id,

        role,
        roleLabel:
          ROLE_LABELS[role] ??
          "Anëtar",

        status,
        statusLabel:
          STATUS_LABELS[status] ??
          status,

        joinedAt:
          membership.joinedAt,

        isCurrentUser:
          membership.id ===
          access.membership.id,

        isOwner:
          role === "OWNER",

        user: membership.user,

        coachProfile:
          membership.coachProfile,
      };
    }
  );

  return NextResponse.json({
    academy: {
      id: access.academy.id,
      name: access.academy.name,
    },
    permissions: access.permissions,
    staff,
  });
}