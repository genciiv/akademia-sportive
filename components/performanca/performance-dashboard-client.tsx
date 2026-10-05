"use client";

import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/app-shell";
import {
  Activity,
  BarChart3,
  CalendarDays,
  ChevronRight,
  CircleDot,
  Crosshair,
  Filter,
  Goal,
  Loader2,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Timer,
  Trophy,
  UsersRound,
  X,
} from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Team = {
  id: string;
  name: string;
  sport: string;
};

type PerformanceHistory = {
  matchId: string;
  opponentName: string;
  startsAt: string;
  isHome: boolean;

  team: {
    id: string;
    name: string;
  };

  score: {
    our: number | null;
    opponent: number | null;
  };

  role: "STARTER" | "SUBSTITUTE";
  minutesPlayed: number;

  goals: number;
  assists: number;

  performance: {
    shots: number;
    shotsOnTarget: number;

    passesAttempted: number;
    passesCompleted: number;
    passAccuracy: number;

    dribblesAttempted: number;
    dribblesCompleted: number;
    dribbleAccuracy: number;

    duelsWon: number;

    tackles: number;
    interceptions: number;

    foulsCommitted: number;
    foulsWon: number;

    coachRating: number | null;
    coachNotes: string | null;
  } | null;
};

type PerformancePlayer = {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    jerseyNumber: number | null;
    photo: string | null;
    status: string;
  };

  summary: {
    matches: number;
    starts: number;
    minutesPlayed: number;

    goals: number;
    assists: number;

    averageRating: number | null;

    shots: number;
    shotsOnTarget: number;
    shotAccuracy: number;

    passesAttempted: number;
    passesCompleted: number;
    passAccuracy: number;

    dribblesAttempted: number;
    dribblesCompleted: number;
    dribbleAccuracy: number;

    duelsWon: number;

    tackles: number;
    interceptions: number;

    foulsCommitted: number;
    foulsWon: number;
  };

  history: PerformanceHistory[];
};

type PerformanceResponse = {
  filters: {
    teamId: string | null;
    playerId: string | null;
    from: string | null;
    to: string | null;
  };

  teams: Team[];

  summary: {
    players: number;
    matches: number;
    minutesPlayed: number;
    goals: number;
    assists: number;
    averageRating: number | null;
  };

  players: PerformancePlayer[];
};

const DITET_SHQIP = [
  "Die",
  "Hën",
  "Mar",
  "Mër",
  "Enj",
  "Pre",
  "Sht",
];

const MUAJT_SHQIP = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

function formatoDaten(value: string) {
  const date = new Date(value);

  return `${DITET_SHQIP[date.getDay()]}, ${date.getDate()} ${
    MUAJT_SHQIP[date.getMonth()]
  } ${date.getFullYear()}`;
}

