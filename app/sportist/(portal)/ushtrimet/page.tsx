import { redirect } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  Dumbbell,
  Layers3,
  Sparkles,
  Target,
  Timer,
  Wrench,
} from "lucide-react";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

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

function difficultyLabel(value: string) {
  switch (value) {
    case "EASY":
      return "E lehtë";
    case "MEDIUM":
      return "Mesatare";
    case "HARD":
      return "E vështirë";
    default:
      return value;
  }
}

function difficultyClass(value: string) {
  switch (value) {
    case "EASY":
      return "bg-emerald-100 text-emerald-700";
    case "HARD":
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-amber-100 text-amber-700";
  }
}

export default async function AthleteExercisesPage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status ===
      401
    ) {
      redirect(
        "/hyrje?next=/sportist/ushtrimet"
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

  const now = new Date();

  const assignments =
    activeTeamIds.length === 0
      ? []
      : await prisma.trainingSessionDrill.findMany({
          where: {
            trainingSession: {
              academyId:
                access.academyId,

              teamId: {
                in: activeTeamIds,
              },

              status: {
                in: [
                  "SCHEDULED",
                  "COMPLETED",
                ],
              },
            },

            drill: {
              academyId:
                access.academyId,

              isActive: true,
            },
          },

          orderBy: [
            {
              trainingSession: {
                startsAt: "desc",
              },
            },
            {
              order: "asc",
            },
          ],

          take: 60,

          select: {
            id: true,
            order: true,
            durationMin: true,

            trainingSession: {
              select: {
                id: true,
                title: true,
                startsAt: true,
                status: true,

                team: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },

            drill: {
              select: {
                id: true,
                name: true,
                category: true,
                sport: true,
                objective: true,
                durationMin: true,
                difficulty: true,
                equipment: true,
                description: true,
              },
            },
          },
        });

  const upcoming =
    assignments
      .filter(
        (item) =>
          item.trainingSession
            .startsAt >= now &&
          item.trainingSession
            .status === "SCHEDULED"
      )
      .sort(
        (left, right) =>
          left.trainingSession.startsAt.getTime() -
          right.trainingSession.startsAt.getTime()
      );

  const recent =
    assignments
      .filter(
        (item) =>
          item.trainingSession
            .startsAt < now
      )
      .sort(
        (left, right) =>
          right.trainingSession.startsAt.getTime() -
          left.trainingSession.startsAt.getTime()
      );

  const uniqueDrillIds =
    new Set(
      assignments.map(
        (item) =>
          item.drill.id
      )
    );

  const totalUpcoming =
    upcoming.length;

  const totalRecent =
    recent.length;

  const athleteName =
    `${player.firstName} ${player.lastName}`.trim();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-emerald-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
              <Sparkles size={13} />
              Stërvitja ime
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Ushtrimet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ushtrimet që trajnerët kanë përfshirë në seancat e ekipeve të tua.
              Këtu shikon objektivin, vështirësinë, kohëzgjatjen dhe pajisjet e nevojshme.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {athleteName}
              </span>

              <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                {uniqueDrillIds.size} ushtrime
              </span>

              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                {activeTeams.length} ekipe aktive
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <Dumbbell size={27} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
            <Layers3 size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {uniqueDrillIds.size}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Ushtrime të ndryshme
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-emerald-600 shadow-sm">
            <CalendarDays size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {totalUpcoming}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Në program
          </p>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
            <CheckCircle2 size={19} />
          </span>

          <p className="mt-5 text-3xl font-black text-slate-950">
            {totalRecent}
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-700">
            Në seancat e fundit
          </p>
        </div>
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
            Në program
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Ushtrimet e ardhshme
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ushtrimet e përfshira në seancat e ardhshme të stërvitjes.
          </p>
        </div>

        {upcoming.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <CalendarDays
              size={27}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Nuk ka ushtrime të programuara për momentin.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Kur trajneri shton ushtrime në një seancë të ardhshme, ato do të shfaqen këtu.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {upcoming.map(
              (item) => (
                <ExerciseCard
                  key={item.id}
                  item={item}
                />
              )
            )}
          </div>
        )}
      </section>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
            Historia
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Ushtrimet e fundit
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Ushtrimet që janë përdorur së fundmi në seancat e tua.
          </p>
        </div>

        {recent.length === 0 ? (
          <div className="mt-6 rounded-2xl bg-slate-50 p-7 text-center">
            <Dumbbell
              size={27}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm text-slate-500">
              Ende nuk ka ushtrime të regjistruara nga seancat e kaluara.
            </p>
          </div>
        ) : (
          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {recent
              .slice(0, 12)
              .map(
                (item) => (
                  <ExerciseCard
                    key={item.id}
                    item={item}
                  />
                )
              )}
          </div>
        )}
      </section>
    </div>
  );
}

