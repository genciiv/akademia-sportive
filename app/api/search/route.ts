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

export async function GET(
  request: Request
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
    prisma.player.findMany({
      where: {
        academyId,
        ...(activeSeason
          ? {
              teams: {
                some: {
                  isActive: true,
                  team: {
                    academyId,
                    season: activeSeason.name,
                    status: "ACTIVE",
                  },
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
    }),

    prisma.coach.findMany({
      where: {
        academyId,
        ...(activeSeason
          ? {
              teams: {
                some: {
                  isActive: true,
                  team: {
                    academyId,
                    season: activeSeason.name,
                    status: "ACTIVE",
                  },
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
    }),

    prisma.team.findMany({
      where: {
        academyId,
        status: "ACTIVE",
        ...(activeSeason
          ? {
              season: activeSeason.name,
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
    }),
  ]);

  const results = [
    ...players.map((player) => ({
      id: player.id,
      type: "PLAYER",
      title: `${player.firstName} ${player.lastName}`,
      subtitle: "Sportist",
      href: "/anetaret",
    })),

    ...coaches.map((coach) => ({
      id: coach.id,
      type: "COACH",
      title: `${coach.firstName} ${coach.lastName}`,
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