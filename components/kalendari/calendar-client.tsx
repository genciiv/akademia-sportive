"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Filter,
  Loader2,
  MapPin,
  Pencil,
  Trash2,
  Plus,
  Trophy,
  Dumbbell,
  UsersRound,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import CalendarEventModal, { type CalendarEventForEdit } from "@/components/kalendari/calendar-event-modal";

type Team = {
  id: string;
  name: string;
  sport: string;
};

type CalendarEvent = {
  id: string;
  sourceId: string;
  source:
    | "TRAINING"
    | "MATCH"
    | "CALENDAR";
  type: string;
  title: string;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  description: string | null;
  notes: string | null;
  status: string | null;
  team: Team | null;
  opponentName?: string | null;
  matchType?: string | null;
  isHome?: boolean;
  ourScore?: number | null;
  opponentScore?: number | null;
  competitionName?: string | null;
  round?: string | null;
};

type ApiResponse = {
  teams: Team[];
  summary: {
    total: number;
    trainings: number;
    matches: number;
    activities: number;
  };
  events: CalendarEvent[];
};

const DITET = [
  "Hën",
  "Mar",
  "Mër",
  "Enj",
  "Pre",
  "Sht",
  "Die",
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

const LLOJET = [
  ["all", "Të gjitha"],
  ["TRAINING", "Stërvitje"],
  ["MATCH", "Ndeshje"],
  ["MEETING", "Mbledhje"],
  ["MEDICAL", "Mjekësore"],
  ["TRIAL", "Provë"],
  ["TOURNAMENT", "Turne"],
  ["ADMINISTRATIVE", "Administrative"],
  ["OTHER", "Të tjera"],
];

function dyShifra(value: number) {
  return String(value).padStart(2, "0");
}

function dataApi(date: Date) {
  return `${date.getFullYear()}-${dyShifra(
    date.getMonth() + 1
  )}-${dyShifra(date.getDate())}`;
}

function fillimiMuajit(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1,
    0,
    0,
    0,
    0
  );
}

function fundiMuajit(date: Date) {
  return new Date(
    date.getFullYear(),
    date.getMonth() + 1,
    0,
    23,
    59,
    59,
    999
  );
}

function etiketaLlojit(
  event: CalendarEvent
) {
  if (event.source === "TRAINING") {
    return "Stërvitje";
  }

  if (event.source === "MATCH") {
    return "Ndeshje";
  }

  const labels: Record<string, string> = {
    MEETING: "Mbledhje",
    MEDICAL: "Mjekësore",
    TRIAL: "Provë",
    TOURNAMENT: "Turne",
    ADMINISTRATIVE: "Administrative",
    OTHER: "Tjetër",
  };

  return labels[event.type] || "Aktivitet";
}

function klasatEventit(
  event: CalendarEvent
) {
  if (event.source === "MATCH") {
    return "border-lime-200 bg-lime-50 text-lime-900";
  }

  if (event.source === "TRAINING") {
    return "border-blue-200 bg-blue-50 text-blue-900";
  }

  if (event.type === "MEDICAL") {
    return "border-red-200 bg-red-50 text-red-900";
  }

  if (event.type === "TOURNAMENT") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  if (event.type === "MEETING") {
    return "border-violet-200 bg-violet-50 text-violet-900";
  }

  return "border-slate-200 bg-slate-50 text-slate-900";
}

function ora(data: string) {
  const date = new Date(data);

  return `${dyShifra(
    date.getHours()
  )}:${dyShifra(date.getMinutes())}`;
}

function eshteEADita(
  event: CalendarEvent,
  date: Date
) {
  const eventDate = new Date(
    event.startsAt
  );

  return (
    eventDate.getFullYear() ===
      date.getFullYear() &&
    eventDate.getMonth() ===
      date.getMonth() &&
    eventDate.getDate() ===
      date.getDate()
  );
}

function eshteSot(date: Date) {
  const sot = new Date();

  return (
    sot.getFullYear() ===
      date.getFullYear() &&
    sot.getMonth() ===
      date.getMonth() &&
    sot.getDate() === date.getDate()
  );
}

