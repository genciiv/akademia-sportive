import Link from "next/link";
import { redirect } from "next/navigation";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("sq-AL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function matchTypeLabel(value: string) {
  switch (value) {
    case "FRIENDLY":
      return "Miqesore";
    case "LEAGUE":
      return "Kampionat";
    case "CUP":
      return "Kupe";
    case "TOURNAMENT":
      return "Turne";
    default:
      return "Tjeter";
  }
}

export default async function AthleteMatchesPage() {
  const access = await requireAthleteAccess();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje?next=/sportist/ndeshjet");
    }

    redirect("/");
  }

  const activeTeams = await prisma.teamPlayer.findMany({
    where: {
      playerId: access.playerId,
      isActive: true,

      team: {
        academyId: access.academyId,
        status: "ACTIVE",
      },
    },

    select: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      joinedAt: "asc",
    },
  });

  const activeTeamIds = activeTeams.map(({ team }) => team.id);

  const now = new Date();

  const [upcomingMatches, completedMatches] = await Promise.all([
    prisma.match.findMany({
      where: {
        academyId: access.academyId,

        teamId: {
          in: activeTeamIds,
        },

        status: "SCHEDULED",

        startsAt: {
          gte: now,
        },
      },

      orderBy: {
        startsAt: "asc",
      },

      select: {
        id: true,
        opponentName: true,
        matchType: true,
        startsAt: true,
        location: true,
        isHome: true,
        competitionName: true,
        round: true,

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

    prisma.match.findMany({
      where: {
        academyId: access.academyId,

        teamId: {
          in: activeTeamIds,
        },

        status: "COMPLETED",
      },

      orderBy: {
        startsAt: "desc",
      },

      take: 20,

      select: {
        id: true,
        opponentName: true,
        matchType: true,
        startsAt: true,
        location: true,
        isHome: true,
        ourScore: true,
        opponentScore: true,
        competitionName: true,
        round: true,

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
  ]);

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Portali i Sportistit
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">
          Ndeshjet e mia
        </h1>

        <p className="mt-2 text-sm text-slate-600">
          Shiko ndeshjet e ardhshme dhe rezultatet e ekipeve ku je aktiv.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Ndeshjet e ardhshme
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ndeshjet e planifikuara per ekipet e tua aktive.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {upcomingMatches.length}
          </span>
        </div>

        {upcomingMatches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Nuk ka ndeshje te ardhshme.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {upcomingMatches.map((match) => (
              <article
                key={match.id}
                className="rounded-xl border border-slate-200 bg-white p-5"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      {matchTypeLabel(String(match.matchType))}
                    </p>

                    <Link
                      href={`/sportist/ndeshjet/${match.id}`}
                      className="mt-2 block text-lg font-semibold text-slate-950 hover:underline"
                    >
                      {match.isHome
                        ? `${match.team.name} - ${match.opponentName}`
                        : `${match.opponentName} - ${match.team.name}`}
                    </Link>
                  </div>

                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                    E planifikuar
                  </span>
                </div>

                <dl className="mt-4 space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Data</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {formatDateTime(match.startsAt)}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Ekipi</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {match.team.name}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-slate-500">Vendndodhja</dt>
                    <dd className="text-right font-medium text-slate-800">
                      {match.facility?.name ||
                        match.location ||
                        "Nuk eshte percaktuar"}
                    </dd>
                  </div>

                  {match.competitionName ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Kompeticioni</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {match.competitionName}
                      </dd>
                    </div>
                  ) : null}

                  {match.round ? (
                    <div className="flex justify-between gap-4">
                      <dt className="text-slate-500">Raundi</dt>
                      <dd className="text-right font-medium text-slate-800">
                        {match.round}
                      </dd>
                    </div>
                  ) : null}
                </dl>
              </article>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Rezultatet e fundit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Deri ne 20 ndeshjet e fundit te perfunduara.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {completedMatches.length}
          </span>
        </div>

        {completedMatches.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">
              Ende nuk ka rezultate te regjistruara.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {completedMatches.map((match) => {
              const homeScore = match.isHome
                ? match.ourScore
                : match.opponentScore;

              const awayScore = match.isHome
                ? match.opponentScore
                : match.ourScore;

              return (
                <article
                  key={match.id}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                        {match.competitionName ||
                          matchTypeLabel(String(match.matchType))}
                      </p>

                      <Link
                        href={`/sportist/ndeshjet/${match.id}`}
                        className="mt-2 block font-semibold text-slate-950 hover:underline"
                      >
                        {match.isHome
                          ? `${match.team.name} - ${match.opponentName}`
                          : `${match.opponentName} - ${match.team.name}`}
                      </Link>

                      <p className="mt-1 text-sm text-slate-500">
                        {formatDateTime(match.startsAt)}
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-950 px-5 py-3 text-center text-xl font-bold text-white">
                      {homeScore ?? "-"} : {awayScore ?? "-"}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}