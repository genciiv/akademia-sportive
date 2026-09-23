import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { hashInvitationToken } from "./invitation-token";
import { prisma } from "./prisma";

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function getSignupCredentials(body: unknown) {
  const data =
    body && typeof body === "object" ? (body as Record<string, unknown>) : {};

  const email =
    typeof data.email === "string" ? normalizeEmail(data.email) : "";

  const invitationToken =
    typeof data.invitationToken === "string" ? data.invitationToken.trim() : "";

  return {
    email,
    invitationToken,
  };
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),

  emailAndPassword: {
    enabled: true,
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const { email, invitationToken } = getSignupCredentials(ctx.body);

      if (
        !email ||
        invitationToken.length < 16 ||
        invitationToken.length > 512
      ) {
        throw new APIError("FORBIDDEN", {
          message:
            "Regjistrimi lejohet vet\u00ebm me nj\u00eb ftes\u00eb t\u00eb vlefshme.",
        });
      }

      const now = new Date();

      const onboardingTokenHash = hashInvitationToken(invitationToken);

      const [ownerInvitation, staffInvitation, athleteInvitation] =
        await Promise.all([
          prisma.academyApplication.findUnique({
            where: {
              onboardingTokenHash,
            },

            select: {
              email: true,
              status: true,
              consumedAt: true,
              onboardingExpiresAt: true,
            },
          }),

          prisma.academyInvitation.findUnique({
            where: {
              token: invitationToken,
            },

            select: {
              email: true,
              expiresAt: true,
              acceptedAt: true,
              revokedAt: true,
            },
          }),

          prisma.athleteInvitation.findUnique({
            where: {
              token: onboardingTokenHash,
            },

            select: {
              email: true,
              expiresAt: true,
              acceptedAt: true,
              revokedAt: true,
            },
          }),
        ]);

      const ownerAllowed =
        ownerInvitation?.status === "APPROVED" &&
        ownerInvitation.consumedAt === null &&
        ownerInvitation.onboardingExpiresAt !== null &&
        ownerInvitation.onboardingExpiresAt > now &&
        normalizeEmail(ownerInvitation.email) === email;

      const staffAllowed =
        staffInvitation !== null &&
        staffInvitation.acceptedAt === null &&
        staffInvitation.revokedAt === null &&
        staffInvitation.expiresAt > now &&
        normalizeEmail(staffInvitation.email) === email;

      const athleteAllowed =
        athleteInvitation !== null &&
        athleteInvitation.acceptedAt === null &&
        athleteInvitation.revokedAt === null &&
        athleteInvitation.expiresAt > now &&
        normalizeEmail(athleteInvitation.email) === email;

      if (!ownerAllowed && !staffAllowed && !athleteAllowed) {
        throw new APIError("FORBIDDEN", {
          message:
            "Regjistrimi lejohet vet\u00ebm me nj\u00eb ftes\u00eb t\u00eb vlefshme.",
        });
      }
    }),

    after: createAuthMiddleware(async (ctx) => {
      if (ctx.path !== "/sign-up/email") {
        return;
      }

      const newSession = ctx.context.newSession;

      if (!newSession) {
        return;
      }

      const { invitationToken } = getSignupCredentials(ctx.body);

      if (invitationToken.length < 16 || invitationToken.length > 512) {
        return;
      }

      const onboardingTokenHash = hashInvitationToken(invitationToken);

      const ownerInvitation = await prisma.academyApplication.findUnique({
        where: {
          onboardingTokenHash,
        },

        select: {
          id: true,
          email: true,
          status: true,
          consumedAt: true,
          onboardingExpiresAt: true,
        },
      });

      if (
        ownerInvitation?.status !== "APPROVED" ||
        ownerInvitation.consumedAt !== null ||
        ownerInvitation.onboardingExpiresAt === null ||
        ownerInvitation.onboardingExpiresAt <= new Date() ||
        normalizeEmail(ownerInvitation.email) !==
          normalizeEmail(newSession.user.email)
      ) {
        return;
      }

      await prisma.academyApplication.updateMany({
        where: {
          id: ownerInvitation.id,

          onboardingTokenHash,
        },

        data: {
          onboardingTokenHash: null,

          onboardingExpiresAt: null,
        },
      });
    }),
  },
});
