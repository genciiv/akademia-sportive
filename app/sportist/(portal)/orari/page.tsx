import { redirect } from "next/navigation";
import {
  CalendarDays,
  Clock3,
  Dumbbell,
  MapPin,
  Sparkles,
  Trophy,
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

export default async function AthleteSchedulePage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/orari"
      );
    }

    redirect("/");
  }

  const activeTeams =
    await prisma.teamPlayer.findMany({
      where: {
        playerId:
          access.playerId,
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
    trainingSessions,
    matches,
  ] = await Promise.all([
    prisma.trainingSession.findMany({
      where: {
        academyId:
          access.academyId,

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
        academyId:
          access.academyId,

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

      select: {
        id: true,
        startsAt: true,
        opponentName: true,
        isHome: true,
        competitionName: true,
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
      },
    }),
  ]);

  const scheduleItems = [
    ...trainingSessions.map(
      (session) => ({
        id: `training-${session.id}`,
        type: "TRAINING" as const,
        startsAt:
          session.startsAt,
        title:
          session.title,
        subtitle:
          session.team.name,
        location:
          session.facility?.name ||
          session.location ||
          session.branch?.name ||
          null,
      })
    ),

    ...matches.map(
      (match) => ({
        id: `match-${match.id}`,
        type: "MATCH" as const,
        startsAt:
          match.startsAt,

        title:
          match.isHome
            ? `${match.team.name} - ${match.opponentName}`
            : `${match.opponentName} - ${match.team.name}`,

        subtitle:
          match.competitionName ||
          match.team.name,

        location:
          match.facility?.name ||
          match.location ||
          null,
      })
    ),
  ].sort(
    (a, b) =>
      a.startsAt.getTime() -
      b.startsAt.getTime()
  );

  const nextActivity =
    scheduleItems[0] ??
    null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
              <Sparkles size={13} />
              Kalendari im
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Orari im
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Seancat stërvitore dhe ndeshjet e ardhshme të ekipeve ku je aktiv.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                <Dumbbell size={14} />
                {trainingSessions.length} stërvitje
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                <Trophy size={14} />
                {matches.length} ndeshje
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                <CalendarDays size={14} />
                {scheduleItems.length} aktivitete
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <CalendarDays size={28} />
          </div>
        </div>
      </section>

      {nextActivity ? (
        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
                Aktiviteti i ardhshëm
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                {nextActivity.title}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {nextActivity.subtitle}
              </p>
            </div>

            <span
              className={[
                "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                nextActivity.type ===
                "TRAINING"
                  ? "bg-blue-50 text-blue-600"
                  : "bg-violet-50 text-violet-600",
              ].join(" ")}
            >
              {nextActivity.type ===
              "TRAINING" ? (
                <Dumbbell size={19} />
              ) : (
                <Trophy size={19} />
              )}
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-slate-600">
            <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
              <Clock3
                size={15}
                className="text-blue-500"
              />
              {formatDateTime(
                nextActivity.startsAt
              )}
            </span>

            {nextActivity.location ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2">
                <MapPin
                  size={15}
                  className="text-rose-500"
                />
                {nextActivity.location}
              </span>
            ) : null}
          </div>
        </section>
      ) : null}

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
            Programi
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Aktivitetet e ardhshme
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Të gjitha aktivitetet e planifikuara në rend kronologjik.
          </p>
        </div>

        {scheduleItems.length ===
        0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <CalendarDays
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Nuk ka aktivitete të ardhshme.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Aktivitetet e reja do të shfaqen këtu sapo akademia t&apos;i planifikojë.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {scheduleItems.map(
              (item) => (
                <div
                  key={item.id}
                  className="group rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-blue-200 hover:bg-blue-50/30"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex min-w-0 items-start gap-3">
                      <span
                        className={[
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl",
                          item.type ===
                          "TRAINING"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-violet-100 text-violet-700",
                        ].join(" ")}
                      >
                        {item.type ===
                        "TRAINING" ? (
                          <Dumbbell
                            size={17}
                          />
                        ) : (
                          <Trophy
                            size={17}
                          />
                        )}
                      </span>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={[
                              "rounded-full px-2.5 py-1 text-[10px] font-bold",
                              item.type ===
                              "TRAINING"
                                ? "bg-blue-100 text-blue-700"
                                : "bg-violet-100 text-violet-700",
                            ].join(" ")}
                          >
                            {item.type ===
                            "TRAINING"
                              ? "Stërvitje"
                              : "Ndeshje"}
                          </span>
                        </div>

                        <p className="mt-2 font-bold text-slate-900">
                          {item.title}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {item.subtitle}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 sm:text-right">
                      <p className="flex items-center gap-2 text-sm font-semibold text-slate-700 sm:justify-end">
                        <Clock3
                          size={14}
                          className="text-blue-500"
                        />
                        {formatDateTime(
                          item.startsAt
                        )}
                      </p>

                      {item.location ? (
                        <p className="mt-1 flex items-center gap-2 text-xs text-slate-400 sm:justify-end">
                          <MapPin
                            size={13}
                          />
                          {item.location}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </section>
    </div>
  );
}