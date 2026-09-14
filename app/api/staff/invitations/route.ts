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

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const now = new Date();

  const invitations =
    await prisma.academyInvitation.findMany({
      where: {
        academyId:
          access.academyId,

        acceptedAt: null,
        revokedAt: null,
      },

      select: {
        id: true,
        staffId: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        createdAt: true,

        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },

        invitedByUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },

      orderBy: {
        createdAt: "desc",
      },
    });

  return NextResponse.json({
    invitations:
      invitations.map(
        (invitation) => {
          const role =
            String(
              invitation.role
            ) as AcademyRoleName;

          const isExpired =
            invitation.expiresAt <=
            now;

          return {
            id:
              invitation.id,

            staffId:
              invitation.staffId,

            staff:
              invitation.staff,

            email:
              invitation.email,

            role,

            roleLabel:
              ROLE_LABELS[role] ??
              "Anëtar",

            expiresAt:
              invitation.expiresAt,

            createdAt:
              invitation.createdAt,

            invitePath:
              `/ftesa/${invitation.token}`,

            status:
              isExpired
                ? "EXPIRED"
                : "PENDING",

            statusLabel:
              isExpired
                ? "Skaduar"
                : "Në pritje",

            invitedBy:
              invitation.invitedByUser,
          };
        }
      ),
  });
}