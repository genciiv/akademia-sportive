import { NextResponse } from "next/server";

import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { requireAcademyPermission } from "@/lib/academy-permissions";
import { canAccessPlayer } from "@/lib/academy-resource-scope";
import { sendAthleteInvitationEmail } from "@/lib/athlete-invitation-email";
import { checkAthletePortalAccess } from "@/lib/athlete-portal-access";
import {
  createInvitationToken,
  createOnboardingExpiry,
  hashInvitationToken,
} from "@/lib/invitation-token";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
};

function portalAccessError(reason: string) {
  switch (reason) {
    case "TRIAL_NOT_ELIGIBLE":
      return "Portali i sportistit nuk \u00ebsht\u00eb i disponuesh\u00ebm gjat\u00eb periudh\u00ebs s\u00eb prov\u00ebs.";

    case "SUBSCRIPTION_INACTIVE":
      return "Abonimi i akademis\u00eb nuk \u00ebsht\u00eb aktiv.";

    case "FEATURE_NOT_INCLUDED":
      return "Plani aktual nuk p\u00ebrfshin portalin e sportistit.";

    case "ACCOUNT_LIMIT_DISABLED":
      return "Plani aktual nuk lejon llogari t\u00eb sportist\u00ebve.";

    case "LIMIT_REACHED":
      return "\u00cbsht\u00eb arritur kufiri maksimal i llogarive t\u00eb sportist\u00ebve.";

    case "NO_SUBSCRIPTION":
      return "Akademia nuk ka nj\u00eb abonim t\u00eb konfiguruar.";

    default:
      return "Portali i sportistit nuk \u00ebsht\u00eb i disponuesh\u00ebm.";
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
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
      expiresAt: true,

      player: {
        select: {
          firstName: true,
          lastName: true,

          athleteAccount: {
            select: {
              id: true,
            },
          },
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

  if (invitation.player.athleteAccount) {
    return NextResponse.json(
      {
        error:
          "Ky sportist ka tashm\u00eb nj\u00eb llogari aktive n\u00eb portal.",
      },
      {
        status: 409,
      },
    );
  }

  const portalAccess = await checkAthletePortalAccess(access.academyId);

  if (!portalAccess.allowed) {
    return NextResponse.json(
      {
        error: portalAccessError(portalAccess.reason),

        reason: portalAccess.reason,

        currentAthleteAccounts: portalAccess.currentAthleteAccounts,

        maxAthleteAccounts: portalAccess.maxAthleteAccounts,
      },
      {
        status: portalAccess.reason === "LIMIT_REACHED" ? 409 : 403,
      },
    );
  }

  const now = new Date();

  const token = createInvitationToken();

  const tokenHash = hashInvitationToken(token);

  const expiresAt = createOnboardingExpiry(now);

  const athleteName =
    `${invitation.player.firstName} ${invitation.player.lastName}`.trim();

  const replacement = await prisma.$transaction(async (tx) => {
    await tx.athleteInvitation.update({
      where: {
        id: invitation.id,
      },

      data: {
        revokedAt: now,
      },
    });

    const created = await tx.athleteInvitation.create({
      data: {
        academyId: access.academyId,

        playerId: invitation.playerId,

        email: invitation.email,

        token: tokenHash,

        expiresAt,

        invitedByUserId: access.session.user.id,
      },

      select: {
        id: true,
        expiresAt: true,
      },
    });

    await writeAuditLog({
      tx,

      academyId: access.academyId,

      actorUserId: access.session.user.id,

      action: AUDIT_ACTIONS.ATHLETE_INVITATION_RESENT,

      entityType: "ATHLETE_INVITATION",

      entityId: created.id,

      entityLabel: athleteName,

      beforeData: {
        invitationId: invitation.id,

        playerId: invitation.playerId,

        email: invitation.email,

        status: "PENDING",

        expiresAt: invitation.expiresAt.toISOString(),
      },

      afterData: {
        invitationId: created.id,

        playerId: invitation.playerId,

        email: invitation.email,

        status: "PENDING",

        expiresAt: created.expiresAt.toISOString(),
      },

      metadata: {
        playerId: invitation.playerId,

        replacedInvitationId: invitation.id,
      },
    });

    return created;
  });

  const emailDelivery = await sendAthleteInvitationEmail({
    email: invitation.email,

    athleteName,

    academyName: access.academy.name,

    invitationToken: token,

    expiresAt: replacement.expiresAt,
  });

  return NextResponse.json({
    message: "Ftesa p\u00ebr portalin e sportistit u rid\u00ebrgua me sukses.",

    emailDelivery,

    invitation: {
      id: replacement.id,

      invitePath: `/sportist/ftesa/${token}`,

      expiresAt: replacement.expiresAt,
    },
  });
}
