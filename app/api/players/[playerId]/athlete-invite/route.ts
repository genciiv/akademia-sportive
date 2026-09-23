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
    playerId: string;
  }>;
};

function portalAccessError(reason: string) {
  switch (reason) {
    case "TRIAL_NOT_ELIGIBLE":
      return "Portali i sportistit nuk është i disponueshëm gjatë periudhës së provës.";

    case "SUBSCRIPTION_INACTIVE":
      return "Abonimi i akademisë nuk është aktiv.";

    case "FEATURE_NOT_INCLUDED":
      return "Plani aktual nuk përfshin portalin e sportistit.";

    case "ACCOUNT_LIMIT_DISABLED":
      return "Plani aktual nuk lejon llogari të sportistëve.";

    case "LIMIT_REACHED":
      return "Është arritur kufiri maksimal i llogarive të sportistëve.";

    case "NO_SUBSCRIPTION":
      return "Akademia nuk ka një abonim të konfiguruar.";

    default:
      return "Portali i sportistit nuk është i disponueshëm.";
  }
}

export async function POST(_request: Request, { params }: RouteContext) {
  const access = await requireAcademyPermission(PERMISSIONS.PLAYERS_UPDATE);

  if (!access.ok) {
    return access.response;
  }

  const playerId = (await params).playerId;

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: access.academyId,
    },
    select: {
      id: true,
      academyId: true,
      firstName: true,
      lastName: true,
      email: true,
      athleteAccount: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!player) {
    return NextResponse.json(
      {
        error: "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      },
    );
  }

  const hasPlayerAccess = await canAccessPlayer(access, player.id);

  if (!hasPlayerAccess) {
    return NextResponse.json(
      {
        error: "Nuk ke leje për të aksesuar këtë sportist.",
      },
      {
        status: 403,
      },
    );
  }

  if (player.athleteAccount) {
    return NextResponse.json(
      {
        error: "Ky sportist ka tashmë një llogari aktive në portal.",
      },
      {
        status: 409,
      },
    );
  }

  const email = player.email?.trim().toLowerCase();

  if (!email) {
    return NextResponse.json(
      {
        error:
          "Sportisti duhet të ketë një email të regjistruar para se të dërgohet ftesa.",
      },
      {
        status: 400,
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

  const existingInvitation = await prisma.athleteInvitation.findFirst({
    where: {
      academyId: access.academyId,
      playerId: player.id,
      acceptedAt: null,
      revokedAt: null,
      expiresAt: {
        gt: now,
      },
    },
    select: {
      id: true,
      expiresAt: true,
    },
  });

  if (existingInvitation) {
    return NextResponse.json(
      {
        error: "Ekziston tashmë një ftesë aktive për këtë sportist.",
        invitation: {
          id: existingInvitation.id,
          expiresAt: existingInvitation.expiresAt,
        },
      },
      {
        status: 409,
      },
    );
  }

  const token = createInvitationToken();

  const tokenHash = hashInvitationToken(token);

  const expiresAt = createOnboardingExpiry(now);

  const athleteName = `${player.firstName} ${player.lastName}`.trim();

  const invitation = await prisma.$transaction(async (tx) => {
    await tx.athleteInvitation.updateMany({
      where: {
        academyId: access.academyId,
        playerId: player.id,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          lte: now,
        },
      },
      data: {
        revokedAt: now,
      },
    });

    const created = await tx.athleteInvitation.create({
      data: {
        academyId: access.academyId,
        playerId: player.id,
        email,
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
      action: AUDIT_ACTIONS.ATHLETE_INVITATION_CREATED,
      entityType: "ATHLETE_INVITATION",
      entityId: created.id,
      entityLabel: athleteName,
      afterData: {
        playerId: player.id,
        email,
        status: "PENDING",
        expiresAt: created.expiresAt.toISOString(),
      },
      metadata: {
        playerId: player.id,
      },
    });

    return created;
  });

  const emailDelivery = await sendAthleteInvitationEmail({
    email,
    athleteName,
    academyName: access.academy.name,
    invitationToken: token,
    expiresAt: invitation.expiresAt,
  });

  return NextResponse.json(
    {
      message: "Ftesa për portalin e sportistit u krijua me sukses.",
      emailDelivery,
      invitation: {
        id: invitation.id,
        invitePath: `/sportist/ftesa/${token}`,
        expiresAt: invitation.expiresAt,
      },
    },
    {
      status: 201,
    },
  );
}
