import { redirect } from "next/navigation";
import {
  Activity,
  CalendarDays,
  Dumbbell,
  Ruler,
  Scale,
  Sparkles,
  TrendingDown,
  TrendingUp,
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

function formatChange(
  current: number | null,
  previous: number | null,
  suffix: string
) {
  if (
    current === null ||
    previous === null
  ) {
    return null;
  }

  const difference =
    current - previous;

  if (
    Math.abs(difference) <
    0.001
  ) {
    return {
      value: `0 ${suffix}`,
      direction: "SAME" as const,
    };
  }

  return {
    value: `${
      difference > 0
        ? "+"
        : ""
    }${difference.toFixed(1)} ${suffix}`,

    direction:
      difference > 0
        ? ("UP" as const)
        : ("DOWN" as const),
  };
}

export default async function AthletePhysicalProfilePage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status ===
      401
    ) {
      redirect(
        "/hyrje?next=/sportist/profili-fizik"
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

        physicalMeasurements: {
          orderBy: {
            measuredAt:
              "desc",
          },

          take: 12,

          select: {
            id: true,
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

  const measurements =
    player.physicalMeasurements;

  const latest =
    measurements[0] ?? null;

  const previous =
    measurements[1] ?? null;

  const history =
    [...measurements].reverse();

  const weightChange =
    formatChange(
      latest?.weightKg ??
        null,
      previous?.weightKg ??
        null,
      "kg"
    );

  const bodyFatChange =
    formatChange(
      latest?.bodyFatPercent ??
        null,
      previous?.bodyFatPercent ??
        null,
      "%"
    );

  const muscleChange =
    formatChange(
      latest?.muscleMassKg ??
        null,
      previous?.muscleMassKg ??
        null,
      "kg"
    );

  const heightChange =
    formatChange(
      latest?.heightCm ??
        null,
      previous?.heightCm ??
        null,
      "cm"
    );

  const athleteName =
    `${player.firstName} ${player.lastName}`.trim();

  const maxWeight =
    Math.max(
      1,
      ...history.map(
        (item) =>
          item.weightKg ?? 0
      )
    );

  const maxBodyFat =
    Math.max(
      1,
      ...history.map(
        (item) =>
          item.bodyFatPercent ??
          0
      )
    );

  const maxMuscle =
    Math.max(
      1,
      ...history.map(
        (item) =>
          item.muscleMassKg ??
          0
      )
    );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
              <Sparkles size={13} />
              Qendra fizike
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Profili fizik
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Shiko matjet e tua fizike,
              ndryshimin nga matja e fundit
              dhe historikun e progresit.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {athleteName}
              </span>

              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {player.position ||
                  "Pa pozicion"}
              </span>

              <span className="rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                Nr.{" "}
                {player.jerseyNumber ??
                  "—"}
              </span>
            </div>
          </div>

          {latest ? (
            <div className="rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                Matja e fundit
              </p>

              <p className="mt-1 flex items-center gap-2 text-sm font-bold text-slate-900">
                <CalendarDays
                  size={15}
                  className="text-emerald-600"
                />

                {formatDate(
                  latest.measuredAt
                )}
              </p>
            </div>
          ) : null}
        </div>
      </section>

      {latest ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PhysicalMetricCard
              title="Gjatësia"
              value={
                latest.heightCm ===
                null
                  ? "—"
                  : `${latest.heightCm} cm`
              }
              change={
                heightChange
              }
              icon={Ruler}
              tone="blue"
            />

            <PhysicalMetricCard
              title="Pesha"
              value={
                latest.weightKg ===
                null
                  ? "—"
                  : `${latest.weightKg} kg`
              }
              change={
                weightChange
              }
              icon={Scale}
              tone="emerald"
            />

            <PhysicalMetricCard
              title="Yndyra trupore"
              value={
                latest.bodyFatPercent ===
                null
                  ? "—"
                  : `${latest.bodyFatPercent}%`
              }
              change={
                bodyFatChange
              }
              icon={Activity}
              tone="amber"
            />

            <PhysicalMetricCard
              title="Masë muskulore"
              value={
                latest.muscleMassKg ===
                null
                  ? "—"
                  : `${latest.muscleMassKg} kg`
              }
              change={
                muscleChange
              }
              icon={Dumbbell}
              tone="violet"
            />
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.15fr_.85fr]">
            <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-emerald-600">
                  Progresi
                </p>

                <h2 className="mt-1 text-lg font-bold text-slate-950">
                  Ecuria e matjeve
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Krahasimi vizual i matjeve fizike të regjistruara.
                </p>
              </div>

              {history.length <= 1 ? (
                <div className="mt-6 rounded-2xl bg-slate-50 p-6 text-center">
                  <Activity
                    size={24}
                    className="mx-auto text-slate-300"
                  />

                  <p className="mt-3 text-sm text-slate-500">
                    Duhet të paktën edhe një matje tjetër për të parë progresin.
                  </p>
                </div>
              ) : (
                <div className="mt-7 space-y-7">
                  <ProgressRow
                    label="Pesha"
                    values={history.map(
                      (item) => ({
                        id: item.id,
                        date:
                          item.measuredAt,
                        value:
                          item.weightKg,
                      })
                    )}
                    max={maxWeight}
                    suffix="kg"
                    barClass="bg-emerald-500"
                  />

                  <ProgressRow
                    label="Yndyra trupore"
                    values={history.map(
                      (item) => ({
                        id: item.id,
                        date:
                          item.measuredAt,
                        value:
                          item.bodyFatPercent,
                      })
                    )}
                    max={maxBodyFat}
                    suffix="%"
                    barClass="bg-amber-500"
                  />

                  <ProgressRow
                    label="Masë muskulore"
                    values={history.map(
                      (item) => ({
                        id: item.id,
                        date:
                          item.measuredAt,
                        value:
                          item.muscleMassKg,
                      })
                    )}
                    max={maxMuscle}
                    suffix="kg"
                    barClass="bg-violet-500"
                  />
                </div>
              )}
            </div>

            <div className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
                Përmbledhja
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Ndryshimi nga matja e fundit
              </h2>

              <div className="mt-6 space-y-3">
                <ChangeRow
                  label="Pesha"
                  change={
                    weightChange
                  }
                />

                <ChangeRow
                  label="Yndyra trupore"
                  change={
                    bodyFatChange
                  }
                />

                <ChangeRow
                  label="Masë muskulore"
                  change={
                    muscleChange
                  }
                />

                <ChangeRow
                  label="Gjatësia"
                  change={
                    heightChange
                  }
                />
              </div>
            </div>
          </section>

          <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
                Historia
              </p>

              <h2 className="mt-1 text-lg font-bold text-slate-950">
                Historiku i matjeve
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Deri në 12 matjet më të fundit fizike.
              </p>
            </div>

            <div className="mt-6 overflow-x-auto">
              <table className="min-w-[720px] w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left">
                    <th className="pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Data
                    </th>

                    <th className="pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Gjatësia
                    </th>

                    <th className="pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Pesha
                    </th>

                    <th className="pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Yndyra
                    </th>

                    <th className="pb-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                      Masë muskulore
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {measurements.map(
                    (
                      measurement
                    ) => (
                      <tr
                        key={
                          measurement.id
                        }
                        className="border-b border-slate-100 last:border-0"
                      >
                        <td className="py-4 text-sm font-semibold text-slate-700">
                          {formatDate(
                            measurement.measuredAt
                          )}
                        </td>

                        <td className="py-4 text-sm text-slate-600">
                          {measurement.heightCm ===
                          null
                            ? "—"
                            : `${measurement.heightCm} cm`}
                        </td>

                        <td className="py-4 text-sm text-slate-600">
                          {measurement.weightKg ===
                          null
                            ? "—"
                            : `${measurement.weightKg} kg`}
                        </td>

                        <td className="py-4 text-sm text-slate-600">
                          {measurement.bodyFatPercent ===
                          null
                            ? "—"
                            : `${measurement.bodyFatPercent}%`}
                        </td>

                        <td className="py-4 text-sm text-slate-600">
                          {measurement.muscleMassKg ===
                          null
                            ? "—"
                            : `${measurement.muscleMassKg} kg`}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <section className="rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Dumbbell
            size={32}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Ende nuk ka matje fizike
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Matjet e regjistruara nga akademia do të shfaqen këtu sapo të jenë të disponueshme.
          </p>
        </section>
      )}
    </div>
  );
}

type Change = {
  value: string;
  direction:
    | "UP"
    | "DOWN"
    | "SAME";
} | null;

function PhysicalMetricCard({
  title,
  value,
  change,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  change: Change;
  icon: typeof Activity;
  tone:
    | "blue"
    | "emerald"
    | "amber"
    | "violet";
}) {
  const tones = {
    blue: {
      card:
        "border-blue-100 bg-blue-50/70",
      icon:
        "bg-white text-blue-600",
    },

    emerald: {
      card:
        "border-emerald-100 bg-emerald-50/70",
      icon:
        "bg-white text-emerald-600",
    },

    amber: {
      card:
        "border-amber-100 bg-amber-50/70",
      icon:
        "bg-white text-amber-600",
    },

    violet: {
      card:
        "border-violet-100 bg-violet-50/70",
      icon:
        "bg-white text-violet-600",
    },
  };

  return (
    <div
      className={[
        "rounded-2xl border p-5",
        tones[tone].card,
      ].join(" ")}
    >
      <span
        className={[
          "flex h-10 w-10 items-center justify-center rounded-xl shadow-sm",
          tones[tone].icon,
        ].join(" ")}
      >
        <Icon size={19} />
      </span>

      <p className="mt-5 text-3xl font-black text-slate-950">
        {value}
      </p>

      <p className="mt-1 text-sm font-semibold text-slate-700">
        {title}
      </p>

      <div className="mt-2">
        <ChangeBadge
          change={change}
        />
      </div>
    </div>
  );
}

function ChangeBadge({
  change,
}: {
  change: Change;
}) {
  if (!change) {
    return (
      <span className="text-xs text-slate-400">
        Pa krahasim
      </span>
    );
  }

  if (
    change.direction === "SAME"
  ) {
    return (
      <span className="text-xs font-semibold text-slate-500">
        Pa ndryshim
      </span>
    );
  }

  const up =
    change.direction === "UP";

  return (
    <span
      className={[
        "inline-flex items-center gap-1 text-xs font-semibold",
        up
          ? "text-emerald-700"
          : "text-rose-700",
      ].join(" ")}
    >
      {up ? (
        <TrendingUp size={13} />
      ) : (
        <TrendingDown
          size={13}
        />
      )}

      {change.value}
    </span>
  );
}

function ChangeRow({
  label,
  change,
}: {
  label: string;
  change: Change;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-4 py-3">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <ChangeBadge
        change={change}
      />
    </div>
  );
}

function ProgressRow({
  label,
  values,
  max,
  suffix,
  barClass,
}: {
  label: string;
  values: Array<{
    id: string;
    date: Date;
    value: number | null;
  }>;
  max: number;
  suffix: string;
  barClass: string;
}) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-4">
        <p className="text-sm font-bold text-slate-800">
          {label}
        </p>

        <p className="text-xs text-slate-400">
          {values.length} matje
        </p>
      </div>

      <div className="flex min-w-[520px] items-end gap-2 overflow-hidden rounded-2xl bg-slate-50 px-3 pt-4">
        {values.map(
          (item) => {
            const value =
              item.value ?? 0;

            const height =
              item.value === null
                ? 4
                : Math.max(
                    8,
                    Math.min(
                      100,
                      (value /
                        max) *
                        100
                    )
                  );

            return (
              <div
                key={item.id}
                className="flex min-w-0 flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1 text-[9px] font-semibold text-slate-500">
                  {item.value ===
                  null
                    ? "—"
                    : `${item.value}${suffix}`}
                </span>

                <div className="flex h-32 w-full items-end">
                  <div
                    className={[
                      "w-full rounded-t-lg",
                      barClass,
                    ].join(" ")}
                    style={{
                      height: `${height}%`,
                    }}
                  />
                </div>

                <span className="mt-2 pb-3 text-[9px] text-slate-400">
                  {formatDate(
                    item.date
                  )}
                </span>
              </div>
            );
          }
        )}
      </div>
    </div>
  );
}