type ExerciseItem = {
  id: string;
  order: number;
  durationMin: number | null;

  trainingSession: {
    id: string;
    title: string;
    startsAt: Date;
    status: string;

    team: {
      id: string;
      name: string;
    };
  };

  drill: {
    id: string;
    name: string;
    category: string | null;
    sport: string | null;
    objective: string | null;
    durationMin: number | null;
    difficulty: string;
    equipment: string | null;
    description: string | null;
  };
};

function ExerciseCard({
  item,
}: {
  item: ExerciseItem;
}) {
  const duration =
    item.durationMin ??
    item.drill.durationMin;

  return (
    <article className="rounded-2xl border border-slate-200 bg-slate-50 p-5 transition hover:border-blue-200 hover:bg-blue-50/30">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            {item.drill.category ? (
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                {item.drill.category}
              </span>
            ) : null}

            <span
              className={[
                "rounded-full px-2.5 py-1 text-[10px] font-bold",
                difficultyClass(
                  item.drill.difficulty
                ),
              ].join(" ")}
            >
              {difficultyLabel(
                item.drill.difficulty
              )}
            </span>
          </div>

          <h3 className="mt-3 text-lg font-bold text-slate-950">
            {item.drill.name}
          </h3>

          {item.drill.objective ? (
            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
              <Target
                size={15}
                className="mt-1 shrink-0 text-blue-500"
              />

              {item.drill.objective}
            </p>
          ) : null}
        </div>

        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-blue-600 shadow-sm">
          <Dumbbell size={18} />
        </span>
      </div>

      {item.drill.description ? (
        <p className="mt-4 text-sm leading-6 text-slate-500">
          {item.drill.description}
        </p>
      ) : null}

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <CalendarDays
              size={14}
              className="text-blue-500"
            />

            {item.trainingSession.title}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            {item.trainingSession.team.name}
            {" · "}
            {formatDateTime(
              item.trainingSession.startsAt
            )}
          </p>
        </div>

        <div className="rounded-xl bg-white p-3">
          <p className="flex items-center gap-2 text-xs font-semibold text-slate-700">
            <Timer
              size={14}
              className="text-violet-500"
            />

            {duration === null
              ? "Kohëzgjatje e pacaktuar"
              : `${duration} minuta`}
          </p>

          <p className="mt-1 text-[11px] text-slate-400">
            Renditja në seancë: {item.order}
          </p>
        </div>
      </div>

      {item.drill.equipment ? (
        <div className="mt-3 rounded-xl bg-white p-3">
          <p className="flex items-start gap-2 text-xs text-slate-600">
            <Wrench
              size={14}
              className="mt-0.5 shrink-0 text-amber-500"
            />

            <span>
              <span className="font-semibold text-slate-700">
                Pajisjet:
              </span>{" "}
              {item.drill.equipment}
            </span>
          </p>
        </div>
      ) : null}

      {item.drill.sport ? (
        <p className="mt-4 flex items-center gap-2 text-[11px] font-medium text-slate-400">
          <Clock3 size={12} />
          {item.drill.sport}
        </p>
      ) : null}
    </article>
  );
}