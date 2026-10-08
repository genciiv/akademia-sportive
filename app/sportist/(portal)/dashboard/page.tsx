import Link from "next/link";
import { redirect } from "next/navigation";

import {
  Activity,
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Dumbbell,
  MapPin,
  Medal,
  Megaphone,
  Scale,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";

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

  const [
    upcomingSessions,
    upcomingMatches,
    recentAttendances,
    academyUpdates,
    completedMatchPlayers,
    athleteEvents,
    athletePerformances,
    attendanceByStatus,
  ] = await Promise.all([
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

    prisma.notification.findMany({
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
    }),

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
      orderBy: {
        match: {
          startsAt: "desc",
        },
      },
      select: {
        id: true,
        matchId: true,
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

    prisma.trainingAttendance.groupBy({
      by: ["status"],
      where: {
        playerId: access.playerId,
        trainingSession: {
          academyId: access.academyId,
        },
      },
      _count: {
        _all: true,
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

  const recentAppearances =
    completedMatchPlayers
      .filter(
        (matchPlayer) =>
          matchPlayer.role === "STARTER" ||
          matchPlayer.minutesPlayed > 0,
      )
      .slice(0, 5);

  const attendanceTotal =
    attendanceByStatus.reduce(
      (total, attendance) =>
        total + attendance._count._all,
      0,
    );

  const attendedSessions =
    attendanceByStatus.reduce(
      (total, attendance) =>
        attendance.status === "PRESENT" ||
        attendance.status === "LATE"
          ? total + attendance._count._all
          : total,
      0,
    );

  const attendanceRate =
    attendanceTotal === 0
      ? null
      : Math.round(
          (attendedSessions /
            attendanceTotal) *
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

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 shadow-sm">
        <div className="grid lg:grid-cols-[1.35fr_.65fr]">
          <div className="p-6 sm:p-8 xl:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
                <Sparkles size={13} />
                Përmbledhja ime
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-bold text-emerald-700">
                <CheckCircle2 size={13} />
                {player.status === "ACTIVE"
                  ? "Aktiv"
                  : String(player.status)}
              </span>
            </div>

            <p className="mt-6 text-sm font-medium text-slate-500">
              Mirë se erdhe,
            </p>

            <h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
              {athleteName}
            </h1>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                {player.position || "Pa pozicion"}
              </span>

              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm">
                Nr. {player.jerseyNumber ?? "—"}
              </span>

              {primaryTeam ? (
                <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                  {primaryTeam.name}
                </span>
              ) : null}
            </div>

            <p className="mt-5 max-w-xl text-sm leading-6 text-slate-500">
              Këtu ke një pamje të shpejtë të aktivitetit,
              performancës dhe progresit tënd në{" "}
              <span className="font-semibold text-slate-700">
                {access.academy.name}
              </span>.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/sportist/orari"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-blue-700"
              >
                <CalendarDays size={16} />
                Shiko orarin
              </Link>

              <Link
                href="/sportist/ndeshjet"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <Trophy size={16} />
                Ndeshjet
              </Link>
            </div>
          </div>

          <div className="relative flex min-h-[230px] items-center justify-center bg-gradient-to-br from-blue-100 via-violet-100 to-emerald-50 lg:min-h-full">
            {player.photo ? (
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(255,255,255,.9), rgba(255,255,255,.12)), url(${player.photo})`,
                }}
              />
            ) : null}

            <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-[30px] border border-white/80 bg-white/80 text-3xl font-black text-blue-700 shadow-lg backdrop-blur">
              {athleteInitials || (
                <UserRound size={36} />
              )}
            </div>

            <div className="absolute bottom-5 left-5 right-5 z-10 rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Akademia
              </p>

              <p className="mt-1 truncate text-sm font-bold text-slate-900">
                {access.academy.name}
              </p>

              {primaryTeam ? (
                <p className="mt-1 truncate text-xs text-slate-500">
                  {primaryTeam.name}
                  {primaryTeam.ageGroup
                    ? ` · ${primaryTeam.ageGroup}`
                    : ""}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
              <Trophy size={19} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-blue-500">
              Karriera
            </span>
          </div>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {professionalStats.appearances}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Ndeshje
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {professionalStats.minutes} minuta gjithsej
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
              <ClipboardCheck size={19} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-emerald-600">
              Prezenca
            </span>
          </div>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {attendanceRate === null
              ? "—"
              : `${attendanceRate}%`}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Pjesëmarrja
          </p>

          <Link
            href="/sportist/prezenca"
            className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:underline"
          >
            Shiko historikun
            <ArrowRight size={12} />
          </Link>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
              <Activity size={19} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-violet-600">
              Performanca
            </span>
          </div>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {professionalStats.averageRating === null
              ? "—"
              : professionalStats.averageRating.toFixed(1)}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Vlerësimi mesatar
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {professionalStats.goals} gola ·{" "}
            {professionalStats.assists} asiste
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <div className="flex items-center justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
              <Medal size={19} />
            </span>

            <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-amber-600">
              Kontribute
            </span>
          </div>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {professionalStats.goalContributions}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Gola + asiste
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {professionalStats.starts} ndeshje si titullar
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-2">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
                Çfarë ke më pas
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Aktiviteti i ardhshëm
              </h2>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Clock3 size={18} />
            </span>
          </div>

          {nextActivity ? (
            <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50/60 p-5">
              <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">
                {nextActivity.type === "MATCH"
                  ? "Ndeshje"
                  : "Stërvitje"}
              </span>

              <h3 className="mt-4 text-lg font-bold text-slate-950">
                {nextActivity.title}
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                {nextActivity.subtitle}
              </p>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-blue-500"
                  />
                  {formatDateTime(
                    nextActivity.startsAt
                  )}
                </p>

                {nextActivity.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin
                      size={15}
                      className="text-blue-500"
                    />
                    {nextActivity.location}
                  </p>
                ) : null}
              </div>

              <Link
                href={nextActivity.href}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700"
              >
                Shiko detajet
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <CalendarDays
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Nuk ka aktivitet të planifikuar.
              </p>
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
                Ndeshja
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Ndeshja e ardhshme
              </h2>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Trophy size={18} />
            </span>
          </div>

          {nextMatch ? (
            <div className="mt-6 rounded-2xl border border-violet-100 bg-violet-50/60 p-5">
              <p className="text-xs font-semibold text-violet-700">
                {nextMatch.competitionName ||
                  nextMatch.team.name}
              </p>

              <h3 className="mt-3 text-xl font-black text-slate-950">
                {nextMatch.isHome
                  ? `${nextMatch.team.name} - ${nextMatch.opponentName}`
                  : `${nextMatch.opponentName} - ${nextMatch.team.name}`}
              </h3>

              <div className="mt-4 space-y-2 text-sm text-slate-600">
                <p className="flex items-center gap-2">
                  <CalendarDays
                    size={15}
                    className="text-violet-500"
                  />
                  {formatDateTime(
                    nextMatch.startsAt
                  )}
                </p>

                {nextMatch.facility?.name ||
                nextMatch.location ? (
                  <p className="flex items-center gap-2">
                    <MapPin
                      size={15}
                      className="text-violet-500"
                    />
                    {nextMatch.facility?.name ||
                      nextMatch.location}
                  </p>
                ) : null}
              </div>

              <Link
                href={`/sportist/ndeshjet/${nextMatch.id}`}
                className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-violet-700"
              >
                Hap ndeshjen
                <ArrowRight size={15} />
              </Link>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
              <Trophy
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm font-semibold text-slate-700">
                Nuk ka ndeshje të planifikuar.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
                Forma
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Paraqitjet e fundit
              </h2>
            </div>

            <Link
              href="/sportist/ndeshjet"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Shiko të gjitha
            </Link>
          </div>

          {recentForm.length === 0 ? (
            <p className="mt-6 text-sm text-slate-500">
              Ende nuk ka paraqitje të regjistruara.
            </p>
          ) : (
            <div className="mt-6 grid gap-3 sm:grid-cols-5">
              {recentForm.map(
                (appearance) => (
                  <Link
                    key={appearance.id}
                    href={`/sportist/ndeshjet/${appearance.match.id}`}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 transition hover:border-blue-200 hover:bg-blue-50"
                  >
                    <div
                      className={[
                        "flex h-9 w-9 items-center justify-center rounded-xl text-xs font-black",
                        appearance.outcome === "WIN"
                          ? "bg-emerald-100 text-emerald-700"
                          : appearance.outcome === "DRAW"
                            ? "bg-amber-100 text-amber-700"
                            : appearance.outcome === "LOSS"
                              ? "bg-rose-100 text-rose-700"
                              : "bg-slate-200 text-slate-600",
                      ].join(" ")}
                    >
                      {appearance.outcome === "WIN"
                        ? "F"
                        : appearance.outcome === "DRAW"
                          ? "B"
                          : appearance.outcome === "LOSS"
                            ? "H"
                            : "—"}
                    </div>

                    <p className="mt-3 truncate text-xs font-bold text-slate-800">
                      {appearance.match.opponentName}
                    </p>

                    <p className="mt-1 text-[11px] text-slate-400">
                      {appearance.minutesPlayed} min
                    </p>
                  </Link>
                )
              )}
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
                Prezenca
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Aktiviteti i fundit
              </h2>
            </div>

            <Link
              href="/sportist/prezenca"
              className="text-xs font-bold text-blue-600 hover:underline"
            >
              Historiku
            </Link>
          </div>

          <div className="mt-5 space-y-3">
            {recentAttendances.length === 0 ? (
              <p className="text-sm text-slate-500">
                Ende nuk ka prezenca të regjistruara.
              </p>
            ) : (
              recentAttendances
                .slice(0, 3)
                .map((attendance) => (
                  <div
                    key={attendance.id}
                    className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-800">
                        {
                          attendance
                            .trainingSession
                            .title
                        }
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        {formatDate(
                          attendance
                            .trainingSession
                            .startsAt
                        )}
                      </p>
                    </div>

                    <span
                      className={[
                        "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold",
                        attendance.status ===
                        "PRESENT"
                          ? "bg-emerald-100 text-emerald-700"
                          : attendance.status ===
                            "LATE"
                            ? "bg-amber-100 text-amber-700"
                            : attendance.status ===
                              "EXCUSED"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-rose-100 text-rose-700",
                      ].join(" ")}
                    >
                      {attendanceLabel(
                        attendance.status
                      )}
                    </span>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_.9fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-amber-600">
                Akademia
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Përditësimet e fundit
              </h2>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
              <Megaphone size={18} />
            </span>
          </div>

          <div className="mt-5 space-y-3">
            {academyUpdates.length === 0 ? (
              <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
                Nuk ka njoftime të reja.
              </div>
            ) : (
              academyUpdates
                .slice(0, 3)
                .map((notification) => (
                  <div
                    key={notification.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                  >
                    <div className="flex items-start gap-3">
                      <span
                        className={[
                          "mt-1 h-2.5 w-2.5 shrink-0 rounded-full",
                          notification.notificationReads.length === 0
                            ? "bg-blue-500"
                            : "bg-slate-300",
                        ].join(" ")}
                      />

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-900">
                          {notification.title}
                        </p>

                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-500">
                          {notification.message}
                        </p>

                        <p className="mt-2 text-[11px] text-slate-400">
                          {formatDate(
                            notification.publishedAt
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
                Profili fizik
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Matja e fundit
              </h2>
            </div>

            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <Scale size={18} />
            </span>
          </div>

          {latestMeasurement ? (
            <>
              <div className="mt-5 grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs text-slate-500">
                    Gjatësia
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {latestMeasurement.heightCm === null
                      ? "—"
                      : `${latestMeasurement.heightCm} cm`}
                  </p>
                </div>

                <div className="rounded-2xl bg-emerald-50 p-4">
                  <p className="text-xs text-slate-500">
                    Pesha
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {latestMeasurement.weightKg === null
                      ? "—"
                      : `${latestMeasurement.weightKg} kg`}
                  </p>
                </div>

                <div className="rounded-2xl bg-amber-50 p-4">
                  <p className="text-xs text-slate-500">
                    Yndyrë trupore
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {latestMeasurement.bodyFatPercent === null
                      ? "—"
                      : `${latestMeasurement.bodyFatPercent}%`}
                  </p>
                </div>

                <div className="rounded-2xl bg-violet-50 p-4">
                  <p className="text-xs text-slate-500">
                    Masë muskulore
                  </p>

                  <p className="mt-1 text-xl font-black text-slate-950">
                    {latestMeasurement.muscleMassKg === null
                      ? "—"
                      : `${latestMeasurement.muscleMassKg} kg`}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-400">
                Matja e fundit:{" "}
                {formatDate(
                  latestMeasurement.measuredAt
                )}
              </p>
            </>
          ) : (
            <div className="mt-5 rounded-2xl bg-slate-50 p-6 text-center">
              <Dumbbell
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                Ende nuk ka matje fizike të regjistruara.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}