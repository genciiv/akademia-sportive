"use client";

import Link from "next/link";

import {
  Activity,
  CalendarCheck2,
  CalendarDays,
  ChevronRight,
  Dumbbell,
  MapPin,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
} from "lucide-react";

import { AppShell } from "./app-shell";
import {
  AttendanceChart,
  PerformanceChart,
} from "./dashboard-charts";

type Activity = {
  id: string;
  type: "TRAINING" | "MATCH";
  title: string;
  teamName: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  status: string;
};

type DashboardProps = {
  academyName: string;
  userName: string;
  role: string;

  stats: {
    drills: number;
    sessions: number;
    players: number;
    coaches: number;
  };

  chartData: {
    performance: {
      emri: string;
      vlera: number;
    }[];

    attendance: {
      emri: string;
      prezent: number;
      mungon: number;
    }[];
  };

  activities: Activity[];
};

const DITET = [
  "E diel",
  "E hënë",
  "E martë",
  "E mërkurë",
  "E enjte",
  "E premte",
  "E shtunë",
];

const MUAJT = [
  "Janar",
  "Shkurt",
  "Mars",
  "Prill",
  "Maj",
  "Qershor",
  "Korrik",
  "Gusht",
  "Shtator",
  "Tetor",
  "Nëntor",
  "Dhjetor",
];

function perkthimRoli(role: string) {
  const rolet: Record<string, string> = {
    OWNER: "Pronar",
    ADMIN: "Administrator",
    SPORTS_DIRECTOR: "Drejtor sportiv",
    HEAD_COACH: "Kryetrajner",
    COACH: "Trajner",
    ASSISTANT_COACH: "Ndihmës trajner",
    FINANCE: "Financë",
    RECEPTIONIST: "Recepsion",
    MEMBER: "Anëtar",
  };

  return rolet[role] || role;
}

