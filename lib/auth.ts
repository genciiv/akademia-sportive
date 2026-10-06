import { betterAuth } from "better-auth";
import { APIError, createAuthMiddleware } from "better-auth/api";
import { prismaAdapter } from "better-auth/adapters/prisma";

import { sendTransactionalEmail } from "./email";
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

  user: {
    deleteUser: {
      enabled: true,

      beforeDelete: async (user) => {
        const target =
          await prisma.user.findUnique({
            where: {
              id: user.id,
            },

            select: {
              role: true,

              _count: {
                select: {
                  ownedAcademies: true,
                },
              },
            },
          });

        if (!target) {
          throw new APIError("NOT_FOUND", {
            message:
              "Përdoruesi nuk u gjet.",
          });
        }

        if (
          target.role ===
          "PLATFORM_ADMIN"
        ) {
          throw new APIError("FORBIDDEN", {
            message:
              "Llogaria Platform Admin nuk mund të fshihet.",
          });
        }

        if (
          target._count
            .ownedAcademies > 0
        ) {
          throw new APIError("BAD_REQUEST", {
            message:
              "Nuk mund ta fshini llogarinë ndërsa jeni pronar i një akademie. Transferoni ose mbyllni akademinë fillimisht.",
          });
        }
      },
    },
  },

  emailAndPassword: {
    enabled: true,

    revokeSessionsOnPasswordReset: true,

    sendResetPassword: async ({
      user,
      url,
    }) => {
      const delivery =
        await sendTransactionalEmail({
          to: {
            email: user.email,
            name: user.name,
          },

          subject:
            "Rivendos fjalëkalimin - AkademiaSportive",

          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#0f172a">
              <h2>Rivendos fjalëkalimin</h2>

              <p>
                Kemi marrë një kërkesë për ndryshimin e fjalëkalimit
                të llogarisë tënde në AkademiaSportive.
              </p>

              <p style="margin:28px 0">
                <a
                  href="${url}"
                  style="display:inline-block;background:#7c3aed;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700"
                >
                  Ndrysho fjalëkalimin
                </a>
              </p>

              <p style="font-size:13px;color:#64748b">
                Nëse nuk e ke kërkuar këtë ndryshim, mund ta injorosh këtë email.
              </p>
            </div>
          `,

          textContent:
            `Përdor këtë link për të rivendosur fjalëkalimin: ${url}`,
        });

      if (!delivery.ok) {
        console.error(
          "Dërgimi i email-it për reset password dështoi.",
          delivery
        );
      }
    },

    onPasswordReset: async ({
      user,
    }) => {
      await prisma.user.update({
        where: {
          id: user.id,
        },

        data: {
          mustChangePassword: false,
        },
      });
    },
  },

  hooks: {
    before: createAuthMiddleware(async (ctx) => {
      if (ctx.path === "/sign-in/email") {
        const data =
          ctx.body && typeof ctx.body === "object"
            ? (ctx.body as Record<string, unknown>)
            : {};

        const email =
          typeof data.email === "string"
            ? normalizeEmail(data.email)
            : "";

        if (email) {
          const user = await prisma.user.findUnique({
            where: {
              email,
            },

            select: {
              isActive: true,
            },
          });

          if (user && !user.isActive) {
            throw new APIError("FORBIDDEN", {
              message:
                "Kjo llogari është çaktivizuar. Kontakto administratorin e platformës.",
            });
          }
        }

        return;
      }

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
