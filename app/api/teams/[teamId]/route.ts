import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const SPORTET = [
  "FOOTBALL",
  "BASKETBALL",
  "VOLLEYBALL",
  "TENNIS",
  "SWIMMING",
  "HANDBALL",
  "MARTIAL_ARTS",
  "ATHLETICS",
  "OTHER",
] as const;

const STATUSET = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
] as const;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const teamId =
    (await params).teamId;

  const existingTeam =
    await prisma.team.findFirst({
      where: {
        id: teamId,
        academyId:
          access.academyId,
      },
      select: {
        id: true,
      },
    });

  if (!existingTeam) {
    return NextResponse.json(
      {
        error:
          "Ekipi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const hasTeamAccess =
    await canAccessTeam(
      access,
      existingTeam.id
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ekip.",
      },
      {
        status: 403,
      }
    );
  }

  const team =
    await prisma.team.findUnique({
      where: {
        id: existingTeam.id,
      },

      select: {
        id: true,
        name: true,
        sport: true,
        ageGroup: true,
        description: true,
        status: true,

        branch: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },

        players: {
          where: {
            isActive: true,
          },

          select: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                position: true,
                jerseyNumber: true,
                status: true,
              },
            },
          },
        },

        coaches: {
          where: {
            isActive: true,
          },

          select: {
            isHeadCoach: true,

            coach: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialization: true,
                status: true,
              },
            },
          },
        },

        _count: {
          select: {
            matches: true,
            trainingSessions: true,
          },
        },
      },
    });

  if (!team) {
    return NextResponse.json(
      {
        error:
          "Ekipi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const [nextMatch, nextTrainingSession] =
    await Promise.all([
      prisma.match.findFirst({
        where: {
          academyId:
            access.academyId,
          teamId: team.id,
          status: "SCHEDULED",
          startsAt: {
            gte: new Date(),
          },
        },

        orderBy: {
          startsAt: "asc",
        },

        select: {
          id: true,
          opponentName: true,
          startsAt: true,
          isHome: true,
          matchType: true,
          competitionName: true,
          location: true,

          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.trainingSession.findFirst({
        where: {
          academyId:
            access.academyId,
          teamId: team.id,
          status: "SCHEDULED",
          startsAt: {
            gte: new Date(),
          },
        },

        orderBy: {
          startsAt: "asc",
        },

        select: {
          id: true,
          title: true,
          startsAt: true,
          location: true,

          facility: {
            select: {
              id: true,
              name: true,
            },
          },

          coach: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
    ]);

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
      sport: team.sport,
      ageGroup: team.ageGroup,
      description:
        team.description,
      status: team.status,
      branch: team.branch,
      nextMatch,
      nextTrainingSession,

      stats: {
        players:
          team.players.length,
        coaches:
          team.coaches.length,
        matches:
          team._count.matches,
        trainingSessions:
          team._count.trainingSessions,
      },

      players:
        team.players.map(
          ({ player }) =>
            player
        ),

      coaches:
        team.coaches.map(
          ({
            coach,
            isHeadCoach,
          }) => ({
            ...coach,
            isHeadCoach,
          })
        ),
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await prisma.team.findFirst({
    where: {
      id: (await params).teamId,
      academyId: academyId,
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }
  const hasTeamAccess =
    await canAccessTeam(
      access,
      team.id
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje pÃ«r tÃ« aksesuar kÃ«tÃ« ekip.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await request.json();

  const name = String(body.name || "").trim();
  const sport = String(body.sport || "").trim();
  const status = String(body.status || "ACTIVE").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Emri i ekipit Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  if (!SPORTET.includes(sport as (typeof SPORTET)[number])) {
    return NextResponse.json(
      { error: "Sporti i zgjedhur nuk Ã«shtÃ« i vlefshÃ«m." },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      { error: "Statusi i zgjedhur nuk Ã«shtÃ« i vlefshÃ«m." },
      { status: 400 }
    );
  }

  if (body.branchId) {
    const branch = await prisma.academyBranch.findFirst({
      where: {
        id: String(body.branchId),
        academyId: academyId,
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Dega e zgjedhur nuk Ã«shtÃ« e vlefshme." },
        { status: 400 }
      );
    }
  }

  const duplicate = await prisma.team.findFirst({
    where: {
      academyId: academyId,
      name,
      id: {
        not: team.id,
      },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Ekziston tashmÃ« njÃ« ekip me kÃ«tÃ« emÃ«r." },
      { status: 409 }
    );
  }

  const updatedTeam = await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      name,
      sport: sport as (typeof SPORTET)[number],
      branchId: body.branchId || null,
      ageGroup: String(body.ageGroup || "").trim() || null,
      description: String(body.description || "").trim() || null,
      status: status as (typeof STATUSET)[number],
    },
  });

  return NextResponse.json({
    team: updatedTeam,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_DELETE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await prisma.team.findFirst({
    where: {
      id: (await params).teamId,
      academyId: academyId,
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }
  const hasTeamAccess =
    await canAccessTeam(
      access,
      team.id
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje pÃ«r tÃ« aksesuar kÃ«tÃ« ekip.",
      },
      {
        status: 403,
      }
    );
  }

  await prisma.team.delete({
    where: {
      id: team.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
