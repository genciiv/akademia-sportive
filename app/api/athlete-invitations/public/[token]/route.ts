import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { AUDIT_ACTIONS, writeAuditLog } from "@/lib/audit-log";
import { auth } from "@/lib/auth";
import { checkAthletePortalAccess } from "@/lib/athlete-portal-access";
import { hashInvitationToken } from "@/lib/invitation-token";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function invalidInvitationResponse() {
  return NextResponse.json(
    {
      valid: false,
      error: "Ftesa nuk \u00ebsht\u00eb e vlefshme ose ka skaduar.",
    },
    {
      status: 404,
    },
  );
}

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

export async function GET(_request: Request, { params }: RouteContext) {
  const { token: rawToken } = await params;

  const token = rawToken.trim();

  if (token.length < 16 || token.length > 512) {
    return invalidInvitationResponse();
  }

  const tokenHash = hashInvitationToken(token);

  const now = new Date();

  const invitation = await prisma.athleteInvitation.findUnique({
    where: {
      token: tokenHash,
    },

    select: {
      id: true,
      email: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,

      academy: {
        select: {
          id: true,
          name: true,
        },
      },

      player: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (
    !invitation ||
    invitation.acceptedAt !== null ||
    invitation.revokedAt !== null ||
    invitation.expiresAt <= now
  ) {
    return invalidInvitationResponse();
  }

  const email = normalizeEmail(invitation.email);

  const existingUser = await prisma.user.findUnique({
    where: {
      email,
    },

    select: {
      id: true,
    },
  });

  return NextResponse.json({
    valid: true,

    type: "ATHLETE",

    email,

    accountExists: existingUser !== null,

    athleteName:
      `${invitation.player.firstName} ${invitation.player.lastName}`.trim(),

    academyName: invitation.academy.name,

    expiresAt: invitation.expiresAt,

    nextPath: `/sportist/ftesa/${encodeURIComponent(token)}`,
  });
}

const MAX_ACCEPTANCE_TRANSACTION_RETRIES = 3;

function getPrismaErrorCode(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    return error.code;
  }

  return null;
}

function isRetryableAcceptanceConflict(error: unknown) {
  return getPrismaErrorCode(error) === "P2034";
}

export async function POST(_request: Request, { params }: RouteContext) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error:
          "Duhet t\u00eb hysh n\u00eb llogari p\u00ebr t\u00eb pranuar ftes\u00ebn.",
      },
      {
        status: 401,
      },
    );
  }

  const { token: rawToken } = await params;

  const token = rawToken.trim();

  if (token.length < 16 || token.length > 512) {
    return invalidInvitationResponse();
  }

  const tokenHash = hashInvitationToken(token);

  const now = new Date();

  const invitation = await prisma.athleteInvitation.findUnique({
    where: {
      token: tokenHash,
    },

    select: {
      id: true,
      academyId: true,
      playerId: true,
      email: true,
      expiresAt: true,
      acceptedAt: true,
      revokedAt: true,

      player: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (
    !invitation ||
    invitation.acceptedAt !== null ||
    invitation.revokedAt !== null ||
    invitation.expiresAt <= now
  ) {
    return invalidInvitationResponse();
  }

  const sessionEmail = normalizeEmail(session.user.email || "");

  const invitationEmail = normalizeEmail(invitation.email);

  if (!sessionEmail || sessionEmail !== invitationEmail) {
    return NextResponse.json(
      {
        error:
          "Kjo ftes\u00eb \u00ebsht\u00eb d\u00ebrguar n\u00eb nj\u00eb adres\u00eb tjet\u00ebr emaili.",
      },
      {
        status: 403,
      },
    );
  }

  const portalAccess = await checkAthletePortalAccess(invitation.academyId);

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

  const athleteName =
    `${invitation.player.firstName} ${invitation.player.lastName}`.trim();

  try {
    const acceptInvitationTransaction = () =>
      prisma.$transaction(
        async (tx) => {
          const currentInvitation = await tx.athleteInvitation.findUnique({
            where: {
              id: invitation.id,
            },

            select: {
              acceptedAt: true,
              revokedAt: true,
              expiresAt: true,
            },
          });

          if (
            !currentInvitation ||
            currentInvitation.acceptedAt !== null ||
            currentInvitation.revokedAt !== null ||
            currentInvitation.expiresAt <= new Date()
          ) {
            throw new Error("ATHLETE_INVITATION_INACTIVE");
          }

          const existingPlayerAccount = await tx.athleteAccount.findFirst({
            where: {
              academyId: invitation.academyId,

              playerId: invitation.playerId,
            },

            select: {
              id: true,
              userId: true,
            },
          });

          if (existingPlayerAccount) {
            if (existingPlayerAccount.userId === session.user.id) {
              throw new Error("ATHLETE_ACCOUNT_ALREADY_LINKED");
            }

            throw new Error("PLAYER_ALREADY_LINKED");
          }

          const existingUserAccount = await tx.athleteAccount.findFirst({
            where: {
              academyId: invitation.academyId,

              userId: session.user.id,
            },

            select: {
              id: true,
            },
          });

          if (existingUserAccount) {
            throw new Error("USER_ALREADY_LINKED_IN_ACADEMY");
          }

          const currentAthleteAccounts = await tx.athleteAccount.count({
            where: {
              academyId: invitation.academyId,
            },
          });

          if (currentAthleteAccounts >= portalAccess.maxAthleteAccounts) {
            throw new Error("ATHLETE_ACCOUNT_LIMIT_REACHED");
          }

          const athleteAccount = await tx.athleteAccount.create({
            data: {
              academyId: invitation.academyId,

              playerId: invitation.playerId,

              userId: session.user.id,
            },

            select: {
              id: true,
              academyId: true,
              playerId: true,
              userId: true,
            },
          });

          const acceptedAt = new Date();

          await tx.athleteInvitation.update({
            where: {
              id: invitation.id,
            },

            data: {
              acceptedAt,
            },
          });

          await writeAuditLog({
            tx,

            academyId: invitation.academyId,

            actorUserId: session.user.id,

            action: AUDIT_ACTIONS.ATHLETE_ACCOUNT_LINKED,

            entityType: "ATHLETE_ACCOUNT",

            entityId: athleteAccount.id,

            entityLabel: athleteName,

            afterData: {
              playerId: invitation.playerId,

              userId: session.user.id,

              invitationId: invitation.id,

              status: "ACTIVE",

              acceptedAt: acceptedAt.toISOString(),
            },

            metadata: {
              playerId: invitation.playerId,

              invitationId: invitation.id,
            },
          });

          return athleteAccount;
        },
        {
          isolationLevel: "Serializable",
        },
      );

    let result: Awaited<ReturnType<typeof acceptInvitationTransaction>>;

    for (let attempt = 1; ; attempt += 1) {
      try {
        result = await acceptInvitationTransaction();
        break;
      } catch (error) {
        if (
          !isRetryableAcceptanceConflict(error) ||
          attempt >= MAX_ACCEPTANCE_TRANSACTION_RETRIES
        ) {
          throw error;
        }
      }
    }

    return NextResponse.json({
      message: "Ftesa u pranua me sukses.",

      athleteAccount: {
        id: result.id,

        academyId: result.academyId,

        playerId: result.playerId,
      },
    });
  } catch (error) {
    const prismaCode = getPrismaErrorCode(error);

    if (prismaCode === "P2002") {
      return NextResponse.json(
        {
          error:
            "Lidhja e sportistit është krijuar tashmë nga një kërkesë tjetër.",
          reason: "CONCURRENT_LINK_CONFLICT",
        },
        {
          status: 409,
        },
      );
    }

    if (prismaCode === "P2034") {
      return NextResponse.json(
        {
          error:
            "Kërkesa u përplas me një veprim tjetër paralel. Provo përsëri.",
          reason: "TRANSACTION_CONFLICT",
        },
        {
          status: 409,
        },
      );
    }

    if (error instanceof Error) {
      switch (error.message) {
        case "ATHLETE_INVITATION_INACTIVE":
          return NextResponse.json(
            {
              error: "Ftesa nuk \u00ebsht\u00eb m\u00eb aktive.",
            },
            {
              status: 409,
            },
          );

        case "ATHLETE_ACCOUNT_ALREADY_LINKED":
          return NextResponse.json(
            {
              error:
                "Kjo llogari \u00ebsht\u00eb lidhur tashm\u00eb me sportistin.",
            },
            {
              status: 409,
            },
          );

        case "PLAYER_ALREADY_LINKED":
          return NextResponse.json(
            {
              error:
                "Ky sportist \u00ebsht\u00eb lidhur tashm\u00eb me nj\u00eb llogari tjet\u00ebr.",
            },
            {
              status: 409,
            },
          );

        case "USER_ALREADY_LINKED_IN_ACADEMY":
          return NextResponse.json(
            {
              error:
                "Kjo llogari \u00ebsht\u00eb lidhur tashm\u00eb me nj\u00eb sportist n\u00eb k\u00ebt\u00eb akademi.",
            },
            {
              status: 409,
            },
          );

        case "ATHLETE_ACCOUNT_LIMIT_REACHED":
          return NextResponse.json(
            {
              error:
                "\u00cbsht\u00eb arritur kufiri maksimal i llogarive t\u00eb sportist\u00ebve.",

              reason: "LIMIT_REACHED",

              maxAthleteAccounts: portalAccess.maxAthleteAccounts,
            },
            {
              status: 409,
            },
          );
      }
    }

    throw error;
  }
}
