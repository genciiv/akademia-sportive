import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date | null) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function attendanceLabel(status: string) {
  switch (status) {
    case "PRESENT":
      return "Prezent";
    case "ABSENT":
      return "Mungesë";
    case "LATE":
      return "Me vonesë";
    case "EXCUSED":
      return "E justifikuar";
    default:
      return status;
  }
}

export default async function AthleteDashboardPage() {
  const access = await requireAthleteAccess();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje?next=/sportist/dashboard");
    }

    redirect("/");
  }

  const player = await prisma.player.findFirst({
    where: {
      id: access.playerId,
      academyId: access.academyId,
    },

    select: {
      id: true,
      firstName: true,
      lastName: true,
      dateOfBirth: true,
      position: true,
      jerseyNumber: true,
      photo: true,
      status: true,

      teams: {
        where: {
          isActive: true,
        },

        select: {
          joinedAt: true,

          team: {
            select: {
              id: true,
              name: true,
              sport: true,
              ageGroup: true,
              status: true,
            },
          },
        },

        orderBy: {
          joinedAt: "asc",
        },
      },

      physicalMeasurements: {
        orderBy: {
          measuredAt: "desc",
        },

        take: 8,

        select: {
          measuredAt: true,
          heightCm: true,
          weightKg: true,
          bodyFatPercent: true,
          muscleMassKg: true,
        },
      },
    },
  });

  if (!player) {
    redirect("/");
  }

  const athleteName = `${player.firstName} ${player.lastName}`.trim();

  const latestMeasurement = player.physicalMeasurements[0] ?? null;

  const physicalProgress =
    [...player.physicalMeasurements].reverse();

  const activeTeams = player.teams.filter(
    ({ team }) => team.status === "ACTIVE",
  );

  const activeTeamIds = activeTeams.map(({ team }) => team.id);

  const primaryTeam =
    activeTeams[0]?.team ?? null;

  const athleteInitials =
    `${player.firstName.charAt(0)}${player.lastName.charAt(0)}`
      .toUpperCase();

  const now = new Date();

  const [upcomingSessions, upcomingMatches, recentAttendances] =
    await Promise.all([
      prisma.trainingSession.findMany({
        where: {
          academyId: access.academyId,
          teamId: {
            in: activeTeamIds,
          },
          startsAt: {
            gte: now,
          },
          status: "SCHEDULED",
        },

        orderBy: {
          startsAt: "asc",
        },

        take: 3,

        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          location: true,

          team: {
            select: {
              id: true,
              name: true,
            },
          },

          facility: {
            select: {
              id: true,
              name: true,
            },
          },

          branch: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.match.findMany({
        where: {
          academyId: access.academyId,
          teamId: {
            in: activeTeamIds,
          },
          startsAt: {
            gte: now,
          },
          status: "SCHEDULED",
        },

        orderBy: {
          startsAt: "asc",
        },

        take: 3,

        select: {
          id: true,
          opponentName: true,
          startsAt: true,
          location: true,
          isHome: true,
          competitionName: true,

          team: {
            select: {
              id: true,
              name: true,
            },
          },

          facility: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),

      prisma.trainingAttendance.findMany({
        where: {
          playerId: access.playerId,

          trainingSession: {
            academyId: access.academyId,
            teamId: {
              in: activeTeamIds,
            },
          },
        },

        orderBy: {
          trainingSession: {
            startsAt: "desc",
          },
        },

        take: 5,

        select: {
          id: true,
          status: true,

          trainingSession: {
            select: {
              id: true,
              title: true,
              startsAt: true,

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
    ]);

  const academyUpdates =
    await prisma.notification.findMany({
      where: {
        academyId: access.academyId,
        status: "ACTIVE",

        AND: [
          {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gte: now,
                },
              },
            ],
          },
          {
            OR: [
              {
                audience: "ALL",
              },
              {
                audience: "TEAM",
                teamId: {
                  in: activeTeamIds,
                },
              },
            ],
          },
        ],
      },

      orderBy: {
        publishedAt: "desc",
      },

      take: 5,

      select: {
        id: true,
        title: true,
        message: true,
        href: true,
        audience: true,
        priority: true,
        publishedAt: true,
        expiresAt: true,

        team: {
          select: {
            id: true,
            name: true,
          },
        },

        notificationReads: {
          where: {
            userId: access.userId,
          },

          select: {
            id: true,
          },
        },
      },
    });

  const [
    completedMatchPlayers,
    athleteEvents,
    athletePerformances,
  ] = await Promise.all([
    prisma.matchPlayer.findMany({
      where: {
        playerId: access.playerId,

        match: {
          academyId: access.academyId,

          teamId: {
            in: activeTeamIds,
          },

          status: "COMPLETED",
        },
      },

      select: {
        matchId: true,
        role: true,
        minutesPlayed: true,
      },
    }),

    prisma.matchEvent.findMany({
      where: {
        playerId: access.playerId,

        match: {
          academyId: access.academyId,

          teamId: {
            in: activeTeamIds,
          },

          status: "COMPLETED",
        },
      },

      select: {
        matchId: true,
        type: true,
      },
    }),

    prisma.playerMatchPerformance.findMany({
      where: {
        playerId: access.playerId,

        match: {
          academyId: access.academyId,

          teamId: {
            in: activeTeamIds,
          },

          status: "COMPLETED",
        },
      },

      select: {
        matchId: true,
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

        match: {
          select: {
            startsAt: true,
            opponentName: true,
          },
        },
      },
    }),
  ]);

  const appearanceMatchIds =
    new Set(
      completedMatchPlayers
        .filter(
          (matchPlayer) =>
            matchPlayer.role === "STARTER" ||
            matchPlayer.minutesPlayed > 0,
        )
        .map(
          (matchPlayer) =>
            matchPlayer.matchId,
        ),
    );

  const starts =
    completedMatchPlayers.filter(
      (matchPlayer) =>
        matchPlayer.role === "STARTER",
    ).length;

  const totalMinutes =
    completedMatchPlayers.reduce(
      (total, matchPlayer) =>
        total +
        matchPlayer.minutesPlayed,
      0,
    );

  const goals =
    athleteEvents.filter(
      (event) =>
        event.type === "GOAL",
    ).length;

  const assists =
    athleteEvents.filter(
      (event) =>
        event.type === "ASSIST",
    ).length;

  const ratings =
    athletePerformances
      .map(
        (performance) =>
          performance.coachRating === null
            ? null
            : Number(
                performance.coachRating,
              ),
      )
      .filter(
        (rating): rating is number =>
          rating !== null &&
          Number.isFinite(rating),
      );

  const averageRating =
    ratings.length === 0
      ? null
      : ratings.reduce(
          (total, rating) =>
            total + rating,
          0,
        ) / ratings.length;

  const professionalStats = {
    appearances:
      appearanceMatchIds.size,
    starts,
    minutes:
      totalMinutes,
    goals,
    assists,
    averageRating,
    minutesPerAppearance:
      appearanceMatchIds.size === 0
        ? null
        : totalMinutes / appearanceMatchIds.size,
    goalContributions: goals + assists,
  };

  const performanceTrend = athletePerformances
    .flatMap((performance) => {
      if (performance.coachRating === null) {
        return [];
      }

      const rating = Number(performance.coachRating);

      if (!Number.isFinite(rating)) {
        return [];
      }

      return [
        {
          matchId: performance.matchId,
          startsAt: performance.match.startsAt,
          opponentName: performance.match.opponentName,
          rating,
        },
      ];
    })
    .sort(
      (left, right) =>
        right.startsAt.getTime() - left.startsAt.getTime(),
    )
    .slice(0, 5)
    .reverse();

  const [
    attendanceHistory,
    recentAppearances,
  ] = await Promise.all([
    prisma.trainingAttendance.findMany({
      where: {
        playerId: access.playerId,

        trainingSession: {
          academyId: access.academyId,
        },
      },

      select: {
        status: true,
      },
    }),

    prisma.matchPlayer.findMany({
      where: {
        playerId: access.playerId,

        OR: [
          {
            role: "STARTER",
          },
          {
            minutesPlayed: {
              gt: 0,
            },
          },
        ],

        match: {
          academyId: access.academyId,

          teamId: {
            in: activeTeamIds,
          },
          status: "COMPLETED",
        },
      },

      orderBy: {
        match: {
          startsAt: "desc",
        },
      },

      take: 5,

      select: {
        id: true,
        role: true,
        minutesPlayed: true,

        match: {
          select: {
            id: true,
            startsAt: true,
            opponentName: true,
            isHome: true,
            ourScore: true,
            opponentScore: true,
            competitionName: true,

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
  ]);

  const attendedSessions =
    attendanceHistory.filter(
      (attendance) =>
        attendance.status === "PRESENT" ||
        attendance.status === "LATE",
    ).length;

  const attendanceRate =
    attendanceHistory.length === 0
      ? null
      : Math.round(
          (attendedSessions /
            attendanceHistory.length) *
            100,
        );

  const nextMatch =
    upcomingMatches[0] ?? null;

  const nextSession = upcomingSessions[0] ?? null;

  const nextActivity =
    nextSession &&
    (!nextMatch ||
      nextSession.startsAt.getTime() <=
        nextMatch.startsAt.getTime())
      ? {
          type: "TRAINING" as const,
          id: nextSession.id,
          title: nextSession.title,
          subtitle: nextSession.team.name,
          startsAt: nextSession.startsAt,
          location:
            nextSession.facility?.name ||
            nextSession.location ||
            nextSession.branch?.name ||
            null,
          href: "/sportist/orari",
        }
      : nextMatch
        ? {
            type: "MATCH" as const,
            id: nextMatch.id,
            title: nextMatch.isHome
              ? `${nextMatch.team.name} - ${nextMatch.opponentName}`
              : `${nextMatch.opponentName} - ${nextMatch.team.name}`,
            subtitle:
              nextMatch.competitionName || nextMatch.team.name,
            startsAt: nextMatch.startsAt,
            location:
              nextMatch.facility?.name ||
              nextMatch.location ||
              null,
            href: `/sportist/ndeshjet/${nextMatch.id}`,
          }
        : null;

  const recentForm =
    recentAppearances.map(
      (appearance) => {
        const ourScore =
          appearance.match.ourScore;

        const opponentScore =
          appearance.match.opponentScore;

        let outcome:
          | "WIN"
          | "DRAW"
          | "LOSS"
          | "UNKNOWN" =
          "UNKNOWN";

        if (
          ourScore !== null &&
          opponentScore !== null
        ) {
          if (ourScore > opponentScore) {
            outcome = "WIN";
          } else if (
            ourScore < opponentScore
          ) {
            outcome = "LOSS";
          } else {
            outcome = "DRAW";
          }
        }

        return {
          ...appearance,
          outcome,
        };
      },
    );

  const lastAppearance = recentAppearances[0] ?? null;

  const lastMatchPerformance = lastAppearance
    ? athletePerformances.find(
        (performance) =>
          performance.matchId === lastAppearance.match.id,
      ) ?? null
    : null;

  const lastPassAccuracy =
    lastMatchPerformance &&
    lastMatchPerformance.passesAttempted > 0
      ? Math.round(
          (lastMatchPerformance.passesCompleted /
            lastMatchPerformance.passesAttempted) *
            100,
        )
      : null;

  const lastDribbleAccuracy =
    lastMatchPerformance &&
    lastMatchPerformance.dribblesAttempted > 0
      ? Math.round(
          (lastMatchPerformance.dribblesCompleted /
            lastMatchPerformance.dribblesAttempted) *
            100,
        )
      : null;

  const maxPhysicalWeight = Math.max(
    1,
    ...physicalProgress.map(
      (measurement) => measurement.weightKg ?? 0,
    ),
  );

  const maxPhysicalBodyFat = Math.max(
    1,
    ...physicalProgress.map(
      (measurement) => measurement.bodyFatPercent ?? 0,
    ),
  );

  const maxPhysicalMuscleMass = Math.max(
    1,
    ...physicalProgress.map(
      (measurement) => measurement.muscleMassKg ?? 0,
    ),
  );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-2xl bg-slate-950 text-white shadow-sm">
        <div className="grid lg:grid-cols-[1.35fr_.65fr]">
          <div className="p-6 sm:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.14em] text-slate-300">
                Profili i sportistit
              </span>

              <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                {String(player.status)}
              </span>
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">
              {athleteName}
            </h1>

            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-slate-300">
              <span>
                {player.position || "Pa pozicion"}
              </span>

              <span className="text-slate-600">
                •
              </span>

              <span>
                Nr. {player.jerseyNumber ?? "—"}
              </span>

              {primaryTeam ? (
                <>
                  <span className="text-slate-600">
                    •
                  </span>

                  <span>
                    {primaryTeam.name}
                  </span>
                </>
              ) : null}
            </div>

            <p className="mt-4 max-w-xl text-sm leading-6 text-slate-400">
              {access.academy.name}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/sportist/ndeshjet"
                className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
              >
                Shiko ndeshjet
              </Link>

              <Link
                href="/sportist/orari"
                className="rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Shiko orarin
              </Link>
            </div>
          </div>

          <div
            className="relative flex min-h-56 items-center justify-center bg-slate-900 bg-cover bg-center lg:min-h-full"
            style={
              player.photo
                ? {
                    backgroundImage: `linear-gradient(to top, rgba(2,6,23,.75), rgba(2,6,23,.05)), url(${player.photo})`,
                  }
                : undefined
            }
          >
            {!player.photo ? (
              <div className="flex h-28 w-28 items-center justify-center rounded-full border border-white/10 bg-white/10 text-4xl font-black text-white">
                {athleteInitials}
              </div>
            ) : null}

            <div className="absolute bottom-4 right-4 rounded-xl bg-black/40 px-3 py-2 text-right backdrop-blur-sm">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Akademia
              </p>

              <p className="mt-0.5 text-sm font-bold text-white">
                {access.academy.name}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl bg-slate-950 p-5 text-white sm:p-6">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">
            Performanca
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Statistikat e karrierës
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Përmbledhja nga ndeshjet e përfunduara me ekipet e tua aktive.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-8">
          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              Ndeshje
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.appearances}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              Titullar
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.starts}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              Minuta
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.minutes}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              Gola
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.goals}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              Asiste
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.assists}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              Min / ndeshje
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.minutesPerAppearance === null
                ? "—"
                : professionalStats.minutesPerAppearance.toFixed(1)}
            </p>
          </div>

          <div className="rounded-xl bg-white/10 p-4">
            <p className="text-xs text-slate-400">
              G+A
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.goalContributions}
            </p>
          </div>

          <div className="rounded-xl bg-emerald-400 p-4 text-slate-950">
            <p className="text-xs font-semibold text-emerald-950/70">
              Vlerësimi
            </p>

            <p className="mt-1 text-2xl font-black">
              {professionalStats.averageRating === null
                ? "—"
                : professionalStats.averageRating.toFixed(1)}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Qendra e Performancës
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Ecuria e Performancës
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Vlerësimet e trajnerit në pesë paraqitjet më të fundit.
            </p>
          </div>

          <div className="self-start rounded-xl bg-slate-950 px-3 py-2 sm:self-auto">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Mesatarja
            </p>

            <p className="mt-0.5 text-lg font-black text-white">
              {professionalStats.averageRating === null
                ? "—"
                : professionalStats.averageRating.toFixed(1)}
            </p>
          </div>
        </div>

        {performanceTrend.length === 0 ? (
          <p className="mt-6 text-sm text-slate-500">
            Ende nuk ka vlerësime të regjistruara të performancës.
          </p>
        ) : (
          <div className="mt-6 overflow-x-auto pb-2">
            <div className="grid min-w-[520px] grid-cols-5 gap-3">
              {performanceTrend.map((performance) => {
                const barHeight = Math.max(
                  8,
                  Math.min(
                    100,
                    (performance.rating / 10) * 100,
                  ),
                );

                return (
                  <Link
                    key={performance.matchId}
                    href={`/sportist/ndeshjet/${performance.matchId}`}
                    className="group min-w-0"
                  >
                    <div className="flex h-40 items-end overflow-hidden rounded-xl bg-slate-50 px-3 pt-4">
                      <div
                        className="w-full rounded-t-lg bg-emerald-500 transition group-hover:bg-emerald-600"
                        style={{
                          height: `${barHeight}%`,
                        }}
                      />
                    </div>

                    <div className="mt-2 text-center">
                      <p className="text-lg font-black text-slate-950">
                        {performance.rating.toFixed(1)}
                      </p>

                      <p className="mt-1 truncate text-xs font-semibold text-slate-600">
                        {performance.opponentName}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {formatDate(performance.startsAt)}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Qendra e Performancës
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Performanca në Ndeshjen e Fundit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Statistikat individuale nga paraqitja jote më e fundit.
            </p>
          </div>

          {lastAppearance ? (
            <Link
              href={`/sportist/ndeshjet/${lastAppearance.match.id}`}
              className="text-sm font-bold text-slate-950 hover:underline"
            >
              Detajet e ndeshjes →
            </Link>
          ) : null}
        </div>

        {!lastAppearance ? (
          <p className="mt-6 text-sm text-slate-500">
            Ende nuk ka paraqitje të përfunduara.
          </p>
        ) : (
          <div className="mt-6">
            <div className="flex flex-col gap-3 rounded-xl bg-slate-950 p-4 text-white sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Ndeshja e fundit
                </p>

                <p className="mt-1 truncate text-lg font-black">
                  {lastAppearance.match.opponentName}
                </p>

                <p className="mt-1 text-sm text-slate-400">
                  {formatDateTime(lastAppearance.match.startsAt)}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span className="rounded-lg bg-white/10 px-3 py-2 text-sm font-bold">
                  {lastAppearance.minutesPlayed} min
                </span>

                {lastMatchPerformance?.coachRating !== null &&
                lastMatchPerformance?.coachRating !== undefined ? (
                  <span className="rounded-lg bg-emerald-400 px-3 py-2 text-sm font-black text-slate-950">
                    {Number(lastMatchPerformance.coachRating).toFixed(1)} vlerësim
                  </span>
                ) : null}
              </div>
            </div>

            {!lastMatchPerformance ? (
              <div className="mt-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">
                  Ende nuk janë regjistruar statistikat individuale për këtë paraqitje.
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-700">
                  Minuta të luajtura: {lastAppearance.minutesPlayed}
                </p>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Minuta</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastAppearance.minutesPlayed}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Goditje</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.shots}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Në portë</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.shotsOnTarget}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Pasime</p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {lastMatchPerformance.passesCompleted}/
                    {lastMatchPerformance.passesAttempted}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {lastPassAccuracy === null
                      ? "Pa tentativa"
                      : `${lastPassAccuracy}% saktësi`}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Driblime</p>
                  <p className="mt-1 text-lg font-black text-slate-950">
                    {lastMatchPerformance.dribblesCompleted}/
                    {lastMatchPerformance.dribblesAttempted}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {lastDribbleAccuracy === null
                      ? "Pa tentativa"
                      : `${lastDribbleAccuracy}% sukses`}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Duele të fituara</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.duelsWon}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Ndërhyrje</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.tackles}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Interceptime</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.interceptions}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Faulle të kryera</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.foulsCommitted}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Faulle të fituara</p>
                  <p className="mt-1 text-xl font-black text-slate-950">
                    {lastMatchPerformance.foulsWon}
                  </p>
                </div>

                <div className="rounded-xl bg-emerald-50 p-4">
                  <p className="text-xs font-semibold text-emerald-700">
                    Vlerësimi
                  </p>

                  <p className="mt-1 text-xl font-black text-emerald-900">
                    {lastMatchPerformance.coachRating === null
                      ? "—"
                      : Number(lastMatchPerformance.coachRating).toFixed(1)}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="bg-slate-950 p-5 text-white sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                  Aktiviteti i ardhshëm
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  Çfarë ke më pas
                </h2>
              </div>

              {nextActivity ? (
                <span
                  className={[
                    "rounded-full px-3 py-1 text-xs font-bold",
                    nextActivity.type === "MATCH"
                      ? "bg-emerald-400/15 text-emerald-300"
                      : "bg-sky-400/15 text-sky-300",
                  ].join(" ")}
                >
                  {nextActivity.type === "MATCH"
                    ? "Ndeshje"
                    : "Stërvitje"}
                </span>
              ) : null}
            </div>

            {!nextActivity ? (
              <p className="mt-5 text-sm text-slate-400">
                Nuk ka aktivitete të ardhshme të planifikuara për momentin.
              </p>
            ) : (
              <div className="mt-6">
                <p className="text-2xl font-black tracking-tight">
                  {nextActivity.title}
                </p>

                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {nextActivity.subtitle}
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-lg bg-white/10 px-3 py-2 text-slate-200">
                    {formatDateTime(nextActivity.startsAt)}
                  </span>

                  {nextActivity.location ? (
                    <span className="rounded-lg bg-white/10 px-3 py-2 text-slate-200">
                      {nextActivity.location}
                    </span>
                  ) : null}
                </div>

                <Link
                  href={nextActivity.href}
                  className="mt-5 inline-flex rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-slate-100"
                >
                  {nextActivity.type === "MATCH"
                    ? "Shiko ndeshjen"
                    : "Shiko orarin"}
                </Link>
              </div>
            )}
          </div>

          {nextActivity ? (
            <div className="grid grid-cols-2 divide-x divide-slate-100 border-t border-slate-100">
              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-400">
                  Lloji
                </p>

                <p className="mt-1 font-black text-slate-950">
                  {nextActivity.type === "MATCH"
                    ? "Ndeshje"
                    : "Stërvitje"}
                </p>
              </div>

              <div className="p-4 sm:p-5">
                <p className="text-xs font-semibold text-slate-400">
                  Ekipi / aktiviteti
                </p>

                <p className="mt-1 truncate font-black text-slate-950">
                  {nextActivity.subtitle}
                </p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
            Prezenca
          </p>

          <div className="mt-4 flex items-end gap-2">
            <p className="text-5xl font-black tracking-tight text-slate-950">
              {attendanceRate === null
                ? "—"
                : `${attendanceRate}%`}
            </p>
          </div>

          <p className="mt-3 text-sm leading-6 text-slate-500">
            {attendanceHistory.length === 0
              ? "Ende nuk ka regjistrime prezence."
              : `${attendedSessions} nga ${attendanceHistory.length} seanca të ndjekura.`}
          </p>

          <div className="mt-5 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{
                width: `${attendanceRate ?? 0}%`,
              }}
            />
          </div>

          <Link
            href="/sportist/prezenca"
            className="mt-5 inline-flex text-sm font-bold text-slate-950 hover:underline"
          >
            Shiko prezencën →
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Forma
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Forma e fundit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Pesë paraqitjet e fundit në ndeshje të përfunduara.
            </p>
          </div>

          <Link
            href="/sportist/ndeshjet"
            className="text-sm font-bold text-slate-950 hover:underline"
          >
            Të gjitha ndeshjet →
          </Link>
        </div>

        {recentForm.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            Ende nuk ka paraqitje të përfunduara.
          </p>
        ) : (
          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            {recentForm.map(
              (appearance) => {
                const match =
                  appearance.match;

                const score =
                  match.ourScore === null ||
                  match.opponentScore === null
                    ? "—"
                    : match.isHome
                      ? `${match.ourScore} - ${match.opponentScore}`
                      : `${match.opponentScore} - ${match.ourScore}`;

                const outcomeLabel =
                  appearance.outcome === "WIN"
                    ? "F"
                    : appearance.outcome === "DRAW"
                      ? "B"
                      : appearance.outcome === "LOSS"
                        ? "H"
                        : "—";

                const outcomeClass =
                  appearance.outcome === "WIN"
                    ? "bg-emerald-100 text-emerald-700"
                    : appearance.outcome === "DRAW"
                      ? "bg-amber-100 text-amber-700"
                      : appearance.outcome === "LOSS"
                        ? "bg-red-100 text-red-700"
                        : "bg-slate-100 text-slate-600";

                return (
                  <Link
                    key={appearance.id}
                    href={`/sportist/ndeshjet/${match.id}`}
                    className="rounded-xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span
                        className={[
                          "flex h-8 w-8 items-center justify-center rounded-lg text-xs font-black",
                          outcomeClass,
                        ].join(" ")}
                      >
                        {outcomeLabel}
                      </span>

                      <span className="text-sm font-black text-slate-950">
                        {score}
                      </span>
                    </div>

                    <p className="mt-4 truncate text-sm font-bold text-slate-950">
                      {match.opponentName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {appearance.minutesPlayed} min
                    </p>

                    <p className="mt-1 text-xs text-slate-400">
                      {formatDateTime(
                        match.startsAt,
                      )}
                    </p>
                  </Link>
                );
              },
            )}
          </div>
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Statusi</p>

          <p className="mt-2 text-lg font-semibold">{String(player.status)}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Pozicioni</p>

          <p className="mt-2 text-lg font-semibold">{player.position || "—"}</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Numri</p>

          <p className="mt-2 text-lg font-semibold">
            {player.jerseyNumber ?? "—"}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Datëlindja</p>

          <p className="mt-2 text-lg font-semibold">
            {formatDate(player.dateOfBirth)}
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Ekipet aktive</h2>

          <div className="mt-4 space-y-3">
            {activeTeams.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nuk je i lidhur me një ekip aktiv.
              </p>
            ) : (
              activeTeams.map(({ team }) => (
                <div
                  key={team.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-3"
                >
                  <p className="font-medium">{team.name}</p>

                  <p className="mt-1 text-sm text-slate-500">
                    {[team.sport, team.ageGroup]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Qendra Fizike
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Progresi Fizik
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Evolucioni i matjeve fizike në tetë regjistrimet më të fundit.
              </p>
            </div>

            {latestMeasurement ? (
              <div className="self-start rounded-xl bg-slate-950 px-3 py-2 text-white sm:self-auto">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Matja e fundit
                </p>

                <p className="mt-0.5 text-sm font-black">
                  {formatDate(latestMeasurement.measuredAt)}
                </p>
              </div>
            ) : null}
          </div>

          {!latestMeasurement ? (
            <p className="mt-6 text-sm text-slate-500">
              Ende nuk ka matje fizike të regjistruara.
            </p>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Pesha</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {latestMeasurement.weightKg != null
                      ? `${latestMeasurement.weightKg} kg`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Yndyra trupore</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {latestMeasurement.bodyFatPercent != null
                      ? `${latestMeasurement.bodyFatPercent}%`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Masë muskulore</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {latestMeasurement.muscleMassKg != null
                      ? `${latestMeasurement.muscleMassKg} kg`
                      : "—"}
                  </p>
                </div>

                <div className="rounded-xl bg-slate-50 p-4">
                  <p className="text-xs text-slate-500">Gjatësia</p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    {latestMeasurement.heightCm != null
                      ? `${latestMeasurement.heightCm} cm`
                      : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-3">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">Pesha</p>
                  <p className="mt-1 text-xs text-slate-500">Historiku në kg</p>

                  <div className="mt-5 flex h-28 items-end gap-2">
                    {physicalProgress.map((measurement) => (
                      <div
                        key={`weight-${measurement.measuredAt.toISOString()}`}
                        className="flex min-w-0 flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-md bg-slate-900"
                          style={{
                            height: `${Math.max(
                              6,
                              ((measurement.weightKg ?? 0) /
                                maxPhysicalWeight) *
                                100,
                            )}%`,
                          }}
                          title={
                            measurement.weightKg != null
                              ? `${measurement.weightKg} kg`
                              : "Pa të dhëna"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">Yndyra trupore</p>
                  <p className="mt-1 text-xs text-slate-500">Historiku në përqindje</p>

                  <div className="mt-5 flex h-28 items-end gap-2">
                    {physicalProgress.map((measurement) => (
                      <div
                        key={`fat-${measurement.measuredAt.toISOString()}`}
                        className="flex min-w-0 flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-md bg-slate-700"
                          style={{
                            height: `${Math.max(
                              6,
                              ((measurement.bodyFatPercent ?? 0) /
                                maxPhysicalBodyFat) *
                                100,
                            )}%`,
                          }}
                          title={
                            measurement.bodyFatPercent != null
                              ? `${measurement.bodyFatPercent}%`
                              : "Pa të dhëna"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-sm font-bold text-slate-950">Masë muskulore</p>
                  <p className="mt-1 text-xs text-slate-500">Historiku në kg</p>

                  <div className="mt-5 flex h-28 items-end gap-2">
                    {physicalProgress.map((measurement) => (
                      <div
                        key={`muscle-${measurement.measuredAt.toISOString()}`}
                        className="flex min-w-0 flex-1 items-end"
                      >
                        <div
                          className="w-full rounded-t-md bg-emerald-500"
                          style={{
                            height: `${Math.max(
                              6,
                              ((measurement.muscleMassKg ?? 0) /
                                maxPhysicalMuscleMass) *
                                100,
                            )}%`,
                          }}
                          title={
                            measurement.muscleMassKg != null
                              ? `${measurement.muscleMassKg} kg`
                              : "Pa të dhëna"
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <div className="min-w-[620px]">
                  <div className="grid grid-cols-5 gap-3 border-b border-slate-200 pb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <span>Data</span>
                    <span>Pesha</span>
                    <span>Yndyra</span>
                    <span>Muskuj</span>
                    <span>Gjatësia</span>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {[...physicalProgress].reverse().map((measurement) => (
                      <div
                        key={measurement.measuredAt.toISOString()}
                        className="grid grid-cols-5 gap-3 py-3 text-sm"
                      >
                        <span className="font-semibold text-slate-700">
                          {formatDate(measurement.measuredAt)}
                        </span>

                        <span>
                          {measurement.weightKg != null
                            ? `${measurement.weightKg} kg`
                            : "—"}
                        </span>

                        <span>
                          {measurement.bodyFatPercent != null
                            ? `${measurement.bodyFatPercent}%`
                            : "—"}
                        </span>

                        <span>
                          {measurement.muscleMassKg != null
                            ? `${measurement.muscleMassKg} kg`
                            : "—"}
                        </span>

                        <span>
                          {measurement.heightCm != null
                            ? `${measurement.heightCm} cm`
                            : "—"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
              Akademia
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-950">
              Përditësimet e Akademisë
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Njoftimet më të fundit për ty dhe ekipet ku je aktiv.
            </p>
          </div>

          {academyUpdates.length > 0 ? (
            <span className="self-start rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 sm:self-auto">
              {academyUpdates.length} njoftime
            </span>
          ) : null}
        </div>

        {academyUpdates.length === 0 ? (
          <div className="mt-6 rounded-xl bg-slate-50 p-5">
            <p className="text-sm text-slate-500">
              Nuk ka njoftime aktive për momentin.
            </p>
          </div>
        ) : (
          <div className="mt-6 divide-y divide-slate-100">
            {academyUpdates.map((notification) => {
              const isRead =
                notification.notificationReads.length > 0;

              const priorityLabel =
                notification.priority === "URGENT"
                  ? "Urgjent"
                  : notification.priority === "IMPORTANT"
                    ? "I rëndësishëm"
                    : "Normal";

              return (
                <article
                  key={notification.id}
                  className="py-5 first:pt-0 last:pb-0"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-black text-slate-950">
                          {notification.title}
                        </h3>

                        {!isRead ? (
                          <span className="rounded-full bg-sky-50 px-2.5 py-1 text-[11px] font-bold text-sky-700">
                            I palexuar
                          </span>
                        ) : (
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                            I lexuar
                          </span>
                        )}

                        {notification.priority !== "NORMAL" ? (
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[11px] font-bold",
                              notification.priority === "URGENT"
                                ? "bg-rose-50 text-rose-700"
                                : "bg-amber-50 text-amber-700",
                            ].join(" ")}
                          >
                            {priorityLabel}
                          </span>
                        ) : null}
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {notification.message}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
                        <span>
                          {formatDateTime(notification.publishedAt)}
                        </span>

                        <span>·</span>

                        <span>
                          {notification.audience === "ALL"
                            ? "Gjithë akademia"
                            : notification.team?.name || "Ekipi"}
                        </span>
                      </div>
                    </div>

                    {notification.href ? (
                      <Link
                        href={notification.href}
                        className="shrink-0 text-sm font-bold text-slate-950 hover:underline"
                      >
                        Hap njoftimin →
                      </Link>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Seancat e ardhshme</h2>

          <div className="mt-4 space-y-3">
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nuk ka seanca të ardhshme për ekipet e tua.
              </p>
            ) : (
              upcomingSessions.map((session) => (
                <div
                  key={session.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">{session.title}</p>

                      <p className="mt-1 text-sm text-slate-500">
                        {session.team.name}
                      </p>
                    </div>

                    <p className="text-sm font-medium">
                      {formatDateTime(session.startsAt)}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {session.facility?.name ||
                      session.location ||
                      session.branch?.name ||
                      "Vendndodhja nuk është përcaktuar"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Ndeshjet e ardhshme</h2>

          <div className="mt-4 space-y-3">
            {upcomingMatches.length === 0 ? (
              <p className="text-sm text-slate-500">
                Nuk ka ndeshje të ardhshme për ekipet e tua.
              </p>
            ) : (
              upcomingMatches.map((match) => (
                <div
                  key={match.id}
                  className="rounded-lg border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium">
                        {match.isHome
                          ? `${match.team.name} - ${match.opponentName}`
                          : `${match.opponentName} - ${match.team.name}`}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {match.competitionName || match.team.name}
                      </p>
                    </div>

                    <p className="text-sm font-medium">
                      {formatDateTime(match.startsAt)}
                    </p>
                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    {match.facility?.name ||
                      match.location ||
                      "Vendndodhja nuk është përcaktuar"}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="text-lg font-semibold">Prezenca e fundit</h2>

        <div className="mt-4 space-y-3">
          {recentAttendances.length === 0 ? (
            <p className="text-sm text-slate-500">
              Ende nuk ka prezenca të regjistruara.
            </p>
          ) : (
            recentAttendances.map((attendance) => (
              <div
                key={attendance.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">
                    {attendance.trainingSession.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {attendance.trainingSession.team.name}
                    {" · "}
                    {formatDateTime(attendance.trainingSession.startsAt)}
                  </p>
                </div>

                <p className="text-sm font-semibold">
                  {attendanceLabel(attendance.status)}
                </p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
