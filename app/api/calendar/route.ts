import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const LLOJET = [
  "MEETING",
  "MEDICAL",
  "TRIAL",
  "TOURNAMENT",
  "ADMINISTRATIVE",
  "OTHER",
] as const;

function tekstOseNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

function dateELejuar(value: unknown) {
  if (!value) {
    return null;
  }

  const date = new Date(String(value));

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
}

export async function GET(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.CALENDAR_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const activeSeason = await prisma.academySeason.findFirst({
    where: {
      academyId,
      isActive: true,
    },
  });

  const teamScope =
    await getActiveTeamScope(access);

  const { searchParams } = new URL(request.url);

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");
  const teamId = searchParams.get("teamId");

  const from = fromRaw
    ? dateELejuar(fromRaw)
    : null;

  const to = toRaw
    ? dateELejuar(toRaw)
    : null;

  if (fromRaw && !from) {
    return NextResponse.json(
      {
        error: "Data e fillimit nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (toRaw && !to) {
    return NextResponse.json(
      {
        error: "Data e përfundimit nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    teamId &&
    teamId !== "all"
  ) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        academyId,
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: "Ekipi nuk u gjet.",
        },
        {
          status: 404,
        }
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
            "Nuk ke leje për të aksesuar këtë ekip.",
        },
        { status: 403 }
      );
    }
  }

  const seasonFrom = activeSeason?.startsAt ?? null;
  const seasonTo = activeSeason?.endsAt ?? null;

  const effectiveFrom =
    seasonFrom && from
      ? new Date(
          Math.max(
            seasonFrom.getTime(),
            from.getTime()
          )
        )
      : seasonFrom || from;

  const effectiveTo =
    seasonTo && to
      ? new Date(
          Math.min(
            seasonTo.getTime(),
            to.getTime()
          )
        )
      : seasonTo || to;

  const dateFilter =
    effectiveFrom || effectiveTo
      ? {
          ...(effectiveFrom
            ? {
                gte: effectiveFrom,
              }
            : {}),
          ...(effectiveTo
            ? {
                lte: effectiveTo,
              }
            : {}),
        }
      : undefined;

  const [
    teams,
    trainingSessions,
    matches,
    manualEvents,
  ] = await Promise.all([
    prisma.team.findMany({
      where: {
        academyId,
        ...(teamScope.isScoped
          ? {
              id: {
                in: teamScope.teamIds,
              },
            }
          : {}),
        status: "ACTIVE",
        ...(activeSeason
          ? {
              season: activeSeason.name,
            }
          : {}),
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
        sport: true,
      },
    }),

    prisma.trainingSession.findMany({
      where: {
        academyId,

        ...(teamId && teamId !== "all"
          ? {
              teamId,
            }
          : teamScope.isScoped
            ? {
                teamId: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

        ...(dateFilter
          ? {
              startsAt: dateFilter,
            }
          : {}),
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        location: true,
        description: true,
        notes: true,
        status: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            isIndoor: true,
          },
        },
        team: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
      },
    }),

    prisma.match.findMany({
      where: {
        academyId,

        ...(teamId && teamId !== "all"
          ? {
              teamId,
            }
          : teamScope.isScoped
            ? {
                teamId: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

        ...(dateFilter
          ? {
              startsAt: dateFilter,
            }
          : {}),
      },
      orderBy: {
        startsAt: "asc",
      },
      select: {
        id: true,
        opponentName: true,
        matchType: true,
        status: true,
        startsAt: true,
        endsAt: true,
        location: true,
        facility: {
          select: {
            id: true,
            name: true,
            type: true,
            status: true,
            isIndoor: true,
          },
        },
        isHome: true,
        ourScore: true,
        opponentScore: true,
        competitionName: true,
        round: true,
        description: true,
        notes: true,
        team: {
          select: {
            id: true,
            name: true,
            sport: true,
          },
        },
      },
    }),

    prisma.calendarEvent.findMany({
      where: {
        academyId,

        ...(teamId && teamId !== "all"
          ? {
              teamId,
            }
          : teamScope.isScoped
            ? {
                OR: [
                  {
                    teamId: null,
                  },
                  {
                    teamId: {
                      in: teamScope.teamIds,
                    },
                  },
                ],
              }
            : {}),

        ...(dateFilter
          ? {
              startsAt: dateFilter,
            }
          : {}),
      },
      orderBy: {
        startsAt: "asc",
      },
    }),
  ]);

  const events = [
    ...trainingSessions.map((session) => ({
      id: `training-${session.id}`,
      sourceId: session.id,
      source: "TRAINING" as const,
      type: "TRAINING",
      title: session.title,
      startsAt: session.startsAt,
      endsAt: session.endsAt,
      location: session.location,
      description: session.description,
      notes: session.notes,
      status: session.status,
      team: session.team,
      facility: session.facility,
    })),

    ...matches.map((match) => ({
      id: `match-${match.id}`,
      sourceId: match.id,
      source: "MATCH" as const,
      type: "MATCH",
      title: `${match.team.name} - ${match.opponentName}`,
      startsAt: match.startsAt,
      endsAt: match.endsAt,
      location: match.location,
      facility: match.facility,
      description: match.description,
      notes: match.notes,
      status: match.status,
      team: match.team,
      opponentName: match.opponentName,
      matchType: match.matchType,
      isHome: match.isHome,
      ourScore: match.ourScore,
      opponentScore: match.opponentScore,
      competitionName: match.competitionName,
      round: match.round,
    })),

    ...manualEvents.map((event) => ({
      id: `calendar-${event.id}`,
      sourceId: event.id,
      source: "CALENDAR" as const,
      type: event.type,
      title: event.title,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      location: event.location,
      description: event.description,
      notes: event.notes,
      status: null,
      facility: null,
      team: event.teamId
        ? teams.find(
            (team) =>
              team.id === event.teamId
          ) ?? null
        : null,
    })),
  ].sort(
    (a, b) =>
      new Date(a.startsAt).getTime() -
      new Date(b.startsAt).getTime()
  );

  return NextResponse.json({
    filters: {
      from: fromRaw,
      to: toRaw,
      teamId:
        teamId && teamId !== "all"
          ? teamId
          : null,
    },

    teams,

    summary: {
      total: events.length,
      trainings:
        trainingSessions.length,
      matches: matches.length,
      activities:
        manualEvents.length,
    },

    events,
  });
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.CALENDAR_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const body = await request.json();

  const title =
    String(body.title ?? "").trim();

  if (!title) {
    return NextResponse.json(
      {
        error: "Titulli është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const type =
    String(body.type ?? "OTHER");

  if (
    !LLOJET.includes(
      type as (typeof LLOJET)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Lloji i aktivitetit nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const startsAt =
    dateELejuar(body.startsAt);

  if (!startsAt) {
    return NextResponse.json(
      {
        error: "Data dhe ora e fillimit janë të detyrueshme.",
      },
      {
        status: 400,
      }
    );
  }

  let endsAt: Date | null = null;

  if (body.endsAt) {
    endsAt =
      dateELejuar(body.endsAt);

    if (!endsAt) {
      return NextResponse.json(
        {
          error: "Data e përfundimit nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      endsAt.getTime() <
      startsAt.getTime()
    ) {
      return NextResponse.json(
        {
          error: "Përfundimi nuk mund të jetë para fillimit.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const teamScope =
    await getActiveTeamScope(access);

  let teamId: string | null = null;

  if (
    teamScope.isScoped &&
    !body.teamId
  ) {
    return NextResponse.json(
      {
        error:
          "Duhet të zgjedhësh një ekip për këtë aktivitet.",
      },
      { status: 403 }
    );
  }

  if (body.teamId) {
    const team =
      await prisma.team.findFirst({
        where: {
          id: String(body.teamId),
          academyId:
            academyId,
        },
        select: {
          id: true,
        },
      });

    if (!team) {
      return NextResponse.json(
        {
          error: "Ekipi nuk u gjet.",
        },
        {
          status: 404,
        }
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
            "Nuk ke leje për të aksesuar këtë ekip.",
        },
        { status: 403 }
      );
    }

    teamId = team.id;
  }

  const event =
    await prisma.calendarEvent.create({
      data: {
        academyId:
          academyId,

        title,

        type:
          type as
            | "MEETING"
            | "MEDICAL"
            | "TRIAL"
            | "TOURNAMENT"
            | "ADMINISTRATIVE"
            | "OTHER",

        startsAt,
        endsAt,
        location:
          tekstOseNull(body.location),
        description:
          tekstOseNull(
            body.description
          ),
        notes:
          tekstOseNull(body.notes),
        teamId,
      },
    });

  return NextResponse.json(
    {
      event,
    },
    {
      status: 201,
    }
  );
}
