"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarPlus,
  Clock3,
  Dumbbell,
  MapPin,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";

import { AppShell } from "@/components/app-shell";

type TeamDetail = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
  description: string | null;
  status: string;

  branch: {
    id: string;
    name: string;
    city: string | null;
  } | null;

  nextMatch: {
    id: string;
    opponentName: string;
    startsAt: string;
    isHome: boolean;
    matchType: string;
    competitionName: string | null;
    location: string | null;

    facility: {
      id: string;
      name: string;
    } | null;
  } | null;

  nextTrainingSession: {
    id: string;
    title: string;
    startsAt: string;
    location: string | null;

    facility: {
      id: string;
      name: string;
    } | null;

    coach: {
      id: string;
      firstName: string;
      lastName: string;
    } | null;
  } | null;

  stats: {
    players: number;
    coaches: number;
    matches: number;
    trainingSessions: number;
  };

  players: Array<{
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    jerseyNumber: number | null;
    status: string;
  }>;

  coaches: Array<{
    id: string;
    firstName: string;
    lastName: string;
    specialization:
      string | null;
    status: string;
    isHeadCoach: boolean;
  }>;
};

const sportLabels:
  Record<string, string> = {
    FOOTBALL: "Futboll",
    BASKETBALL: "Basketboll",
    VOLLEYBALL: "Volejboll",
    TENNIS: "Tenis",
    SWIMMING: "Not",
    HANDBALL: "Hendboll",
    MARTIAL_ARTS:
      "Arte marciale",
    ATHLETICS: "Atletikë",
    OTHER: "Tjetër",
  };

function initials(
  firstName: string,
  lastName: string
) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatDateTime(
  value: string
) {
  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}

