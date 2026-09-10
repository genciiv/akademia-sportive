"use client";

import Link from "next/link";

import {
  CalendarDays,
  ChevronRight,
  MapPin,
} from "lucide-react";

import { AppShell } from "./app-shell";
import {
  AttendanceChart,
  PerformanceChart,
} from "./dashboard-charts";
import { Panel, StatCard } from "./ui";

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
  return (
    <AppShell>
      <div className="mb-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Përshëndetje, {userName}!
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Ja një përmbledhje e akademisë dhe aktiviteteve të ardhshme.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-slate-400">
              Akademia aktive
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-900">
              {academyName}
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              Roli: {perkthimRoli(role)}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Ushtrimet e akademisë"
          value={String(stats.drills)}
          hint="Të dhëna reale"
          accent
        />

        <StatCard
          title="Seancat"
          value={String(stats.sessions)}
          hint="Të dhëna reale"
          accent
        />

        <StatCard
          title="Sportistët aktivë"
          value={String(stats.players)}
          hint="Të dhëna reale"
          accent
        />

        <StatCard
          title="Trajnerët aktivë"
          value={String(stats.coaches)}
          hint="Të dhëna reale"
          accent
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <Panel title="Aktivitetet e ardhshme">
          {activities.length === 0 ? (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <CalendarDays className="h-8 w-8 text-slate-300" />

              <p className="mt-3 text-sm font-semibold text-slate-600">
                Nuk ka aktivitete të ardhshme.
              </p>

              <p className="mt-1 text-xs text-slate-400">
                Seancat dhe ndeshjet e reja do të shfaqen këtu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((activity) => (
                <Link
                  key={`${activity.type}-${activity.id}`}
                  href={
                    activity.type === "MATCH"
                      ? "/ndeshjet"
                      : "/seancat"
                  }
                  className="block py-4 first:pt-0 last:pb-0"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div
                        className={
                          activity.type === "MATCH"
                            ? "inline-flex rounded-md bg-lime-100 px-2 py-1 text-[10px] font-bold text-lime-700"
                            : "inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700"
                        }
                      >
                        {activity.type === "MATCH"
                          ? "Ndeshje"
                          : "Seancë stërvitore"}{" "}
                        · {activity.teamName}
                      </div>

                      <p className="mt-2 text-[15px] font-bold text-slate-950">
                        {activity.title}
                      </p>

                      <p className="mt-1 text-xs font-semibold text-slate-700">
                        {dataDheOra(activity.startsAt)}
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                        {activity.endsAt ? (
                          <>
                            <span>
                              {ora(activity.startsAt)}–{ora(activity.endsAt)}
                            </span>

                            <span>•</span>
                          </>
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
                          <>
                            <span>•</span>
                            <span className="font-semibold text-amber-600">
                              E shtyrë
                            </span>
                          </>
                        ) : null}
                      </div>
                    </div>

                    <ChevronRight className="mt-2 h-4 w-4 shrink-0 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <Link
            href="/kalendari"
            className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-700"
          >
            Shiko kalendarin
            <ChevronRight size={14} />
          </Link>
        </Panel>

        <div className="space-y-5">
          <Panel
            title="Vlerësimi në ndeshje"
            subtitle="Deri në 10 ndeshjet e fundit"
          >
            <PerformanceChart
              data={chartData.performance}
            />
          </Panel>

          <Panel
            title="Pjesëmarrja në stërvitje"
            subtitle="Deri në 10 seancat e fundit"
          >
            <AttendanceChart
              data={chartData.attendance}
            />
          </Panel>
        </div>
      </div>
    </AppShell>
  );
}