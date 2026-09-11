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

function parseDate(value: string | null, endOfDay = false) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  } else {
    date.setHours(0, 0, 0, 0);
  }

  return date;
}

function perqindja(completed: number, attempted: number) {
  if (attempted <= 0) {
    return 0;
  }

  return Math.round((completed / attempted) * 100);
}

export async function GET(request: Request) {
  const membership = await merrAkademineAktive();

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

  const activeSeason = await prisma.academySeason.findFirst({
    where: {
      academyId: membership.academyId,
      isActive: true,
    },
  });

  const { searchParams } = new URL(request.url);

  const teamId = String(
    searchParams.get("teamId") || ""
  ).trim();

  const playerId = String(
    searchParams.get("playerId") || ""
  ).trim();

  const fromRaw = searchParams.get("from");
  const toRaw = searchParams.get("to");

  const from = parseDate(fromRaw);
  const to = parseDate(toRaw, true);

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

  if (from && to && from > to) {
    return NextResponse.json(
      {
        error:
          "Data e fillimit nuk mund të jetë pas datës së përfundimit.",
      },
      {
        status: 400,
      }
    );
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

  if (teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        academyId: membership.academyId,
        ...(activeSeason
          ? {
              season: activeSeason.name,
              status: "ACTIVE",
            }
          : {}),
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
  }

  if (playerId) {
    const player = await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId: membership.academyId,
        ...(activeSeason
          ? {
              teams: {
                some: {
                  isActive: true,
                  team: {
                    academyId: membership.academyId,
                    season: activeSeason.name,
                    status: "ACTIVE",
                  },
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!player) {
      return NextResponse.json(
        {
          error: "Sportisti nuk u gjet.",
        },
        {
          status: 404,
        }
      );
    }
  }

  const matchWhere = {
    academyId: membership.academyId,
    ...(teamId
      ? {
          teamId,
        }
      : {}),

    ...(effectiveFrom || effectiveTo
      ? {
          startsAt: {
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
          },
        }
      : {}),
  };

  const [
    teams,
    academyPlayers,
    matchPlayers,
    performances,
    events,
  ] = await Promise.all([
    prisma.team.findMany({
      where: {
        academyId: membership.academyId,
        status: "ACTIVE",
        ...(activeSeason
          ? {
              season: activeSeason.name,
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        sport: true,
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.player.findMany({
      where: {
        academyId: membership.academyId,

        ...(activeSeason
          ? {
              teams: {
                some: {
                  isActive: true,
                  team: {
                    academyId: membership.academyId,
                    season: activeSeason.name,
                    status: "ACTIVE",
                  },
                },
              },
            }
          : {}),

        ...(playerId
          ? {
              id: playerId,
            }
          : {}),

        ...(teamId
          ? {
              teams: {
                some: {
                  teamId,
                  isActive: true,
                },
              },
            }
          : {}),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        jerseyNumber: true,
        photo: true,
        status: true,
      },
      orderBy: [
        {
          firstName: "asc",
        },
        {
          lastName: "asc",
        },
      ],
    }),

    prisma.matchPlayer.findMany({
      where: {
        match: matchWhere,

        player: {
          academyId: membership.academyId,
        },

        ...(playerId
          ? {
              playerId,
            }
          : {}),
      },
      select: {
        id: true,
        playerId: true,
        role: true,
        minutesPlayed: true,

        match: {
          select: {
            id: true,
            opponentName: true,
            startsAt: true,
            isHome: true,
            ourScore: true,
            opponentScore: true,

            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    }),

    prisma.playerMatchPerformance.findMany({
      where: {
        match: matchWhere,

        player: {
          academyId: membership.academyId,
        },

        ...(playerId
          ? {
              playerId,
            }
          : {}),
      },
      select: {
        id: true,
        matchId: true,
        playerId: true,

        shots: true,
        shotsOnTarget: true,

        passesAttempted: true,
        passesCompleted: true,

        dribblesAttempted: true,
        dribblesCompleted: true,

        duelsWon: true,

        tackles: true,
        interceptions: true,

        foulsCommitted: true,
        foulsWon: true,

        coachRating: true,
        coachNotes: true,
      },
    }),

    prisma.matchEvent.findMany({
      where: {
        match: matchWhere,

        player: {
          academyId: membership.academyId,
        },

        type: {
          in: ["GOAL", "ASSIST"],
        },

        ...(playerId
          ? {
              playerId,
            }
          : {}),
      },
      select: {
        id: true,
        matchId: true,
        playerId: true,
        type: true,
      },
    }),
  ]);

  const performanceKey = (
    matchId: string,
    currentPlayerId: string
  ) => `${matchId}:${currentPlayerId}`;

  const performanceMap = new Map(
    performances.map((performance) => [
      performanceKey(
        performance.matchId,
        performance.playerId
      ),
      performance,
    ])
  );

  const eventStats = new Map<
    string,
    {
      goals: number;
      assists: number;
    }
  >();

  for (const event of events) {
    const key = performanceKey(
      event.matchId,
      event.playerId
    );

    const current = eventStats.get(key) || {
      goals: 0,
      assists: 0,
    };

    if (event.type === "GOAL") {
      current.goals += 1;
    }

    if (event.type === "ASSIST") {
      current.assists += 1;
    }

    eventStats.set(key, current);
  }

  const matchPlayersByPlayer = new Map<
    string,
    typeof matchPlayers
  >();

  for (const matchPlayer of matchPlayers) {
    const current =
      matchPlayersByPlayer.get(matchPlayer.playerId) || [];

    current.push(matchPlayer);

    matchPlayersByPlayer.set(
      matchPlayer.playerId,
      current
    );
  }

  const players = academyPlayers.map((player) => {
    const playerMatches =
      matchPlayersByPlayer.get(player.id) || [];

    let minutesPlayed = 0;
    let starts = 0;
    let goals = 0;
    let assists = 0;

    let shots = 0;
    let shotsOnTarget = 0;

    let passesAttempted = 0;
    let passesCompleted = 0;

    let dribblesAttempted = 0;
    let dribblesCompleted = 0;

    let duelsWon = 0;

    let tackles = 0;
    let interceptions = 0;

    let foulsCommitted = 0;
    let foulsWon = 0;

    let ratingTotal = 0;
    let ratingCount = 0;

    const history = playerMatches
      .map((matchPlayer) => {
        const performance =
          performanceMap.get(
            performanceKey(
              matchPlayer.match.id,
              player.id
            )
          );

        const currentEvents =
          eventStats.get(
            performanceKey(
              matchPlayer.match.id,
              player.id
            )
          ) || {
            goals: 0,
            assists: 0,
          };

        minutesPlayed += matchPlayer.minutesPlayed;

        if (matchPlayer.role === "STARTER") {
          starts += 1;
        }

        goals += currentEvents.goals;
        assists += currentEvents.assists;

        if (performance) {
          shots += performance.shots;
          shotsOnTarget += performance.shotsOnTarget;

          passesAttempted +=
            performance.passesAttempted;

          passesCompleted +=
            performance.passesCompleted;

          dribblesAttempted +=
            performance.dribblesAttempted;

          dribblesCompleted +=
            performance.dribblesCompleted;

          duelsWon += performance.duelsWon;

          tackles += performance.tackles;
          interceptions += performance.interceptions;

          foulsCommitted +=
            performance.foulsCommitted;

          foulsWon += performance.foulsWon;

          if (performance.coachRating !== null) {
            ratingTotal += Number(
              performance.coachRating
            );

            ratingCount += 1;
          }
        }

        return {
          matchId: matchPlayer.match.id,

          opponentName:
            matchPlayer.match.opponentName,

          startsAt:
            matchPlayer.match.startsAt,

          isHome:
            matchPlayer.match.isHome,

          team:
            matchPlayer.match.team,

          score: {
            our:
              matchPlayer.match.ourScore,

            opponent:
              matchPlayer.match.opponentScore,
          },

          role:
            matchPlayer.role,

          minutesPlayed:
            matchPlayer.minutesPlayed,

          goals:
            currentEvents.goals,

          assists:
            currentEvents.assists,

          performance: performance
            ? {
                shots:
                  performance.shots,

                shotsOnTarget:
                  performance.shotsOnTarget,

                passesAttempted:
                  performance.passesAttempted,

                passesCompleted:
                  performance.passesCompleted,

                passAccuracy:
                  perqindja(
                    performance.passesCompleted,
                    performance.passesAttempted
                  ),

                dribblesAttempted:
                  performance.dribblesAttempted,

                dribblesCompleted:
                  performance.dribblesCompleted,

                dribbleAccuracy:
                  perqindja(
                    performance.dribblesCompleted,
                    performance.dribblesAttempted
                  ),

                duelsWon:
                  performance.duelsWon,

                tackles:
                  performance.tackles,

                interceptions:
                  performance.interceptions,

                foulsCommitted:
                  performance.foulsCommitted,

                foulsWon:
                  performance.foulsWon,

                coachRating:
                  performance.coachRating === null
                    ? null
                    : Number(
                        performance.coachRating
                      ),

                coachNotes:
                  performance.coachNotes,
              }
            : null,
        };
      })
      .sort(
        (a, b) =>
          new Date(a.startsAt).getTime() -
          new Date(b.startsAt).getTime()
      );

    const averageRating =
      ratingCount > 0
        ? Number(
            (
              ratingTotal / ratingCount
            ).toFixed(2)
          )
        : null;

    return {
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        position: player.position,
        jerseyNumber: player.jerseyNumber,
        photo: player.photo,
        status: player.status,
      },

      summary: {
        matches: playerMatches.length,
        starts,
        minutesPlayed,

        goals,
        assists,

        averageRating,

        shots,
        shotsOnTarget,

        shotAccuracy:
          perqindja(
            shotsOnTarget,
            shots
          ),

        passesAttempted,
        passesCompleted,

        passAccuracy:
          perqindja(
            passesCompleted,
            passesAttempted
          ),

        dribblesAttempted,
        dribblesCompleted,

        dribbleAccuracy:
          perqindja(
            dribblesCompleted,
            dribblesAttempted
          ),

        duelsWon,

        tackles,
        interceptions,

        foulsCommitted,
        foulsWon,
      },

      history,
    };
  });

  const playersWithMatches = players.filter(
    (item) => item.summary.matches > 0
  );

  const uniqueMatchIds = new Set(
    matchPlayers.map(
      (matchPlayer) =>
        matchPlayer.match.id
    )
  );

  const totalMinutes =
    players.reduce(
      (sum, item) =>
        sum + item.summary.minutesPlayed,
      0
    );

  const totalGoals =
    players.reduce(
      (sum, item) =>
        sum + item.summary.goals,
      0
    );

  const totalAssists =
    players.reduce(
      (sum, item) =>
        sum + item.summary.assists,
      0
    );

  const ratings = players
    .map(
      (item) =>
        item.summary.averageRating
    )
    .filter(
      (rating): rating is number =>
        rating !== null
    );

  const academyAverageRating =
    ratings.length > 0
      ? Number(
          (
            ratings.reduce(
              (sum, rating) =>
                sum + rating,
              0
            ) / ratings.length
          ).toFixed(2)
        )
      : null;

  return NextResponse.json({
    filters: {
      teamId: teamId || null,
      playerId: playerId || null,
      from: fromRaw || null,
      to: toRaw || null,
    },

    teams,

    summary: {
      players:
        playersWithMatches.length,

      matches:
        uniqueMatchIds.size,

      minutesPlayed:
        totalMinutes,

      goals:
        totalGoals,

      assists:
        totalAssists,

      averageRating:
        academyAverageRating,
    },

    players,
  });
}