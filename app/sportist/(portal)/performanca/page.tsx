import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity,
  ArrowRight,
  Crosshair,
  Gauge,
  Medal,
  ShieldCheck,
  Sparkles,
  Target,
  Timer,
  Trophy,
} from "lucide-react";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function percentage(
  completed: number,
  attempted: number
) {
  if (attempted <= 0) {
    return null;
  }

  return Math.round(
    (completed / attempted) * 100
  );
}

export default async function AthletePerformancePage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status ===
      401
    ) {
      redirect(
        "/hyrje?next=/sportist/performanca"
      );
    }

    redirect("/");
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: access.playerId,
        academyId:
          access.academyId,
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        position: true,
        jerseyNumber: true,

        teams: {
          where: {
            isActive: true,
          },

          select: {
            team: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (!player) {
    redirect("/");
  }

  const activeTeams =
    player.teams.filter(
      ({ team }) =>
        team.status === "ACTIVE"
    );

  const activeTeamIds =
    activeTeams.map(
      ({ team }) => team.id
    );

  const [
    matchPlayers,
    events,
    performances,
  ] = await Promise.all([
    prisma.matchPlayer.findMany({
      where: {
        playerId:
          access.playerId,

        match: {
          academyId:
            access.academyId,

          teamId: {
            in: activeTeamIds,
          },

          status:
            "COMPLETED",
        },
      },

      select: {
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
                name: true,
              },
            },
          },
        },
      },
    }),

    prisma.matchEvent.findMany({
      where: {
        playerId:
          access.playerId,

        match: {
          academyId:
            access.academyId,

          teamId: {
            in: activeTeamIds,
          },

          status:
            "COMPLETED",
        },
      },

      select: {
        matchId: true,
        type: true,
      },
    }),

    prisma.playerMatchPerformance.findMany({
      where: {
        playerId:
          access.playerId,

        match: {
          academyId:
            access.academyId,

          teamId: {
            in: activeTeamIds,
          },

          status:
            "COMPLETED",
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
            id: true,
            startsAt: true,
            opponentName: true,
            isHome: true,
            ourScore: true,
            opponentScore: true,
            competitionName: true,

            team: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const appearances =
    matchPlayers.filter(
      (item) =>
        item.role === "STARTER" ||
        item.minutesPlayed > 0
    );

  const starts =
    matchPlayers.filter(
      (item) =>
        item.role === "STARTER"
    ).length;

  const totalMinutes =
    matchPlayers.reduce(
      (sum, item) =>
        sum + item.minutesPlayed,
      0
    );

  const goals =
    events.filter(
      (event) =>
        event.type === "GOAL"
    ).length;

  const assists =
    events.filter(
      (event) =>
        event.type === "ASSIST"
    ).length;

  const ratings =
    performances
      .map((item) =>
        item.coachRating === null
          ? null
          : Number(
              item.coachRating
            )
      )
      .filter(
        (
          value
        ): value is number =>
          value !== null &&
          Number.isFinite(value)
      );

  const averageRating =
    ratings.length === 0
      ? null
      : ratings.reduce(
          (sum, value) =>
            sum + value,
          0
        ) / ratings.length;

  const totals =
    performances.reduce(
      (acc, item) => ({
        shots:
          acc.shots +
          item.shots,

        shotsOnTarget:
          acc.shotsOnTarget +
          item.shotsOnTarget,

        passesAttempted:
          acc.passesAttempted +
          item.passesAttempted,

        passesCompleted:
          acc.passesCompleted +
          item.passesCompleted,

        dribblesAttempted:
          acc.dribblesAttempted +
          item.dribblesAttempted,

        dribblesCompleted:
          acc.dribblesCompleted +
          item.dribblesCompleted,

        duelsWon:
          acc.duelsWon +
          item.duelsWon,

        tackles:
          acc.tackles +
          item.tackles,

        interceptions:
          acc.interceptions +
          item.interceptions,

        foulsCommitted:
          acc.foulsCommitted +
          item.foulsCommitted,

        foulsWon:
          acc.foulsWon +
          item.foulsWon,
      }),

      {
        shots: 0,
        shotsOnTarget: 0,
        passesAttempted: 0,
        passesCompleted: 0,
        dribblesAttempted: 0,
        dribblesCompleted: 0,
        duelsWon: 0,
        tackles: 0,
        interceptions: 0,
        foulsCommitted: 0,
        foulsWon: 0,
      }
    );

  const passAccuracy =
    percentage(
      totals.passesCompleted,
      totals.passesAttempted
    );

  const dribbleAccuracy =
    percentage(
      totals.dribblesCompleted,
      totals.dribblesAttempted
    );

  const shotAccuracy =
    percentage(
      totals.shotsOnTarget,
      totals.shots
    );

  const sortedPerformances =
    [...performances].sort(
      (left, right) =>
        right.match.startsAt.getTime() -
        left.match.startsAt.getTime()
    );

  const ratingTrend =
    sortedPerformances
      .flatMap((item) => {
        if (
          item.coachRating ===
          null
        ) {
          return [];
        }

        const rating =
          Number(
            item.coachRating
          );

        if (
          !Number.isFinite(
            rating
          )
        ) {
          return [];
        }

        return [
          {
            matchId:
              item.matchId,

            opponentName:
              item.match
                .opponentName,

            startsAt:
              item.match
                .startsAt,

            rating,
          },
        ];
      })
      .slice(0, 6)
      .reverse();

  const athleteName =
    `${player.firstName} ${player.lastName}`.trim();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700">
              <Sparkles size={13} />
              Qendra e performancës
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Performanca ime
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Statistikat e tua personale nga ndeshjet e përfunduara,
              progresi i vlerësimit dhe treguesit kryesorë të lojës.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {athleteName}
              </span>

              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {player.position ||
                  "Pa pozicion"}
              </span>

              <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                Nr.{" "}
                {player.jerseyNumber ??
                  "—"}
              </span>
            </div>
          </div>

          <Link
            href="/sportist/ndeshjet"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-violet-700"
          >
            Shiko ndeshjet
            <ArrowRight size={15} />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Trophy size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {appearances.length}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Ndeshje
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {starts} si titullar
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <Timer size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {totalMinutes}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Minuta
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {appearances.length ===
            0
              ? "—"
              : `${(
                  totalMinutes /
                  appearances.length
                ).toFixed(
                  1
                )} min / ndeshje`}
          </p>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm">
            <Medal size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {goals + assists}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Kontribute
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {goals} gola ·{" "}
            {assists} asiste
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
            <Gauge size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {averageRating === null
              ? "—"
              : averageRating.toFixed(
                  1
                )}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Vlerësimi mesatar
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Nga vlerësimet e trajnerit
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
              Ecuria
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Vlerësimet e fundit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Gjashtë vlerësimet më të fundit të regjistruara nga trajneri.
            </p>
          </div>

          {ratingTrend.length ===
          0 ? (
            <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
              <Activity
                size={24}
                className="mx-auto text-slate-300"
              />

              <p className="mt-3 text-sm text-slate-500">
                Ende nuk ka vlerësime të regjistruara.
              </p>
            </div>
          ) : (
            <div className="mt-7 overflow-x-auto pb-2">
              <div className="grid min-w-[600px] grid-cols-6 gap-3">
                {ratingTrend.map(
                  (item) => {
                    const barHeight =
                      Math.max(
                        10,
                        Math.min(
                          100,
                          (item.rating /
                            10) *
                            100
                        )
                      );

                    return (
                      <Link
                        key={
                          item.matchId
                        }
                        href={`/sportist/ndeshjet/${item.matchId}`}
                        className="group"
                      >
                        <div className="flex h-44 items-end overflow-hidden rounded-2xl bg-violet-50 px-3 pt-4">
                          <div
                            className="w-full rounded-t-xl bg-violet-500 transition group-hover:bg-violet-600"
                            style={{
                              height: `${barHeight}%`,
                            }}
                          />
                        </div>

                        <p className="mt-3 text-center text-xl font-black text-slate-950">
                          {item.rating.toFixed(
                            1
                          )}
                        </p>

                        <p className="mt-1 truncate text-center text-xs font-semibold text-slate-600">
                          {
                            item.opponentName
                          }
                        </p>

                        <p className="mt-1 text-center text-[10px] text-slate-400">
                          {formatDate(
                            item.startsAt
                          )}
                        </p>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          )}
        </div>

        <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
            Efikasiteti
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Treguesit teknikë
          </h2>

          <div className="mt-6 space-y-5">
            {[
              {
                label:
                  "Saktësia e pasimeve",
                value:
                  passAccuracy,
                accent:
                  "bg-blue-500",
              },
              {
                label:
                  "Saktësia e driblimeve",
                value:
                  dribbleAccuracy,
                accent:
                  "bg-violet-500",
              },
              {
                label:
                  "Goditje në portë",
                value:
                  shotAccuracy,
                accent:
                  "bg-emerald-500",
              },
            ].map(
              (metric) => (
                <div
                  key={
                    metric.label
                  }
                >
                  <div className="flex items-center justify-between gap-4">
                    <p className="text-sm font-semibold text-slate-700">
                      {
                        metric.label
                      }
                    </p>

                    <p className="text-sm font-black text-slate-950">
                      {metric.value ===
                      null
                        ? "—"
                        : `${metric.value}%`}
                    </p>
                  </div>

                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={[
                        "h-full rounded-full",
                        metric.accent,
                      ].join(" ")}
                      style={{
                        width: `${
                          metric.value ??
                          0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
            Statistikat
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Loja ime në shifra
          </h2>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Goditje",
              value:
                totals.shots,
              icon: Target,
              style:
                "bg-blue-50 text-blue-700",
            },
            {
              label:
                "Në portë",
              value:
                totals.shotsOnTarget,
              icon: Crosshair,
              style:
                "bg-emerald-50 text-emerald-700",
            },
            {
              label:
                "Duele fituar",
              value:
                totals.duelsWon,
              icon: ShieldCheck,
              style:
                "bg-violet-50 text-violet-700",
            },
            {
              label:
                "Ndërhyrje",
              value:
                totals.tackles,
              icon: Activity,
              style:
                "bg-amber-50 text-amber-700",
            },
            {
              label:
                "Intercepte",
              value:
                totals.interceptions,
              icon: ShieldCheck,
              style:
                "bg-cyan-50 text-cyan-700",
            },
            {
              label:
                "Faulle të fituara",
              value:
                totals.foulsWon,
              icon: Trophy,
              style:
                "bg-rose-50 text-rose-700",
            },
          ].map(
            (metric) => {
              const Icon =
                metric.icon;

              return (
                <div
                  key={
                    metric.label
                  }
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <span
                    className={[
                      "flex h-9 w-9 items-center justify-center rounded-xl",
                      metric.style,
                    ].join(" ")}
                  >
                    <Icon
                      size={17}
                    />
                  </span>

                  <p className="mt-4 text-2xl font-black text-slate-950">
                    {
                      metric.value
                    }
                  </p>

                  <p className="mt-1 text-xs font-semibold text-slate-500">
                    {
                      metric.label
                    }
                  </p>
                </div>
              );
            }
          )}
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
              Historia
            </p>

            <h2 className="mt-1 text-lg font-bold text-slate-950">
              Performancat e fundit
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Përmbledhja individuale sipas ndeshjeve.
            </p>
          </div>

          <Link
            href="/sportist/ndeshjet"
            className="text-sm font-bold text-blue-600 hover:underline"
          >
            Të gjitha ndeshjet
          </Link>
        </div>

        {sortedPerformances.length ===
        0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-7 text-center">
            <Activity
              size={26}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-600">
              Ende nuk ka performanca individuale të regjistruara.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {sortedPerformances
              .slice(0, 8)
              .map(
                (item) => {
                  const rating =
                    item.coachRating ===
                    null
                      ? null
                      : Number(
                          item.coachRating
                        );

                  const itemPassAccuracy =
                    percentage(
                      item.passesCompleted,
                      item.passesAttempted
                    );

                  return (
                    <Link
                      key={
                        item.matchId
                      }
                      href={`/sportist/ndeshjet/${item.matchId}`}
                      className="flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/40 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900">
                          {
                            item.match
                              .opponentName
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.match
                            .competitionName ||
                            item.match
                              .team
                              .name}
                          {" · "}
                          {formatDate(
                            item.match
                              .startsAt
                          )}
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                          {item.shotsOnTarget}/
                          {item.shots} në portë
                        </span>

                        <span className="rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                          Pasime{" "}
                          {itemPassAccuracy ===
                          null
                            ? "—"
                            : `${itemPassAccuracy}%`}
                        </span>

                        <span className="rounded-lg bg-violet-100 px-3 py-2 text-xs font-black text-violet-700">
                          Rating{" "}
                          {rating ===
                            null ||
                          !Number.isFinite(
                            rating
                          )
                            ? "—"
                            : rating.toFixed(
                                1
                              )}
                        </span>

                        <ArrowRight
                          size={16}
                          className="text-slate-400"
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