import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function merrAkademineAktive() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return prisma.academyMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    select: {
      academyId: true,
    },
  });
}

type PlayerLinkInput = {
  playerId?: unknown;
  relationship?: unknown;
  isPrimary?: unknown;
};

function pastroLidhjet(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item: PlayerLinkInput) => ({
      playerId:
        String(
          item.playerId ?? ""
        ).trim(),

      relationship:
        String(
          item.relationship ?? ""
        ).trim() || null,

      isPrimary:
        Boolean(
          item.isPrimary
        ),
    }))
    .filter(
      (item) =>
        Boolean(
          item.playerId
        )
    );
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      guardianId: string;
    };
  }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const academyId =
    membership.academyId;

  const guardian =
    await prisma.guardian.findFirst({
      where: {
        id: params.guardianId,
        academyId,
      },
      select: {
        id: true,
      },
    });

  if (!guardian) {
    return NextResponse.json(
      {
        error: "Kujdestari nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body =
    await request.json();

  const firstName =
    body.firstName !== undefined
      ? String(
          body.firstName
        ).trim()
      : undefined;

  const lastName =
    body.lastName !== undefined
      ? String(
          body.lastName
        ).trim()
      : undefined;

  if (
    firstName !== undefined &&
    !firstName
  ) {
    return NextResponse.json(
      {
        error: "Emri është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    lastName !== undefined &&
    !lastName
  ) {
    return NextResponse.json(
      {
        error: "Mbiemri është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const links =
    body.players !== undefined
      ? pastroLidhjet(
          body.players
        )
      : null;

  if (links) {
    const uniquePlayerIds: string[] =
      Array.from(
        new Set<string>(
          links.map(
            (item) =>
              item.playerId
          )
        )
      );

    if (
      uniquePlayerIds.length !==
      links.length
    ) {
      return NextResponse.json(
        {
          error: "I njëjti sportist është zgjedhur më shumë se një herë.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      uniquePlayerIds.length > 0
    ) {
      const validPlayers =
        await prisma.player.count({
          where: {
            academyId,
            id: {
              in: uniquePlayerIds,
            },
          },
        });

      if (
        validPlayers !==
        uniquePlayerIds.length
      ) {
        return NextResponse.json(
          {
            error: "Një ose më shumë sportistë nuk janë të vlefshëm.",
          },
          {
            status: 400,
          }
        );
      }
    }
  }

  const updated =
    await prisma.$transaction(
      async (tx) => {
        await tx.guardian.update({
          where: {
            id: guardian.id,
          },
          data: {
            ...(firstName !== undefined
              ? {
                  firstName,
                }
              : {}),

            ...(lastName !== undefined
              ? {
                  lastName,
                }
              : {}),

            ...(body.phone !== undefined
              ? {
                  phone:
                    String(
                      body.phone ?? ""
                    ).trim() ||
                    null,
                }
              : {}),

            ...(body.email !== undefined
              ? {
                  email:
                    String(
                      body.email ?? ""
                    ).trim() ||
                    null,
                }
              : {}),

            ...(body.address !== undefined
              ? {
                  address:
                    String(
                      body.address ?? ""
                    ).trim() ||
                    null,
                }
              : {}),

            ...(body.notes !== undefined
              ? {
                  notes:
                    String(
                      body.notes ?? ""
                    ).trim() ||
                    null,
                }
              : {}),
          },
        });

        if (links) {
          await tx.playerGuardian.deleteMany({
            where: {
              academyId,
              guardianId:
                guardian.id,
            },
          });

          if (
            links.length > 0
          ) {
            await tx.playerGuardian.createMany({
              data:
                links.map(
                  (item) => ({
                    academyId,
                    guardianId:
                      guardian.id,
                    playerId:
                      item.playerId,
                    relationship:
                      item.relationship,
                    isPrimary:
                      item.isPrimary,
                  })
                ),
            });
          }
        }

        return tx.guardian.findUnique({
          where: {
            id: guardian.id,
          },
          include: {
            players: {
              orderBy: {
                createdAt: "asc",
              },
              include: {
                player: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    status: true,
                  },
                },
              },
            },
          },
        });
      }
    );

  return NextResponse.json({
    guardian: updated,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: {
      guardianId: string;
    };
  }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const academyId =
    membership.academyId;

  const guardian =
    await prisma.guardian.findFirst({
      where: {
        id: params.guardianId,
        academyId,
      },
      select: {
        id: true,
      },
    });

  if (!guardian) {
    return NextResponse.json(
      {
        error: "Kujdestari nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.guardian.delete({
    where: {
      id: guardian.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}