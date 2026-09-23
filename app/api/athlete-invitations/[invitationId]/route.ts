import { NextResponse } from "next/server";

import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { requireAcademyPermission } from "@/lib/academy-permissions";
import { canAccessPlayer } from "@/lib/academy-resource-scope";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  const access = await requireAcademyPermission(PERMISSIONS.PLAYERS_UPDATE);

  if (!access.ok) {
    return access.response;
  }

  const invitation = await prisma.athleteInvitation.findFirst({
    where: {
      id: (await params).invitationId,

      academyId: access.academyId,

      acceptedAt: null,
      revokedAt: null,
    },

    select: {
      id: true,
      playerId: true,
      email: true,

      player: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (!invitation) {
    return NextResponse.json(
      {
        error: "Ftesa nuk u gjet ose nuk \u00ebsht\u00eb m\u00eb aktive.",
      },
      {
        status: 404,
      },
    );
  }

  const hasPlayerAccess = await canAccessPlayer(access, invitation.playerId);

  if (!hasPlayerAccess) {
    return NextResponse.json(
      {
        error: "Nuk ke leje p\u00ebr t\u00eb aksesuar k\u00ebt\u00eb sportist.",
      },
      {
        status: 403,
      },
    );
  }

  const revokedAt = new Date();

  const athleteName =
    `${invitation.player.firstName} ${invitation.player.lastName}`.trim();

  await prisma.$transaction(async (tx) => {
    await tx.athleteInvitation.update({
      where: {
        id: invitation.id,
      },

      data: {
        revokedAt,
      },
    });

    await writeAuditLog({
      tx,

      academyId: access.academyId,

      actorUserId: access.session.user.id,

      action: AUDIT_ACTIONS.ATHLETE_INVITATION_REVOKED,

      entityType: "ATHLETE_INVITATION",

      entityId: invitation.id,

      entityLabel: athleteName,

      beforeData: {
        playerId: invitation.playerId,

        email: invitation.email,

        status: "PENDING",
      },

      afterData: {
        playerId: invitation.playerId,

        email: invitation.email,

        status: "REVOKED",

        revokedAt: revokedAt.toISOString(),
      },

      metadata: {
        playerId: invitation.playerId,
      },
    });
  });

  return NextResponse.json({
    message: "Ftesa p\u00ebr portalin e sportistit u revokua me sukses.",
  });
}
