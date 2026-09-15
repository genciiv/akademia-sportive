import { NextResponse } from "next/server";

import {
  getCurrentAcademyAccess,
} from "@/lib/academy-permissions";
import {
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request
) {
  const access =
    await getCurrentAcademyAccess();

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const teamScope =
    await getActiveTeamScope(access);

  const canViewPlayers =
    access.permissions.includes(
      PERMISSIONS.PLAYERS_VIEW
    );

  const canViewCoaches =
    access.permissions.includes(
      PERMISSIONS.COACHES_VIEW
    );

  const canViewTeams =
    access.permissions.includes(
      PERMISSIONS.TEAMS_VIEW
    );

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId,
        isActive: true,
      },
    });

  const { searchParams } =
    new URL(request.url);

  const query =
    searchParams
      .get("q")
      ?.trim() ?? "";

  if (query.length < 2) {
    return NextResponse.json({
      results: [],
    });
  }

  const [
    players,
    coaches,
    teams,
  ] = await Promise.all([
    canViewPlayers
      ? prisma.player.findMany({
          where: {
            academyId,

            ...(teamScope.isScoped ||
            Boolean(activeSeason)
              ? {
                  teams: {
                    some: {
                      isActive: true,

                      ...(teamScope.isScoped
                        ? {
                            teamId: {
                              in: teamScope.teamIds,
                            },
                          }
                        : {}),

                      ...(activeSeason
                        ? {
                            team: {
                              academyId,
                              season:
                                activeSeason.name,
                              status: "ACTIVE",
                            },
                          }
                        : {}),
                    },
                  },
                }
              : {}),

            OR: [
              {
                firstName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
          take: 5,
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
          },
        })
      : Promise.resolve([]),

    canViewCoaches
      ? prisma.coach.findMany({
          where: {
            academyId,

            ...(teamScope.isScoped ||
            Boolean(activeSeason)
              ? {
                  teams: {
                    some: {
                      isActive: true,

                      ...(teamScope.isScoped
                        ? {
                            teamId: {
                              in: teamScope.teamIds,
                            },
                          }
                        : {}),

                      ...(activeSeason
                        ? {
                            team: {
                              academyId,
                              season:
                                activeSeason.name,
                              status: "ACTIVE",
                            },
                          }
                        : {}),
                    },
                  },
                }
              : {}),

            OR: [
              {
                firstName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                lastName: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: query,
                  mode: "insensitive",
                },
              },
              {
                phone: {
                  contains: query,
                  mode: "insensitive",
                },
              },
            ],
          },
          take: 5,
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
          },
        })
      : Promise.resolve([]),

    canViewTeams
      ? prisma.team.findMany({
          where: {
            academyId,
            status: "ACTIVE",

            ...(teamScope.isScoped
              ? {
                  id: {
                    in: teamScope.teamIds,
                  },
                }
              : {}),

            ...(activeSeason
              ? {
                  season:
                    activeSeason.name,
                }
              : {}),

            name: {
              contains: query,
              mode: "insensitive",
            },
          },
          take: 5,
          orderBy: {
            name: "asc",
          },
          select: {
            id: true,
            name: true,
          },
        })
      : Promise.resolve([]),
  ]);

  const results = [
    ...players.map((player) => ({
      id: player.id,
      type: "PLAYER",
      title:
        `${player.firstName} ${player.lastName}`,
      subtitle: "Sportist",
      href: "/anetaret",
    })),

    ...coaches.map((coach) => ({
      id: coach.id,
      type: "COACH",
      title:
        `${coach.firstName} ${coach.lastName}`,
      subtitle: "Trajner",
      href: "/trajneret",
    })),

    ...teams.map((team) => ({
      id: team.id,
      type: "TEAM",
      title: team.name,
      subtitle: "Ekip",
      href: "/ekipet",
    })),
  ];

  return NextResponse.json({
    results,
  });
}
