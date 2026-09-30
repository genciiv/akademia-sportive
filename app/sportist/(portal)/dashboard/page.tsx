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

        take: 1,

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
        coachRating: true,
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
  };

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
            Performance
          </p>

          <h2 className="mt-1 text-xl font-bold">
            Statistikat e karrierës
          </h2>

          <p className="mt-1 text-sm text-slate-400">
            Përmbledhja nga ndeshjet e përfunduara me ekipet e tua aktive.
          </p>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
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

      <section className="grid gap-4 xl:grid-cols-[1.4fr_.6fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Ndeshja e radhës
              </p>

              <h2 className="mt-1 text-xl font-bold text-slate-950">
                Përgatitja e ardhshme
              </h2>
            </div>

            {nextMatch ? (
              <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                E planifikuar
              </span>
            ) : null}
          </div>

          {!nextMatch ? (
            <p className="mt-5 text-sm text-slate-500">
              Nuk ka ndeshje të ardhshme për momentin.
            </p>
          ) : (
            <div className="mt-5">
              <p className="text-2xl font-black tracking-tight text-slate-950">
                {nextMatch.isHome
                  ? `${nextMatch.team.name} - ${nextMatch.opponentName}`
                  : `${nextMatch.opponentName} - ${nextMatch.team.name}`}
              </p>

              <p className="mt-2 text-sm font-medium text-slate-600">
                {formatDateTime(nextMatch.startsAt)}
              </p>

              <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold text-slate-600">
                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                  {nextMatch.isHome
                    ? "Në shtëpi"
                    : "Në transfertë"}
                </span>

                <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                  {nextMatch.competitionName ||
                    nextMatch.team.name}
                </span>

                {(nextMatch.facility?.name ||
                  nextMatch.location) ? (
                  <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                    {nextMatch.facility?.name ||
                      nextMatch.location}
                  </span>
                ) : null}
              </div>

              <Link
                href={`/sportist/ndeshjet/${nextMatch.id}`}
                className="mt-5 inline-flex rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                Detajet e ndeshjes
              </Link>
            </div>
          )}
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

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h2 className="text-lg font-semibold">Matja e fundit fizike</h2>

          {!latestMeasurement ? (
            <p className="mt-4 text-sm text-slate-500">
              Ende nuk ka matje fizike të regjistruara.
            </p>
          ) : (
            <dl className="mt-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-slate-500">Data</dt>

                <dd className="mt-1 font-medium">
                  {formatDate(latestMeasurement.measuredAt)}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Gjatësia</dt>

                <dd className="mt-1 font-medium">
                  {latestMeasurement.heightCm != null
                    ? `${latestMeasurement.heightCm} cm`
                    : "—"}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Pesha</dt>

                <dd className="mt-1 font-medium">
                  {latestMeasurement.weightKg != null
                    ? `${latestMeasurement.weightKg} kg`
                    : "—"}
                </dd>
              </div>

              <div>
                <dt className="text-slate-500">Yndyra trupore</dt>

                <dd className="mt-1 font-medium">
                  {latestMeasurement.bodyFatPercent != null
                    ? `${latestMeasurement.bodyFatPercent}%`
                    : "—"}
                </dd>
              </div>
            </dl>
          )}
        </div>
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
