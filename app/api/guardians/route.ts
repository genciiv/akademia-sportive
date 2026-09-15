import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.GUARDIANS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const academyId =
    access.academyId;

  const teamScope =
    await getActiveTeamScope(access);

  const [guardians, players] =
    await Promise.all([
      prisma.guardian.findMany({
        where: {
          academyId,
                  ...(teamScope.isScoped
            ? {
                players: {
                  some: {
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
                  },
                },
              }
            : {}),
        },
        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
        include: {
          players: {
                        where: {
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
      }),

      prisma.player.findMany({
        where: {
          academyId,
                  ...(teamScope.isScoped
            ? {
                teams: {
                  some: {
                    isActive: true,
                    teamId: {
                      in: teamScope.teamIds,
                    },
                  },
                },
              }
            : {}),
        },
        orderBy: [
          {
            lastName: "asc",
          },
          {
            firstName: "asc",
          },
        ],
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      }),
    ]);

  return NextResponse.json({
    guardians,
    players,
    summary: {
      guardians:
        guardians.length,
      linkedPlayers:
        new Set(
          guardians.flatMap(
            (guardian) =>
              guardian.players.map(
                (link) =>
                  link.playerId
              )
          )
        ).size,
    },
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.GUARDIANS_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  const academyId =
    access.academyId;

  const body =
    await request.json();

  const firstName =
    String(
      body.firstName ?? ""
    ).trim();

  const lastName =
    String(
      body.lastName ?? ""
    ).trim();

  if (!firstName) {
    return NextResponse.json(
      {
        error: "Emri është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (!lastName) {
    return NextResponse.json(
      {
        error: "Mbiemri është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const phone =
    String(
      body.phone ?? ""
    ).trim() || null;

  const email =
    String(
      body.email ?? ""
    ).trim() || null;

  const address =
    String(
      body.address ?? ""
    ).trim() || null;

  const notes =
    String(
      body.notes ?? ""
    ).trim() || null;

  const links =
    Array.isArray(body.players)
      ? body.players
      : [];

  const cleanedLinks =
    links
      .map(
        (
          item: {
            playerId?: unknown;
            relationship?: unknown;
            isPrimary?: unknown;
          }
        ) => ({
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
        })
      )
      .filter(
        (item: {
          playerId: string;
        }) =>
          Boolean(
            item.playerId
          )
      );

  const uniquePlayerIds: string[] =
    Array.from(
      new Set<string>(
        cleanedLinks.map(
          (item: {
            playerId: string;
          }) =>
            item.playerId
        )
      )
    );

  if (
    uniquePlayerIds.length !==
    cleanedLinks.length
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

  const guardian =
    await prisma.$transaction(
      async (tx) => {
        const created =
          await tx.guardian.create({
            data: {
              academyId,
              firstName,
              lastName,
              phone,
              email,
              address,
              notes,
            },
          });

        if (
          cleanedLinks.length >
          0
        ) {
          await tx.playerGuardian.createMany({
            data:
              cleanedLinks.map(
                (item: {
                  playerId: string;
                  relationship: string | null;
                  isPrimary: boolean;
                }) => ({
                  academyId,
                  guardianId:
                    created.id,
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

        return tx.guardian.findUnique({
          where: {
            id: created.id,
          },
          include: {
            players: {
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

  return NextResponse.json(
    {
      guardian,
    },
    {
      status: 201,
    }
  );
}