function inicialet(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function PerformanceDashboardClient() {
  const [data, setData] =
    useState<PerformanceResponse | null>(null);

  const [dukeNgarkuar, setDukeNgarkuar] =
    useState(true);

  const [gabimi, setGabimi] =
    useState("");

  const [kerkim, setKerkim] =
    useState("");

  const [teamId, setTeamId] =
    useState("");

  const [from, setFrom] =
    useState("");

  const [to, setTo] =
    useState("");

  const [sportistiAktiv, setSportistiAktiv] =
    useState<PerformancePlayer | null>(null);

  async function merrPerformancen() {
    setDukeNgarkuar(true);
    setGabimi("");

    try {
      const params =
        new URLSearchParams();

      if (teamId) {
        params.set("teamId", teamId);
      }

      if (from) {
        params.set("from", from);
      }

      if (to) {
        params.set("to", to);
      }

      const query =
        params.toString();

      const response =
        await fetch(
          `/api/performance${
            query ? `?${query}` : ""
          }`,
          {
            cache: "no-store",
          }
        );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Nuk u arrit të merrej performanca."
        );
      }

      setData(result);
    } catch (error) {
      setGabimi(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setDukeNgarkuar(false);
    }
  }

  useEffect(() => {
    void merrPerformancen();
  }, [teamId, from, to]);

  const sportistetEFiltruar =
    useMemo(() => {
      if (!data) {
        return [];
      }

      const term =
        kerkim.trim().toLowerCase();

      if (!term) {
        return data.players;
      }

      return data.players.filter(
        (item) => {
          const fullName =
            `${item.player.firstName} ${item.player.lastName}`.toLowerCase();

          const position =
            item.player.position?.toLowerCase() ||
            "";

          return (
            fullName.includes(term) ||
            position.includes(term)
          );
        }
      );
    }, [data, kerkim]);

  const renditja =
    useMemo(() => {
      return [...sportistetEFiltruar].sort(
        (a, b) => {
          const ratingA =
            a.summary.averageRating ?? -1;

          const ratingB =
            b.summary.averageRating ?? -1;

          return ratingB - ratingA;
        }
      );
    }, [sportistetEFiltruar]);

  function pastroFiltrat() {
    setTeamId("");
    setFrom("");
    setTo("");
    setKerkim("");
  }

  return (
    <AppShell>
      <div className="space-y-5">
        <section className="relative overflow-hidden rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-blue-50/70 to-cyan-50 p-5 shadow-sm sm:p-6">
          <div className="absolute -right-16 -top-16 h-52 w-52 rounded-full bg-indigo-200/30 blur-3xl" />

          <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-indigo-600 shadow-sm ring-1 ring-indigo-100">
                <BarChart3 size={23} />
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-indigo-600">
                  Analiza sportive
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                  Performanca
                </h1>

                <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                  Ndiq performancën individuale të sportistëve, progresin ndeshje pas ndeshjeje dhe statistikat teknike të ekipit.
                </p>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-indigo-100 bg-white px-4 py-3 text-sm font-bold text-indigo-700 shadow-sm">
              <Sparkles size={16} />
              Të dhëna nga ndeshjet
            </div>
          </div>
        </section>

      {gabimi && (
        <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 shadow-sm">
          {gabimi}
        </div>
      )}

      <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end">
          <div className="min-w-0 flex-1">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Kërko sportist
            </label>

            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={kerkim}
                onChange={(event) =>
                  setKerkim(
                    event.target.value
                  )
                }
                placeholder="Emri ose pozicioni..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-10 pr-4 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
              />
            </div>
          </div>

          <div className="w-full xl:w-60">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Ekipi
            </label>

            <select
              value={teamId}
              onChange={(event) =>
                setTeamId(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            >
              <option value="">
                Të gjitha ekipet
              </option>

              {data?.teams.map((team) => (
                <option
                  key={team.id}
                  value={team.id}
                >
                  {team.name}
                </option>
              ))}
            </select>
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Nga data
            </label>

            <input
              type="date"
              value={from}
              onChange={(event) =>
                setFrom(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <div className="w-full sm:w-auto">
            <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-slate-500">
              Deri më
            </label>

            <input
              type="date"
              value={to}
              onChange={(event) =>
                setTo(
                  event.target.value
                )
              }
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>

          <button
            type="button"
            onClick={pastroFiltrat}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
          >
            <Filter size={16} />
            Pastro filtrat
          </button>
        </div>
      </div>

      {dukeNgarkuar ? (
        <div className="flex min-h-[360px] items-center justify-center rounded-[24px] border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm font-medium text-slate-500">
            <Loader2
              size={20}
              className="animate-spin"
            />
            Duke ngarkuar performancën...
          </div>
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <KartePermbledhese
              ikona={UsersRound}
              etiketa="Sportistë"
              tone="indigo"
              vlera={
                data?.summary.players ?? 0
              }
              pershkrimi="Me paraqitje në ndeshje"
            />

            <KartePermbledhese
              ikona={Trophy}
              etiketa="Ndeshje"
              tone="blue"
              vlera={
                data?.summary.matches ?? 0
              }
              pershkrimi="Ndeshje të analizuara"
            />

            <KartePermbledhese
              ikona={Timer}
              etiketa="Minuta"
              tone="cyan"
              vlera={
                data?.summary.minutesPlayed ?? 0
              }
              pershkrimi="Minuta të luajtura"
            />

            <KartePermbledhese
              ikona={Goal}
              etiketa="Gola"
              tone="emerald"
              vlera={
                data?.summary.goals ?? 0
              }
              pershkrimi="Nga sportistët"
            />

            <KartePermbledhese
              ikona={Target}
              etiketa="Asistime"
              tone="violet"
              vlera={
                data?.summary.assists ?? 0
              }
              pershkrimi="Nga sportistët"
            />

            <KartePermbledhese
              ikona={Star}
              etiketa="Nota mesatare"
              tone="amber"
              vlera={
                data?.summary.averageRating ===
                null ||
                data?.summary.averageRating ===
                  undefined
                  ? "—"
                  : data.summary.averageRating
              }
              pershkrimi="Vlerësim i trajnerit"
            />
          </div>

          <div className="grid gap-6 2xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
                <div>
                  <h2 className="font-bold text-slate-950">
                    Performanca e sportistëve
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    {sportistetEFiltruar.length} sportistë
                    sipas filtrave aktualë.
                  </p>
                </div>
              </div>

              {sportistetEFiltruar.length ===
              0 ? (
                <div className="px-6 py-16 text-center">
                  <Activity
                    size={36}
                    className="mx-auto text-slate-300"
                  />

                  <h3 className="mt-4 font-semibold text-slate-900">
                    Nuk ka të dhëna performance
                  </h3>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                    Regjistro performancën e sportistëve
                    në ndeshjet e përfunduara ose ndrysho
                    filtrat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3 bg-slate-50/40 p-3 sm:p-4">
                  {sportistetEFiltruar.map(
                    (item) => (
                      <button
                        key={
                          item.player.id
                        }
                        type="button"
                        onClick={() =>
                          setSportistiAktiv(
                            item
                          )
                        }
                        className="grid w-full gap-4 rounded-[20px] border border-slate-200 bg-white p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-md sm:p-5 lg:grid-cols-[minmax(240px,1.4fr)_repeat(5,minmax(90px,0.55fr))_40px] lg:items-center"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <AvatarSportisti
                            player={
                              item.player
                            }
                          />

                          <div className="min-w-0">
                            <p className="truncate font-bold text-slate-950">
                              {
                                item.player
                                  .firstName
                              }{" "}
                              {
                                item.player
                                  .lastName
                              }
                            </p>

                            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                              <span>
                                {item.player
                                  .position ||
                                  "Pa pozicion"}
                              </span>

                              {item.player
                                .jerseyNumber !==
                                null && (
                                <>
                                  <span>•</span>
                                  <span>
                                    Nr.{" "}
                                    {
                                      item.player
                                        .jerseyNumber
                                    }
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        <StatistikeListe
                          etiketa="Ndeshje"
                          vlera={
                            item.summary
                              .matches
                          }
                        />

                        <StatistikeListe
                          etiketa="Minuta"
                          vlera={
                            item.summary
                              .minutesPlayed
                          }
                        />

                        <StatistikeListe
                          etiketa="Gola"
                          vlera={
                            item.summary.goals
                          }
                        />

                        <StatistikeListe
                          etiketa="Pasime"
                          vlera={`${item.summary.passAccuracy}%`}
                        />

                        <StatistikeListe
                          etiketa="Nota"
                          vlera={
                            item.summary
                              .averageRating ??
                            "—"
                          }
                          theksuar
                        />

                        <ChevronRight
                          size={20}
                          className="hidden text-indigo-400 lg:block"
                        />
                      </button>
                    )
                  )}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-amber-100 bg-gradient-to-br from-white to-amber-50/50 p-5 shadow-sm sm:p-6">
              <div className="flex items-center gap-2">
                <Trophy
                  size={18}
                  className="text-amber-600"
                />

                <h2 className="font-bold text-slate-950">
                  Renditja sipas notës
                </h2>
              </div>

              <p className="mt-1 text-sm text-slate-500">
                Sportistët me mesataren më të lartë.
              </p>

              <div className="mt-5 space-y-3">
                {renditja
                  .slice(0, 5)
                  .map(
                    (item, index) => (
                      <button
                        type="button"
                        key={
                          item.player.id
                        }
                        onClick={() =>
                          setSportistiAktiv(
                            item
                          )
                        }
                        className="flex w-full items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-amber-200 hover:bg-amber-50/50"
                      >
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xs font-black text-amber-700">
                          {index + 1}
                        </div>

                        <AvatarSportisti
                          player={
                            item.player
                          }
                          iVogel
                        />

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {
                              item.player
                                .firstName
                            }{" "}
                            {
                              item.player
                                .lastName
                            }
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {
                              item.summary
                                .matches
                            }{" "}
                            ndeshje
                          </p>
                        </div>

                        <div className="flex items-center gap-1 rounded-xl bg-amber-50 px-2.5 py-1.5 text-sm font-bold text-amber-700">
                          <Star
                            size={14}
                            fill="currentColor"
                          />
                          {item.summary
                            .averageRating ??
                            "—"}
                        </div>
                      </button>
                    )
                  )}

                {renditja.length === 0 && (
                  <div className="py-8 text-center text-sm text-slate-500">
                    Nuk ka ende renditje.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {sportistiAktiv && (
        <DetajetESportistit
          item={sportistiAktiv}
          onClose={() =>
            setSportistiAktiv(null)
          }
        />
      )}
      </div>
    </AppShell>
  );
}

function KartePermbledhese({
  ikona: Icon,
  etiketa,
  vlera,
  pershkrimi,
  tone,
}: {
  ikona: typeof Activity;
  etiketa: string;
  vlera: string | number;
  pershkrimi: string;
  tone:
    | "indigo"
    | "blue"
    | "cyan"
    | "emerald"
    | "violet"
    | "amber";
}) {
  const tones = {
    indigo: {
      card: "border-indigo-100 bg-indigo-50/70",
      icon: "text-indigo-600 ring-indigo-100",
    },
    blue: {
      card: "border-blue-100 bg-blue-50/70",
      icon: "text-blue-600 ring-blue-100",
    },
    cyan: {
      card: "border-cyan-100 bg-cyan-50/70",
      icon: "text-cyan-600 ring-cyan-100",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50/70",
      icon: "text-emerald-600 ring-emerald-100",
    },
    violet: {
      card: "border-violet-100 bg-violet-50/70",
      icon: "text-violet-600 ring-violet-100",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/70",
      icon: "text-amber-600 ring-amber-100",
    },
  } as const;

  const style = tones[tone];

  return (
    <div
      className={`rounded-[22px] border p-5 shadow-sm ${style.card}`}
    >
      <div
        className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ${style.icon}`}
      >
        <Icon size={19} />
      </div>

      <p className="mt-4 text-2xl font-black text-slate-950">
        {vlera}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-800">
        {etiketa}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {pershkrimi}
      </p>
    </div>
  );
}

function StatistikeListe({
  etiketa,
  vlera,
  theksuar = false,
}: {
  etiketa: string;
  vlera: string | number;
  theksuar?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {etiketa}
      </p>

      <p
        className={`mt-1 text-sm font-bold ${
          theksuar
            ? "text-blue-600"
            : "text-slate-900"
        }`}
      >
        {vlera}
      </p>
    </div>
  );
}

function AvatarSportisti({
  player,
  iVogel = false,
}: {
  player: PerformancePlayer["player"];
  iVogel?: boolean;
}) {
  const madhesia =
    iVogel
      ? "h-9 w-9"
      : "h-11 w-11";

  if (player.photo) {
    return (
      <img
        src={player.photo}
        alt={`${player.firstName} ${player.lastName}`}
        className={`${madhesia} shrink-0 rounded-xl object-cover`}
      />
    );
  }

  return (
    <div
      className={`${madhesia} flex shrink-0 items-center justify-center rounded-xl bg-slate-900 text-xs font-bold text-white`}
    >
      {inicialet(
        player.firstName,
        player.lastName
      )}
    </div>
  );
}

function DetajetESportistit({
  item,
  onClose,
}: {
  item: PerformancePlayer;
  onClose: () => void;
}) {
  const grafiku =
    item.history
      .filter(
        (match) =>
          match.performance
            ?.coachRating !== null &&
          match.performance
            ?.coachRating !== undefined
      )
      .map((match) => ({
        data:
          formatoDaten(
            match.startsAt
          ).split(",")[1]?.trim() ||
          formatoDaten(match.startsAt),

        nota:
          match.performance
            ?.coachRating ?? null,
      }));

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-[2px]">
      <div className="absolute inset-y-0 right-0 grid h-screen w-full max-w-4xl grid-rows-[auto_minmax(0,1fr)] bg-[#f7f8fb] shadow-2xl">
        <div className="border-b border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-cyan-50 px-5 py-5 sm:px-7">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
              <AvatarSportisti
                player={item.player}
              />

              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
                  Detajet e performancës
                </p>

                <h2 className="mt-1 truncate text-xl font-bold text-slate-950">
                  {
                    item.player
                      .firstName
                  }{" "}
                  {
                    item.player
                      .lastName
                  }
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {item.player
                    .position ||
                    "Pa pozicion"}{" "}
                  •{" "}
                  {
                    item.summary
                      .matches
                  }{" "}
                  ndeshje
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
              aria-label="Mbyll"
            >
              <X size={21} />
            </button>
          </div>
        </div>

        <div className="min-h-0 overflow-y-auto p-5 sm:p-7">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <KutiDetaji
              ikona={Star}
              etiketa="Nota mesatare"
              tone="amber"
              vlera={
                item.summary
                  .averageRating ??
                "—"
              }
            />

            <KutiDetaji
              ikona={Timer}
              etiketa="Minuta"
              tone="cyan"
              vlera={
                item.summary
                  .minutesPlayed
              }
            />

            <KutiDetaji
              ikona={Goal}
              etiketa="Gola"
              tone="emerald"
              vlera={
                item.summary.goals
              }
            />

            <KutiDetaji
              ikona={Target}
              etiketa="Asistime"
              tone="violet"
              vlera={
                item.summary.assists
              }
            />
          </div>

          <div className="mt-6 rounded-[22px] border border-indigo-100 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <BarChart3
                size={18}
                className="text-indigo-600"
              />

              <h3 className="font-bold text-slate-950">
                Statistikat teknike
              </h3>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
              <Metrike
                etiketa="Goditje"
                vlera={
                  item.summary.shots
                }
              />

              <Metrike
                etiketa="Në portë"
                vlera={
                  item.summary
                    .shotsOnTarget
                }
              />

              <Metrike
                etiketa="Saktësi goditjesh"
                vlera={`${item.summary.shotAccuracy}%`}
              />

              <Metrike
                etiketa="Pasime të sakta"
                vlera={`${item.summary.passesCompleted}/${item.summary.passesAttempted}`}
              />

              <Metrike
                etiketa="Saktësi pasimesh"
                vlera={`${item.summary.passAccuracy}%`}
              />

              <Metrike
                etiketa="Driblime"
                vlera={`${item.summary.dribblesCompleted}/${item.summary.dribblesAttempted}`}
              />

              <Metrike
                etiketa="Saktësi driblimesh"
                vlera={`${item.summary.dribbleAccuracy}%`}
              />

              <Metrike
                etiketa="Duele të fituara"
                vlera={
                  item.summary
                    .duelsWon
                }
              />

              <Metrike
                etiketa="Ndërhyrje"
                vlera={
                  item.summary
                    .tackles
                }
              />

              <Metrike
                etiketa="Interceptime"
                vlera={
                  item.summary
                    .interceptions
                }
              />

              <Metrike
                etiketa="Faulle të kryera"
                vlera={
                  item.summary
                    .foulsCommitted
                }
              />

              <Metrike
                etiketa="Faulle të fituara"
                vlera={
                  item.summary
                    .foulsWon
                }
              />

              <Metrike
                etiketa="Titullar"
                vlera={
                  item.summary.starts
                }
              />
            </div>
          </div>

          <div className="mt-6 rounded-[22px] border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-2">
              <Activity
                size={18}
                className="text-violet-600"
              />

              <h3 className="font-bold text-slate-950">
                Progresi i vlerësimit
              </h3>
            </div>

            {grafiku.length > 0 ? (
              <div className="mt-5 h-[260px]">
                <ResponsiveContainer
                  width="100%"
                  height="100%"
                >
                  <LineChart
                    data={grafiku}
                    margin={{
                      top: 10,
                      right: 10,
                      left: -20,
                      bottom: 0,
                    }}
                  >
                    <CartesianGrid
                      strokeDasharray="4 4"
                      vertical={false}
                    />

                    <XAxis
                      dataKey="data"
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <YAxis
                      domain={[0, 10]}
                      tick={{
                        fontSize: 11,
                      }}
                    />

                    <Tooltip />

                    <Line
                      type="monotone"
                      dataKey="nota"
                      stroke="currentColor"
                      strokeWidth={3}
                      dot={{
                        r: 4,
                      }}
                      activeDot={{
                        r: 6,
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                Nuk ka ende vlerësime të mjaftueshme për grafik.
              </div>
            )}
          </div>

          <div className="mt-6 overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4 sm:px-6">
              <div className="flex items-center gap-2">
                <CalendarDays
                  size={18}
                  className="text-indigo-600"
                />

                <h3 className="font-bold text-slate-950">
                  Historiku i ndeshjeve
                </h3>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {[...item.history]
                .reverse()
                .map((match) => (
                  <div
                    key={match.matchId}
                    className="p-5 transition hover:bg-slate-50/60 sm:p-6"
                  >
                    <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                      <div>
                        <p className="font-bold text-slate-950">
                          {match.isHome
                            ? `${match.team.name} - ${match.opponentName}`
                            : `${match.opponentName} - ${match.team.name}`}
                        </p>

                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span>
                            {formatoDaten(
                              match.startsAt
                            )}
                          </span>

                          <span>•</span>

                          <span>
                            {match.role ===
                            "STARTER"
                              ? "Titullar"
                              : "Rezervë"}
                          </span>

                          <span>•</span>

                          <span>
                            {
                              match.minutesPlayed
                            }{" "}
                            min
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <Etikete
                          tekst={`Gola ${match.goals}`}
                        />

                        <Etikete
                          tekst={`Asistime ${match.assists}`}
                        />

                        <Etikete
                          tekst={
                            match.performance
                              ?.coachRating !==
                            null &&
                            match.performance
                              ?.coachRating !==
                              undefined
                              ? `Nota ${match.performance.coachRating}/10`
                              : "Pa vlerësim"
                          }
                        />
                      </div>
                    </div>

                    {match.performance && (
                      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-6">
                        <MetrikeEVogel
                          etiketa="Goditje"
                          vlera={`${match.performance.shotsOnTarget}/${match.performance.shots}`}
                        />

                        <MetrikeEVogel
                          etiketa="Pasime"
                          vlera={`${match.performance.passAccuracy}%`}
                        />

                        <MetrikeEVogel
                          etiketa="Driblime"
                          vlera={`${match.performance.dribbleAccuracy}%`}
                        />

                        <MetrikeEVogel
                          etiketa="Duele"
                          vlera={
                            match.performance
                              .duelsWon
                          }
                        />

                        <MetrikeEVogel
                          etiketa="Ndërhyrje"
                          vlera={
                            match.performance
                              .tackles
                          }
                        />

                        <MetrikeEVogel
                          etiketa="Interceptime"
                          vlera={
                            match.performance
                              .interceptions
                          }
                        />
                      </div>
                    )}

                    {match.performance
                      ?.coachNotes && (
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
                        <span className="font-semibold text-slate-800">
                          Shënimi i trajnerit:
                        </span>{" "}
                        {
                          match.performance
                            .coachNotes
                        }
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KutiDetaji({
  ikona: Icon,
  etiketa,
  vlera,
  tone,
}: {
  ikona: typeof Activity;
  etiketa: string;
  vlera: string | number;
  tone: "amber" | "cyan" | "emerald" | "violet";
}) {
  const tones = {
    amber: {
      card: "border-amber-100 bg-amber-50/70",
      icon: "text-amber-600 ring-amber-100",
    },
    cyan: {
      card: "border-cyan-100 bg-cyan-50/70",
      icon: "text-cyan-600 ring-cyan-100",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50/70",
      icon: "text-emerald-600 ring-emerald-100",
    },
    violet: {
      card: "border-violet-100 bg-violet-50/70",
      icon: "text-violet-600 ring-violet-100",
    },
  } as const;

  const style = tones[tone];

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${style.card}`}
    >
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-sm ring-1 ${style.icon}`}
      >
        <Icon size={17} />
      </div>

      <p className="mt-3 text-xl font-black text-slate-950">
        {vlera}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-500">
        {etiketa}
      </p>
    </div>
  );
}

function Metrike({
  etiketa,
  vlera,
}: {
  etiketa: string;
  vlera: string | number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
      <p className="text-lg font-bold text-slate-950">
        {vlera}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {etiketa}
      </p>
    </div>
  );
}

function MetrikeEVogel({
  etiketa,
  vlera,
}: {
  etiketa: string;
  vlera: string | number;
}) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <p className="text-xs text-slate-500">
        {etiketa}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-900">
        {vlera}
      </p>
    </div>
  );
}

function Etikete({
  tekst,
}: {
  tekst: string;
}) {
  return (
    <span className="rounded-xl border border-indigo-100 bg-indigo-50/70 px-3 py-1.5 text-xs font-semibold text-indigo-700">
      {tekst}
    </span>
  );
}
