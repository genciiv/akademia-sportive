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
              season: true,
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

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">Mirë se erdhe</p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          {athleteName}
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Këtu mund të shohësh informacionin tënd sportiv në{" "}
          {access.academy.name}.
        </p>
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
                    {[team.sport, team.ageGroup, team.season]
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