export default function CalendarClient() {
  const [muajiAktiv, setMuajiAktiv] =
    useState(() => new Date());

  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [dukeNgarkuar, setDukeNgarkuar] =
    useState(true);

  const [gabim, setGabim] =
    useState("");

  const [teamId, setTeamId] =
    useState("all");

  const [lloji, setLloji] =
    useState("all");

  const [
    eventiAktiv,
    setEventiAktiv,
  ] =
    useState<CalendarEvent | null>(null);

  const [
    modalShtimiHapur,
    setModalShtimiHapur,
  ] = useState(false);

  const [
    eventiPerEditim,
    setEventiPerEditim,
  ] = useState<CalendarEventForEdit | null>(null);

  const [
    eventiPerFshirje,
    setEventiPerFshirje,
  ] = useState<CalendarEvent | null>(null);

  const kufijte = useMemo(() => {
    return {
      from: fillimiMuajit(muajiAktiv),
      to: fundiMuajit(muajiAktiv),
    };
  }, [muajiAktiv]);

  async function ngarko() {
    setDukeNgarkuar(true);
    setGabim("");

    try {
      const params =
        new URLSearchParams();

      params.set(
        "from",
        kufijte.from.toISOString()
      );

      params.set(
        "to",
        kufijte.to.toISOString()
      );

      if (teamId !== "all") {
        params.set("teamId", teamId);
      }

      const response = await fetch(
        `/api/calendar?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Kalendari nuk u ngarkua."
        );
      }

      setData(result);
    } catch (error) {
      setGabim(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setDukeNgarkuar(false);
    }
  }

  useEffect(() => {
    ngarko();
  }, [
    muajiAktiv,
    teamId,
  ]);

  const eventetEFiltruara =
    useMemo(() => {
      if (!data) {
        return [];
      }

      if (lloji === "all") {
        return data.events;
      }

      return data.events.filter(
        (event) => {
          if (
            lloji === "TRAINING"
          ) {
            return (
              event.source ===
              "TRAINING"
            );
          }

          if (lloji === "MATCH") {
            return (
              event.source === "MATCH"
            );
          }

          return (
            event.source ===
              "CALENDAR" &&
            event.type === lloji
          );
        }
      );
    }, [data, lloji]);

  const ditetEMuajit =
    useMemo(() => {
      const first =
        fillimiMuajit(muajiAktiv);

      const last =
        fundiMuajit(muajiAktiv);

      const javaFillimit =
        (first.getDay() + 6) % 7;

      const total =
        javaFillimit +
        last.getDate();

      const qeliza =
        Math.ceil(total / 7) * 7;

      const result: Array<
        Date | null
      > = [];

      for (
        let index = 0;
        index < qeliza;
        index++
      ) {
        const day =
          index - javaFillimit + 1;

        if (
          day < 1 ||
          day > last.getDate()
        ) {
          result.push(null);
        } else {
          result.push(
            new Date(
              muajiAktiv.getFullYear(),
              muajiAktiv.getMonth(),
              day
            )
          );
        }
      }

      return result;
    }, [muajiAktiv]);

  function muajMePare() {
    setMuajiAktiv(
      new Date(
        muajiAktiv.getFullYear(),
        muajiAktiv.getMonth() - 1,
        1
      )
    );
  }

  function muajMePas() {
    setMuajiAktiv(
      new Date(
        muajiAktiv.getFullYear(),
        muajiAktiv.getMonth() + 1,
        1
      )
    );
  }

  function shkoSot() {
    setMuajiAktiv(new Date());
  }

  return (
    <AppShell>
      <PageHeader
        title="Kalendari"
        description="Stërvitjet, ndeshjet dhe aktivitetet e akademisë në një vend."
      />

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Gjithsej"
            value={data?.summary.total ?? 0}
            icon={
              <CalendarDays className="h-5 w-5" />
            }
          />

          <StatCard
            title="Stërvitje"
            value={
              data?.summary.trainings ?? 0
            }
            icon={
              <Dumbbell className="h-5 w-5" />
            }
          />

          <StatCard
            title="Ndeshje"
            value={
              data?.summary.matches ?? 0
            }
            icon={
              <Trophy className="h-5 w-5" />
            }
          />

          <StatCard
            title="Aktivitete"
            value={
              data?.summary.activities ??
              0
            }
            icon={
              <UsersRound className="h-5 w-5" />
            }
          />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={muajMePare}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50"
                aria-label="Muaji i kaluar"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>

              <button
                type="button"
                onClick={shkoSot}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Sot
              </button>

              <button
                type="button"
                onClick={muajMePas}
                className="rounded-xl border border-slate-200 p-2 text-slate-700 transition hover:bg-slate-50"
                aria-label="Muaji tjetër"
              >
                <ChevronRight className="h-5 w-5" />
              </button>

              <h2 className="ml-2 text-lg font-bold text-slate-950">
                {
                  MUAJT[
                    muajiAktiv.getMonth()
                  ]
                }{" "}
                {muajiAktiv.getFullYear()}
              </h2>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative">
                <Filter className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                <select
                  value={teamId}
                  onChange={(event) =>
                    setTeamId(
                      event.target.value
                    )
                  }
                  className="h-11 min-w-[180px] rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm font-medium text-slate-700 outline-none"
                >
                  <option value="all">
                    Të gjitha ekipet
                  </option>

                  {data?.teams.map(
                    (team) => (
                      <option
                        key={team.id}
                        value={team.id}
                      >
                        {team.name}
                      </option>
                    )
                  )}
                </select>
              </div>

              <select
                value={lloji}
                onChange={(event) =>
                  setLloji(
                    event.target.value
                  )
                }
                className="h-11 min-w-[170px] rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 outline-none"
              >
                {LLOJET.map(
                  ([value, label]) => (
                    <option
                      key={value}
                      value={value}
                    >
                      {label}
                    </option>
                  )
                )}
              </select>

              <button
                type="button"
                onClick={() =>
                  setModalShtimiHapur(
                    true
                  )
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus className="h-4 w-4" />
                Shto aktivitet
              </button>
            </div>
          </div>
        </div>

        {gabim && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700">
            {gabim}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50">
            {DITET.map((dita) => (
              <div
                key={dita}
                className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wide text-slate-500"
              >
                {dita}
              </div>
            ))}
          </div>

          {dukeNgarkuar ? (
            <div className="flex min-h-[520px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
            </div>
          ) : (
            <div className="grid grid-cols-7">
              {ditetEMuajit.map(
                (date, index) => {
                  if (!date) {
                    return (
                      <div
                        key={`empty-${index}`}
                        className="min-h-[145px] border-b border-r border-slate-100 bg-slate-50/40"
                      />
                    );
                  }

                  const dayEvents =
                    eventetEFiltruara.filter(
                      (event) =>
                        eshteEADita(
                          event,
                          date
                        )
                    );

                  return (
                    <div
                      key={dataApi(date)}
                      className="min-h-[145px] border-b border-r border-slate-100 p-2"
                    >
                      <div
                        className={
                          eshteSot(date)
                            ? "mb-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-950 text-xs font-bold text-white"
                            : "mb-2 flex h-7 w-7 items-center justify-center text-xs font-bold text-slate-700"
                        }
                      >
                        {date.getDate()}
                      </div>

                      <div className="space-y-1.5">
                        {dayEvents
                          .slice(0, 4)
                          .map((event) => (
                            <button
                              key={
                                event.id
                              }
                              type="button"
                              onClick={() =>
                                setEventiAktiv(
                                  event
                                )
                              }
                              className={`w-full rounded-lg border px-2 py-1.5 text-left transition hover:shadow-sm ${klasatEventit(
                                event
                              )}`}
                            >
                              <p className="truncate text-[11px] font-bold">
                                {ora(
                                  event.startsAt
                                )}{" "}
                                ·{" "}
                                {
                                  event.title
                                }
                              </p>
                            </button>
                          ))}

                        {dayEvents.length >
                          4 && (
                          <p className="px-1 text-[11px] font-semibold text-slate-500">
                            +
                            {dayEvents.length -
                              4}{" "}
                            të tjera
                          </p>
                        )}
                      </div>
                    </div>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>

      {eventiAktiv && (
        <EventDetails
          event={eventiAktiv}
          onClose={() =>
            setEventiAktiv(null)
          }
          onEdit={(event) => {
            if (event.source !== "CALENDAR") return;

            setEventiPerEditim({
              sourceId: event.sourceId,
              source: "CALENDAR",
              type: event.type,
              title: event.title,
              startsAt: event.startsAt,
              endsAt: event.endsAt,
              location: event.location,
              description: event.description,
              notes: event.notes,
              team: event.team
                ? {
                    id: event.team.id,
                    name: event.team.name,
                  }
                : null,
            });

            setEventiAktiv(null);
          }}
          onDelete={(event) => {
            setEventiPerFshirje(event);
            setEventiAktiv(null);
          }}
        />
      )}

      {modalShtimiHapur && (
        <CalendarEventModal
          teams={data?.teams ?? []}
          onClose={() =>
            setModalShtimiHapur(false)
          }
          onSaved={() => {
            ngarko();
          }}
        />
      )}

      {eventiPerEditim && (
        <CalendarEventModal
          teams={data?.teams ?? []}
          event={eventiPerEditim}
          onClose={() =>
            setEventiPerEditim(null)
          }
          onSaved={() => {
            ngarko();
          }}
        />
      )}

      {eventiPerFshirje && (
        <DeleteEventModal
          event={eventiPerFshirje}
          onClose={() =>
            setEventiPerFshirje(null)
          }
          onDeleted={() => {
            setEventiPerFshirje(null);
            ngarko();
          }}
        />
      )}
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-3xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function EventDetails({
  event,
  onClose,
  onEdit,
  onDelete,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}) {
  return (
    <div className="fixed inset-0 z-[100] flex justify-end bg-slate-950/30 backdrop-blur-sm">
      <div className="h-full w-full max-w-lg overflow-y-auto bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-slate-200 p-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              {etiketaLlojit(event)}
            </p>

            <h2 className="mt-2 text-xl font-bold text-slate-950">
              {event.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-6">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-xs font-semibold text-slate-500">
              Data
            </p>

            <p className="mt-1 font-semibold text-slate-900">
              {new Date(
                event.startsAt
              ).getDate()}{" "}
              {
                MUAJT[
                  new Date(
                    event.startsAt
                  ).getMonth()
                ]
              }{" "}
              {new Date(
                event.startsAt
              ).getFullYear()}
              , {ora(event.startsAt)}
            </p>
          </div>

          {event.team && (
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Ekipi
              </p>

              <p className="mt-1 font-semibold text-slate-900">
                {event.team.name}
              </p>
            </div>
          )}

          {event.location && (
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Vendndodhja
              </p>

              <p className="mt-1 flex items-center gap-2 font-semibold text-slate-900">
                <MapPin className="h-4 w-4" />
                {event.location}
              </p>
            </div>
          )}

          {event.description && (
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Përshkrimi
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {event.description}
              </p>
            </div>
          )}

          {event.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500">
                Shënime
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-700">
                {event.notes}
              </p>
            </div>
          )}

          {event.source === "CALENDAR" && (
            <div className="flex gap-3 border-t border-slate-200 pt-5">
              <button
                type="button"
                onClick={() => onEdit(event)}
                className="inline-flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Pencil className="h-4 w-4" />
                Edito aktivitetin
              </button>

              <button
                type="button"
                onClick={() => onDelete(event)}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-700 transition hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Fshi
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
function DeleteEventModal({
  event,
  onClose,
  onDeleted,
}: {
  event: CalendarEvent;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [dukeFshire, setDukeFshire] =
    useState(false);

  const [gabim, setGabim] =
    useState("");

  async function fshi() {
    if (
      event.source !== "CALENDAR"
    ) {
      return;
    }

    setDukeFshire(true);
    setGabim("");

    try {
      const response = await fetch(
        `/api/calendar/${event.sourceId}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Aktiviteti nuk u fshi."
        );
      }

      onDeleted();
    } catch (error) {
      setGabim(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setDukeFshire(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[130] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <Trash2 className="h-5 w-5" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-slate-950">
          Fshi aktivitetin?
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          Aktiviteti{" "}
          <span className="font-semibold text-slate-900">
            {event.title}
          </span>{" "}
          do të hiqet nga kalendari.
          Ky veprim nuk mund të zhbëhet.
        </p>

        {gabim && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {gabim}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={dukeFshire}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
          >
            Anulo
          </button>

          <button
            type="button"
            onClick={fshi}
            disabled={dukeFshire}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
          >
            {dukeFshire ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}

            Fshi aktivitetin
          </button>
        </div>
      </div>
    </div>
  );
}