export default function TeamDetailClient({
  teamId,
}: {
  teamId: string;
}) {
  const [team, setTeam] =
    useState<TeamDetail | null>(
      null
    );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    let active = true;

    async function loadTeam() {
      setLoading(true);
      setError("");

      try {
        const response =
          await fetch(
            `/api/teams/${teamId}`,
            {
              cache:
                "no-store",
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Ekipi nuk mund të ngarkohet."
          );
        }

        if (active) {
          setTeam(data.team);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Ndodhi një gabim."
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadTeam();

    return () => {
      active = false;
    };
  }, [teamId]);

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
        <Link
          href="/ekipet"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
        >
          <ArrowLeft size={17} />
          Kthehu te ekipet
        </Link>

        {loading ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-500 shadow-sm">
            Duke ngarkuar ekipin...
          </div>
        ) : error ? (
          <div className="rounded-3xl border border-red-200 bg-red-50 p-6 text-sm font-medium text-red-700">
            {error}
          </div>
        ) : team ? (
          <>
            <section className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl sm:p-8">
              <div className="absolute -right-16 -top-20 h-56 w-56 rounded-full bg-blue-500/20 blur-3xl" />
              <div className="absolute -bottom-24 left-1/3 h-48 w-48 rounded-full bg-emerald-500/10 blur-3xl" />

              <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center gap-5">
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-3xl border border-white/10 bg-white/10 text-2xl font-black shadow-inner">
                    {team.ageGroup ||
                      team.name
                        .slice(0, 2)
                        .toUpperCase()}
                  </div>

                  <div>
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-blue-500/15 px-3 py-1 text-xs font-bold text-blue-200">
                        {sportLabels[
                          team.sport
                        ] ||
                          team.sport}
                      </span>

                      <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-bold text-emerald-200">
                        Ekip aktiv
                      </span>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                      {team.name}
                    </h1>

                    <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-300">
                      {team.ageGroup && (
                        <span className="inline-flex items-center gap-2">
                          <ShieldCheck
                            size={16}
                          />
                          Grupmosha{" "}
                          {team.ageGroup}
                        </span>
                      )}

                      {team.branch && (
                        <span className="inline-flex items-center gap-2">
                          <MapPin
                            size={16}
                          />
                          {
                            team.branch
                              .name
                          }
                          {team.branch
                            .city
                            ? ` · ${team.branch.city}`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 backdrop-blur">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
                    Skuadra
                  </p>

                  <p className="mt-1 text-2xl font-black">
                    {
                      team.stats
                        .players
                    }{" "}
                    lojtarë
                  </p>
                </div>
              </div>
            </section>

            <section className="flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-black text-slate-950">
                  Veprime të shpejta
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Planifiko aktivitetin direkt për {team.name}.
                </p>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row">
                <Link
                  href={`/ndeshjet?action=create&teamId=${team.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Trophy size={17} />
                  Planifiko ndeshje
                </Link>

                <Link
                  href={`/seancat?action=create&teamId=${team.id}`}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:bg-blue-50"
                >
                  <CalendarPlus size={17} />
                  Planifiko stërvitje
                </Link>
              </div>
            </section>

            <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                icon={
                  <UsersRound
                    size={20}
                  />
                }
                label="Lojtarë aktivë"
                value={
                  team.stats
                    .players
                }
              />

              <StatCard
                icon={
                  <UserRoundCheck
                    size={20}
                  />
                }
                label="Trajnerë"
                value={
                  team.stats
                    .coaches
                }
              />

              <StatCard
                icon={
                  <Trophy
                    size={20}
                  />
                }
                label="Ndeshje"
                value={
                  team.stats
                    .matches
                }
              />

              <StatCard
                icon={
                  <Dumbbell
                    size={20}
                  />
                }
                label="Stërvitje"
                value={
                  team.stats
                    .trainingSessions
                }
              />
            </section>

            <section className="grid gap-4 lg:grid-cols-2">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                      Ndeshja e ardhshme
                    </p>

                    <h2 className="mt-1 text-lg font-black text-slate-950">
                      Programi i ekipit
                    </h2>
                  </div>

                  <Trophy
                    size={22}
                    className="text-slate-400"
                  />
                </div>

                {team.nextMatch ? (
                  <div className="p-6">
                    <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-slate-400">
                      <span>
                        {team.nextMatch.isHome
                          ? "Në shtëpi"
                          : "Në transfertë"}
                      </span>

                      {team.nextMatch.competitionName && (
                        <>
                          <span>•</span>
                          <span>
                            {team.nextMatch.competitionName}
                          </span>
                        </>
                      )}
                    </div>

                    <p className="mt-4 text-xl font-black text-slate-950">
                      {team.nextMatch.isHome
                        ? `${team.name} vs ${team.nextMatch.opponentName}`
                        : `${team.nextMatch.opponentName} vs ${team.name}`}
                    </p>

                    <div className="mt-5 space-y-2 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <Clock3 size={16} />
                        {formatDateTime(team.nextMatch.startsAt)}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        {team.nextMatch.facility?.name ||
                          team.nextMatch.location ||
                          "Vendi nuk është përcaktuar"}
                      </p>
                    </div>

                    <Link
                      href="/ndeshjet"
                      className="mt-6 inline-flex items-center text-sm font-bold text-blue-700 hover:text-blue-800"
                    >
                      Shiko ndeshjet →
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="font-bold text-slate-700">
                      Nuk ka ndeshje të planifikuar.
                    </p>

                    <Link
                      href={`/ndeshjet?action=create&teamId=${team.id}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-2.5 text-sm font-bold text-blue-700 hover:bg-blue-100"
                    >
                      <CalendarPlus size={16} />
                      Planifiko ndeshje
                    </Link>
                  </div>
                )}
              </div>

              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                      Stërvitja e ardhshme
                    </p>

                    <h2 className="mt-1 text-lg font-black text-slate-950">
                      Seanca e radhës
                    </h2>
                  </div>

                  <Dumbbell
                    size={22}
                    className="text-slate-400"
                  />
                </div>

                {team.nextTrainingSession ? (
                  <div className="p-6">
                    <p className="text-xl font-black text-slate-950">
                      {team.nextTrainingSession.title}
                    </p>

                    <div className="mt-5 space-y-2 text-sm text-slate-500">
                      <p className="flex items-center gap-2">
                        <Clock3 size={16} />
                        {formatDateTime(
                          team.nextTrainingSession.startsAt
                        )}
                      </p>

                      <p className="flex items-center gap-2">
                        <MapPin size={16} />
                        {team.nextTrainingSession.facility?.name ||
                          team.nextTrainingSession.location ||
                          "Vendi nuk është përcaktuar"}
                      </p>

                      {team.nextTrainingSession.coach && (
                        <p className="flex items-center gap-2">
                          <UserRoundCheck size={16} />
                          {team.nextTrainingSession.coach.firstName}{" "}
                          {team.nextTrainingSession.coach.lastName}
                        </p>
                      )}
                    </div>

                    <Link
                      href="/seancat"
                      className="mt-6 inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800"
                    >
                      Shiko stërvitjet →
                    </Link>
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="font-bold text-slate-700">
                      Nuk ka stërvitje të planifikuar.
                    </p>

                    <Link
                      href={`/seancat?action=create&teamId=${team.id}`}
                      className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-2.5 text-sm font-bold text-emerald-700 hover:bg-emerald-100"
                    >
                      <CalendarPlus size={16} />
                      Planifiko stërvitje
                    </Link>
                  </div>
                )}
              </div>
            </section>

            {team.description && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-slate-400">
                  Rreth ekipit
                </p>

                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600">
                  {
                    team.description
                  }
                </p>
              </section>
            )}

            <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                  <div>
                    <h2 className="text-lg font-black text-slate-950">
                      Skuadra
                    </h2>

                    <p className="mt-1 text-sm text-slate-500">
                      Lojtarët aktivë të{" "}
                      {team.name}
                    </p>
                  </div>

                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                    {
                      team.players
                        .length
                    }{" "}
                    lojtarë
                  </span>
                </div>

                {team.players
                  .length === 0 ? (
                  <div className="p-10 text-center text-sm text-slate-500">
                    Ende nuk ka
                    lojtarë në këtë
                    ekip.
                  </div>
                ) : (
                  <div className="grid gap-3 p-5 sm:grid-cols-2">
                    {team.players.map(
                      (player) => (
                        <div
                          key={
                            player.id
                          }
                          className="flex items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-100 hover:bg-blue-50/40"
                        >
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                            {initials(
                              player.firstName,
                              player.lastName
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-950">
                              {
                                player.firstName
                              }{" "}
                              {
                                player.lastName
                              }
                            </p>

                            <p className="mt-1 truncate text-xs font-medium text-slate-500">
                              {player.jerseyNumber !==
                              null
                                ? `#${player.jerseyNumber} · `
                                : ""}
                              {player.position ||
                                "Pa pozicion"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>

              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-6 py-5">
                  <h2 className="text-lg font-black text-slate-950">
                    Stafi teknik
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Trajnerët e ekipit
                  </p>
                </div>

                {team.coaches
                  .length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Ende nuk ka
                    trajner të caktuar.
                  </div>
                ) : (
                  <div className="space-y-3 p-5">
                    {team.coaches.map(
                      (coach) => (
                        <div
                          key={
                            coach.id
                          }
                          className="flex items-center gap-4 rounded-2xl border border-slate-100 p-4"
                        >
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50 text-xs font-black text-blue-700">
                            {initials(
                              coach.firstName,
                              coach.lastName
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="truncate font-bold text-slate-950">
                                {
                                  coach.firstName
                                }{" "}
                                {
                                  coach.lastName
                                }
                              </p>

                              {coach.isHeadCoach && (
                                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-amber-700">
                                  Kryetrajner
                                </span>
                              )}
                            </div>

                            <p className="mt-1 truncate text-xs text-slate-500">
                              {coach.specialization ||
                                "Trajner"}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </section>
            </div>
          </>
        ) : null}
      </div>
    </AppShell>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
          {icon}
        </div>

        <span className="text-2xl font-black text-slate-950">
          {value}
        </span>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-500">
        {label}
      </p>
    </div>
  );
}