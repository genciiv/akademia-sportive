import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  ShieldCheck,
  Sparkles,
  Trophy,
  UsersRound,
} from "lucide-react";

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
      return "Miqësore";
    case "LEAGUE":
      return "Kampionat";
    case "CUP":
      return "Kupë";
    case "TOURNAMENT":
      return "Turne";
    default:
      return "Tjetër";
  }
}

export default async function AthleteMatchesPage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/ndeshjet"
      );
    }

    redirect("/");
  }

  const activeTeams =
    await prisma.teamPlayer.findMany({
      where: {
        playerId: access.playerId,
        isActive: true,

        team: {
          academyId:
            access.academyId,
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

  const activeTeamIds =
    activeTeams.map(
      ({ team }) =>
        team.id
    );

  const now =
    new Date();

  const [
    upcomingMatches,
    completedMatches,
  ] = await Promise.all([
    prisma.match.findMany({
      where: {
        academyId:
          access.academyId,

        teamId: {
          in: activeTeamIds,
        },

        status:
          "SCHEDULED",

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
        lineupPublishedAt: true,

        matchPlayers: {
          where: {
            playerId:
              access.playerId,
          },

          select: {
            role: true,
          },

          take: 1,
        },

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
        academyId:
          access.academyId,

        teamId: {
          in: activeTeamIds,
        },

        status:
          "COMPLETED",
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

  const nextMatch =
    upcomingMatches[0] ??
    null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700">
              <Sparkles size={13} />
              Ndeshjet e mia
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Ndeshjet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Shiko ndeshjet e ardhshme, statusin e grumbullimit dhe rezultatet e fundit të ekipeve ku je aktiv.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                <CalendarDays size={14} />
                {upcomingMatches.length} të ardhshme
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                {completedMatches.length} të përfunduara
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                <UsersRound size={14} />
                {activeTeams.length} ekipe aktive
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
            <Trophy size={28} />
          </div>
        </div>
      </section>

      {nextMatch ? (
        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
                Ndeshja e ardhshme
              </p>

              <h2 className="mt-2 text-xl font-black text-slate-950 sm:text-2xl">
                {nextMatch.isHome
                  ? `${nextMatch.team.name} - ${nextMatch.opponentName}`
                  : `${nextMatch.opponentName} - ${nextMatch.team.name}`}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                {nextMatch.competitionName ||
                  matchTypeLabel(
                    String(
                      nextMatch.matchType
                    )
                  )}
              </p>

              <div className="mt-4 flex flex-wrap gap-3 text-sm text-slate-600">
                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <Clock3
                    size={15}
                    className="text-violet-500"
                  />
                  {formatDateTime(
                    nextMatch.startsAt
                  )}
                </span>

                <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                  <MapPin
                    size={15}
                    className="text-rose-500"
                  />
                  {nextMatch.facility?.name ||
                    nextMatch.location ||
                    "Vendndodhja nuk është përcaktuar"}
                </span>
              </div>
            </div>

            <Link
              href={`/sportist/ndeshjet/${nextMatch.id}`}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
            >
              Hap ndeshjen
              <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      ) : null}

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
              Në program
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Ndeshjet e ardhshme
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Ndeshjet e planifikuara për ekipet e tua aktive.
            </p>
          </div>

          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
            {upcomingMatches.length}
          </span>
        </div>

        {upcomingMatches.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <Trophy
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Nuk ka ndeshje të ardhshme.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {upcomingMatches.map(
              (match) => {
                const athleteMatch =
                  match.matchPlayers[0] ??
                  null;

                return (
                  <article
                    key={match.id}
                    className="rounded-2xl border border-slate-100 bg-slate-50 p-5 transition hover:border-violet-200 hover:bg-violet-50/30"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                          {matchTypeLabel(
                            String(
                              match.matchType
                            )
                          )}
                        </span>

                        <Link
                          href={`/sportist/ndeshjet/${match.id}`}
                          className="mt-3 block text-lg font-black text-slate-950 transition hover:text-violet-700"
                        >
                          {match.isHome
                            ? `${match.team.name} - ${match.opponentName}`
                            : `${match.opponentName} - ${match.team.name}`}
                        </Link>
                      </div>

                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                        <Trophy size={18} />
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {!athleteMatch ? (
                        <span className="rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                          Nuk je grumbulluar
                        </span>
                      ) : !match.lineupPublishedAt ? (
                        <span className="rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                          I grumbulluar
                        </span>
                      ) : athleteMatch.role ===
                        "STARTER" ? (
                        <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                          Titullar
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                          Zëvendësues
                        </span>
                      )}

                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        E planifikuar
                      </span>
                    </div>

                    <div className="mt-5 space-y-2 rounded-xl bg-white p-4 text-sm">
                      <p className="flex items-center gap-2 text-slate-600">
                        <CalendarDays
                          size={14}
                          className="text-blue-500"
                        />
                        {formatDateTime(
                          match.startsAt
                        )}
                      </p>

                      <p className="flex items-center gap-2 text-slate-600">
                        <MapPin
                          size={14}
                          className="text-rose-500"
                        />
                        {match.facility?.name ||
                          match.location ||
                          "Vendndodhja nuk është përcaktuar"}
                      </p>

                      {match.competitionName ? (
                        <p className="flex items-center gap-2 text-slate-600">
                          <ShieldCheck
                            size={14}
                            className="text-violet-500"
                          />
                          {match.competitionName}
                          {match.round
                            ? ` · ${match.round}`
                            : ""}
                        </p>
                      ) : null}
                    </div>

                    <Link
                      href={`/sportist/ndeshjet/${match.id}`}
                      className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-violet-700"
                    >
                      Shiko detajet
                      <ArrowRight size={14} />
                    </Link>
                  </article>
                );
              }
            )}
          </div>
        )}
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
              Historia
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Rezultatet e fundit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Deri në 20 ndeshjet e fundit të përfunduara.
            </p>
          </div>

          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            {completedMatches.length}
          </span>
        </div>

        {completedMatches.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-7 text-center">
            <Trophy
              size={27}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              Ende nuk ka rezultate të regjistruara.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {completedMatches.map(
              (match) => {
                const homeScore =
                  match.isHome
                    ? match.ourScore
                    : match.opponentScore;

                const awayScore =
                  match.isHome
                    ? match.opponentScore
                    : match.ourScore;

                const won =
                  match.ourScore !==
                    null &&
                  match.opponentScore !==
                    null &&
                  match.ourScore >
                    match.opponentScore;

                const draw =
                  match.ourScore !==
                    null &&
                  match.opponentScore !==
                    null &&
                  match.ourScore ===
                    match.opponentScore;

                return (
                  <Link
                    key={match.id}
                    href={`/sportist/ndeshjet/${match.id}`}
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                        {match.competitionName ||
                          matchTypeLabel(
                            String(
                              match.matchType
                            )
                          )}
                      </p>

                      <p className="mt-2 truncate font-bold text-slate-900">
                        {match.isHome
                          ? `${match.team.name} - ${match.opponentName}`
                          : `${match.opponentName} - ${match.team.name}`}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {formatDateTime(
                          match.startsAt
                        )}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-3">
                      <span
                        className={[
                          "rounded-full px-2.5 py-1 text-[10px] font-bold",
                          won
                            ? "bg-emerald-100 text-emerald-700"
                            : draw
                              ? "bg-amber-100 text-amber-700"
                              : "bg-rose-100 text-rose-700",
                        ].join(" ")}
                      >
                        {won
                          ? "Fitore"
                          : draw
                            ? "Barazim"
                            : "Humbje"}
                      </span>

                      <div className="min-w-[88px] rounded-xl bg-slate-950 px-4 py-2 text-center text-lg font-black text-white">
                        {homeScore ?? "-"} :{" "}
                        {awayScore ?? "-"}
                      </div>

                      <ArrowRight
                        size={16}
                        className="text-slate-300 transition group-hover:text-blue-600"
                      />
                    </div>
                  </Link>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}