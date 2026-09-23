import { NextResponse } from "next/server";

import { requireAcademyPermission } from "@/lib/academy-permissions";
import { getActiveTeamScope } from "@/lib/academy-resource-scope";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

function resolveInvitationStatus(input: {
  acceptedAt: Date | null;
  revokedAt: Date | null;
  expiresAt: Date;
  now: Date;
}) {
  if (input.acceptedAt) {
    return "ACCEPTED";
  }

  if (input.revokedAt) {
    return "REVOKED";
  }

  if (input.expiresAt <= input.now) {
    return "EXPIRED";
  }

  return "PENDING";
}

export async function GET() {
  const access = await requireAcademyPermission(PERMISSIONS.PLAYERS_UPDATE);

  if (!access.ok) {
    return access.response;
  }

  const teamScope = await getActiveTeamScope(access);

  if (teamScope.isScoped && teamScope.teamIds.length === 0) {
    return NextResponse.json({
      invitations: [],
    });
  }

  const now = new Date();

  const invitations = await prisma.athleteInvitation.findMany({
    where: {
      academyId: access.academyId,

      ...(teamScope.isScoped
        ? {
            player: {
              teams: {
                some: {
                  isActive: true,
                  teamId: {
                    in: teamScope.teamIds,
                  },
                },
              },
            },
          }
        : {}),
    },

    select: {
      id: true,
      email: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,
      createdAt: true,

      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },

      invitedByUser: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },

    orderBy: {
      createdAt: "desc",
    },
  });

  return NextResponse.json({
    invitations: invitations.map((invitation) => ({
      id: invitation.id,

      email: invitation.email,

      status: resolveInvitationStatus({
        acceptedAt: invitation.acceptedAt,

        revokedAt: invitation.revokedAt,

        expiresAt: invitation.expiresAt,

        now,
      }),

      expiresAt: invitation.expiresAt,

      acceptedAt: invitation.acceptedAt,

      revokedAt: invitation.revokedAt,

      createdAt: invitation.createdAt,

      player: {
        id: invitation.player.id,

        firstName: invitation.player.firstName,

        lastName: invitation.player.lastName,

        status: invitation.player.status,
      },

      invitedBy: invitation.invitedByUser
        ? {
            id: invitation.invitedByUser.id,

            name: invitation.invitedByUser.name,

            email: invitation.invitedByUser.email,
          }
        : null,
    })),
  });
}