function dataDheOra(value: string) {
  const date = new Date(value);

  const ora = String(
    date.getHours()
  ).padStart(2, "0");

  const minuta = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${DITET[date.getDay()]}, ${date.getDate()} ${
    MUAJT[date.getMonth()]
  }, ${ora}:${minuta}`;
}

function ora(value: string) {
  const date = new Date(value);

  return `${String(
    date.getHours()
  ).padStart(2, "0")}:${String(
    date.getMinutes()
  ).padStart(2, "0")}`;
}

export function Dashboard({
  academyName,
  userName,
  role,
  stats,
  chartData,
  activities,
}: DashboardProps) {
  const performanceAverage =
    chartData.performance.length === 0
      ? null
      : chartData.performance.reduce(
          (total, item) => total + item.vlera,
          0,
        ) / chartData.performance.length;

  const attendanceTotals =
    chartData.attendance.reduce(
      (totals, item) => ({
        present: totals.present + item.prezent,
        absent: totals.absent + item.mungon,
      }),
      {
        present: 0,
        absent: 0,
      },
    );

  const attendanceTotal =
    attendanceTotals.present + attendanceTotals.absent;

  const attendanceRate =
    attendanceTotal === 0
      ? null
      : Math.round(
          (attendanceTotals.present / attendanceTotal) * 100,
        );

  const upcomingMatchCount =
    activities.filter(
      (activity) => activity.type === "MATCH",
    ).length;

  const upcomingTrainingCount =
    activities.filter(
      (activity) => activity.type === "TRAINING",
    ).length;
  return (
    <AppShell>
      <section className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 px-5 py-6 shadow-sm sm:px-7 sm:py-7">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-blue-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-violet-200/25 blur-3xl" />

        <div className="relative flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-xs font-semibold text-blue-700 shadow-sm backdrop-blur">
              <Sparkles className="h-3.5 w-3.5" />
              Qendra e menaxhimit
            </div>

            <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Përshëndetje, {userName}!
            </h1>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-600 sm:text-[15px]">
              Ndiq aktivitetin, sportistët dhe performancën e akademisë nga një pamje e vetme.
            </p>
          </div>

          <div className="min-w-0 rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur sm:min-w-[260px]">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Akademia aktive
            </p>

            <p className="mt-2 truncate text-base font-bold text-slate-950">
              {academyName}
            </p>

            <div className="mt-3 flex items-center gap-2">
              <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                Aktive
              </span>

              <span className="text-xs font-medium text-slate-500">
                {perkthimRoli(role)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-700">
                Ushtrimet e akademisë
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {stats.drills}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Ushtrime të disponueshme
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-sm shadow-blue-200">
              <Dumbbell className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-violet-100 bg-violet-50/70 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-violet-700">
                Seancat
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {stats.sessions}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Seanca të regjistruara
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
              <Activity className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-emerald-100 bg-emerald-50/70 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-emerald-700">
                Sportistët aktivë
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {stats.players}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Sportistë në aktivitet
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-sm shadow-emerald-200">
              <Users className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-amber-700">
                Trajnerët aktivë
              </p>

              <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                {stats.coaches}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Staf teknik aktiv
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-white shadow-sm shadow-amber-200">
              <UserRound className="h-5 w-5" />
            </div>
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <div className="self-start overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 via-white to-cyan-50/60 px-5 py-4 sm:px-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-blue-600">
                  Axhenda
                </p>

                <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
                  Aktivitetet e ardhshme
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Seancat dhe ndeshjet më të afërta të akademisë.
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {activities.length === 0 ? (
              <div className="flex min-h-[240px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 px-6 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
                  <CalendarDays className="h-5 w-5" />
                </div>

                <p className="mt-4 text-sm font-bold text-slate-700">
                  Nuk ka aktivitete të ardhshme
                </p>

                <p className="mt-1 max-w-xs text-xs leading-5 text-slate-400">
                  Seancat dhe ndeshjet e reja do të shfaqen automatikisht këtu.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity) => (
                  <Link
                    key={`${activity.type}-${activity.id}`}
                    href={
                      activity.type === "MATCH"
                        ? "/ndeshjet"
                        : "/seancat"
                    }
                    className="group block rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition hover:border-blue-100 hover:bg-blue-50/50 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={
                              activity.type === "MATCH"
                                ? "inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-700"
                                : "inline-flex rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700"
                            }
                          >
                            {activity.type === "MATCH"
                              ? "Ndeshje"
                              : "Seancë stërvitore"}
                          </span>

                          <span className="text-xs font-semibold text-slate-400">
                            {activity.teamName}
                          </span>
                        </div>

                        <p className="mt-3 truncate text-[15px] font-bold text-slate-950">
                          {activity.title}
                        </p>

                        <p className="mt-1.5 text-xs font-semibold text-slate-600">
                          {dataDheOra(activity.startsAt)}
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                          {activity.endsAt ? (
                            <span>
                              {ora(activity.startsAt)} – {ora(activity.endsAt)}
                            </span>
                          ) : null}

                          {activity.location ? (
                            <span className="flex items-center gap-1">
                              <MapPin size={11} />
                              {activity.location}
                            </span>
                          ) : (
                            <span>Vendndodhja nuk është përcaktuar</span>
                          )}

                          {activity.status === "POSTPONED" ? (
                            <span className="font-semibold text-amber-600">
                              E shtyrë
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-400 shadow-sm transition group-hover:text-blue-600">
                        <ChevronRight className="h-4 w-4" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            <Link
              href="/kalendari"
              className="mt-5 inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 transition hover:text-blue-800"
            >
              Shiko kalendarin
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>

        <div className="space-y-5">
          <div className="overflow-hidden rounded-[24px] border border-violet-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-violet-100 bg-violet-50/60 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-violet-600">
                  Performanca
                </p>

                <h2 className="mt-1 text-base font-bold text-slate-950">
                  Vlerësimi në ndeshje
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Deri në 10 ndeshjet e fundit
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <PerformanceChart data={chartData.performance} />
            </div>
          </div>

          <div className="overflow-hidden rounded-[24px] border border-emerald-100 bg-white shadow-sm">
            <div className="flex items-center justify-between gap-4 border-b border-emerald-100 bg-emerald-50/60 px-5 py-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-600">
                  Prezenca
                </p>

                <h2 className="mt-1 text-base font-bold text-slate-950">
                  Pjesëmarrja në stërvitje
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  Deri në 10 seancat e fundit
                </p>
              </div>
            </div>

            <div className="p-4 sm:p-5">
              <AttendanceChart data={chartData.attendance} />
            </div>
          </div>
        </div>
      </section>
      <section className="mt-5">
        <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-400">
              Përmbledhje operative
            </p>

            <h2 className="mt-1 text-lg font-bold tracking-tight text-slate-950">
              Tregues të shpejtë
            </h2>
          </div>

          <p className="text-xs text-slate-400">
            Bazuar në të dhënat më të fundit të dashboard-it.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-violet-700">
                  Mesatarja e performancës
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {performanceAverage === null
                    ? "—"
                    : performanceAverage.toFixed(1)}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Nga ndeshjet me vlerësim
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-emerald-700">
                  Prezenca e fundit
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {attendanceRate === null
                    ? "—"
                    : `${attendanceRate}%`}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Nga seancat me prezencë
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700">
                <CalendarCheck2 className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-amber-700">
                  Ndeshje të ardhshme
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {upcomingMatchCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Në axhendën e afërt
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <CalendarDays className="h-5 w-5" />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  Seanca të ardhshme
                </p>

                <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
                  {upcomingTrainingCount}
                </p>

                <p className="mt-1 text-xs text-slate-500">
                  Në axhendën e afërt
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Activity className="h-5 w-5" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </AppShell>
  );
}