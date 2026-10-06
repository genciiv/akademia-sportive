import { randomBytes, randomUUID } from "node:crypto";

import { hashPassword } from "better-auth/crypto";
import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

function generateTemporaryPassword() {
  return `Ak!${randomBytes(9).toString("base64url")}9z`;
}

export async function PATCH(
  request: Request,
  context: {
    params: Promise<{
      userId: string;
    }>;
  }
) {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet të identifikoheni."
            : "Nuk keni akses.",
      },
      {
        status: access.status,
      }
    );
  }

  const { userId } =
    await context.params;

  if (!userId) {
    return NextResponse.json(
      {
        error:
          "Përdoruesi nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (userId === access.user.id) {
    return NextResponse.json(
      {
        error:
          "Nuk mund të ndryshoni aksesin e llogarisë tuaj Platform Admin.",
      },
      {
        status: 400,
      }
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Kërkesa nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const data =
    body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};

  if (typeof data.isActive !== "boolean") {
    return NextResponse.json(
      {
        error:
          "Statusi i llogarisë nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const requestedIsActive: boolean =
    data.isActive;

  const user =
    await prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        role: true,
        isActive: true,

        memberships: {
          where: {
            status: {
              not: "REMOVED",
            },
          },

          select: {
            id: true,
          },

          take: 1,
        },

        ownedAcademies: {
          select: {
            id: true,
          },

          take: 1,
        },

        athleteAccounts: {
          select: {
            id: true,
          },

          take: 1,
        },
      },
    });

  if (!user) {
    return NextResponse.json(
      {
        error:
          "Përdoruesi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const hasAcademyConnection =
    user.ownedAcademies.length > 0 ||
    user.memberships.length > 0 ||
    user.athleteAccounts.length > 0;

  if (
    requestedIsActive &&
    user.role !== "PLATFORM_ADMIN" &&
    !hasAcademyConnection
  ) {
    return NextResponse.json(
      {
        error:
          "Ky përdorues nuk është i lidhur me asnjë akademi dhe nuk mund të aktivizohet.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    user.role === "PLATFORM_ADMIN" &&
    requestedIsActive === false
  ) {
    return NextResponse.json(
      {
        error:
          "Një Platform Admin tjetër nuk mund të bllokohet nga ky veprim.",
      },
      {
        status: 400,
      }
    );
  }

  if (!requestedIsActive) {
    const updated =
      await prisma.$transaction(
        async (tx) => {
          const updatedUser =
            await tx.user.update({
              where: {
                id: userId,
              },

              data: {
                isActive: false,
              },

              select: {
                id: true,
                isActive: true,
              },
            });

          await tx.session.deleteMany({
            where: {
              userId,
            },
          });

          return updatedUser;
        }
      );

    return NextResponse.json({
      ok: true,
      user: updated,
      temporaryPassword: null,
    });
  }

  const temporaryPassword =
    generateTemporaryPassword();

  const passwordHash =
    await hashPassword(
      temporaryPassword
    );

  const updated =
    await prisma.$transaction(
      async (tx) => {
        const credential =
          await tx.account.findFirst({
            where: {
              userId,
              providerId:
                "credential",
            },

            select: {
              id: true,
            },
          });

        if (credential) {
          await tx.account.update({
            where: {
              id: credential.id,
            },

            data: {
              password:
                passwordHash,
            },
          });
        } else {
          await tx.account.create({
            data: {
              id: randomUUID(),
              issuer:
                "local:credential",
              accountId: userId,
              providerId:
                "credential",
              userId,
              password:
                passwordHash,
            },
          });
        }

        await tx.session.deleteMany({
          where: {
            userId,
          },
        });

        return tx.user.update({
          where: {
            id: userId,
          },

          data: {
            isActive: true,
            mustChangePassword:
              true,
          },

          select: {
            id: true,
            isActive: true,
            mustChangePassword:
              true,
          },
        });
      }
    );

  return NextResponse.json({
    ok: true,
    user: updated,
    temporaryPassword,
  });
}