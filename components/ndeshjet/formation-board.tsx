"use client";

import {
  Check,
  Eye,
  EyeOff,
  Plus,
  Save,
  UsersRound,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

type FormationName =
  | "4-3-3"
  | "4-4-2"
  | "4-2-3-1"
  | "3-5-2"
  | "5-3-2"
  | "4-5-1"
  | "3-4-3";

type PitchSlot = {
  slot: string;
  x: number;
  y: number;
};

type FormationPlayer = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  teamPosition: string | null;
  teamJerseyNumber: number | null;
  selected: boolean;

  matchPlayer: {
    id: string;
    role: "STARTER" | "SUBSTITUTE";
    lineupSlot: string | null;
    jerseyNumber: number | null;
    position: string | null;
  } | null;
};

type LineupSquadPlayer = {
  id: string;
  playerId: string;
  role: "STARTER" | "SUBSTITUTE";
  lineupSlot: string | null;
};

type LineupResponse = {
  match: {
    id: string;
    teamId: string;
    teamName: string;
    opponentName: string;
    sport: string;
    formation: FormationName | null;
    publishedAt: string | null;
  };

  formations: Record<
    FormationName,
    string[]
  >;

  squad: LineupSquadPlayer[];
};

type FormationBoardProps = {
  matchId: string;
  teamName: string;
  opponentName: string;
  players: FormationPlayer[];
  onChanged?: () => Promise<void> | void;
};

const FORMATION_LAYOUTS: Record<
  FormationName,
  PitchSlot[]
> = {
  "4-3-3": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LB", x: 14, y: 71 },
    { slot: "LCB", x: 38, y: 73 },
    { slot: "RCB", x: 62, y: 73 },
    { slot: "RB", x: 86, y: 71 },

    { slot: "LCM", x: 27, y: 50 },
    { slot: "CM", x: 50, y: 46 },
    { slot: "RCM", x: 73, y: 50 },

    { slot: "LW", x: 18, y: 23 },
    { slot: "ST", x: 50, y: 15 },
    { slot: "RW", x: 82, y: 23 },
  ],

  "4-4-2": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LB", x: 14, y: 71 },
    { slot: "LCB", x: 38, y: 73 },
    { slot: "RCB", x: 62, y: 73 },
    { slot: "RB", x: 86, y: 71 },

    { slot: "LM", x: 15, y: 48 },
    { slot: "LCM", x: 38, y: 51 },
    { slot: "RCM", x: 62, y: 51 },
    { slot: "RM", x: 85, y: 48 },

    { slot: "LST", x: 38, y: 20 },
    { slot: "RST", x: 62, y: 20 },
  ],

  "4-2-3-1": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LB", x: 14, y: 72 },
    { slot: "LCB", x: 38, y: 74 },
    { slot: "RCB", x: 62, y: 74 },
    { slot: "RB", x: 86, y: 72 },

    { slot: "LDM", x: 38, y: 57 },
    { slot: "RDM", x: 62, y: 57 },

    { slot: "LW", x: 20, y: 36 },
    { slot: "CAM", x: 50, y: 39 },
    { slot: "RW", x: 80, y: 36 },

    { slot: "ST", x: 50, y: 15 },
  ],

  "3-5-2": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LCB", x: 25, y: 71 },
    { slot: "CB", x: 50, y: 75 },
    { slot: "RCB", x: 75, y: 71 },

    { slot: "LWB", x: 12, y: 48 },
    { slot: "LCM", x: 34, y: 51 },
    { slot: "CM", x: 50, y: 44 },
    { slot: "RCM", x: 66, y: 51 },
    { slot: "RWB", x: 88, y: 48 },

    { slot: "LST", x: 38, y: 19 },
    { slot: "RST", x: 62, y: 19 },
  ],

  "5-3-2": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LWB", x: 10, y: 67 },
    { slot: "LCB", x: 30, y: 73 },
    { slot: "CB", x: 50, y: 76 },
    { slot: "RCB", x: 70, y: 73 },
    { slot: "RWB", x: 90, y: 67 },

    { slot: "LCM", x: 30, y: 47 },
    { slot: "CM", x: 50, y: 42 },
    { slot: "RCM", x: 70, y: 47 },

    { slot: "LST", x: 38, y: 18 },
    { slot: "RST", x: 62, y: 18 },
  ],

  "4-5-1": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LB", x: 14, y: 72 },
    { slot: "LCB", x: 38, y: 74 },
    { slot: "RCB", x: 62, y: 74 },
    { slot: "RB", x: 86, y: 72 },

    { slot: "LM", x: 12, y: 46 },
    { slot: "LCM", x: 31, y: 51 },
    { slot: "CM", x: 50, y: 43 },
    { slot: "RCM", x: 69, y: 51 },
    { slot: "RM", x: 88, y: 46 },

    { slot: "ST", x: 50, y: 16 },
  ],

  "3-4-3": [
    { slot: "GK", x: 50, y: 89 },

    { slot: "LCB", x: 25, y: 71 },
    { slot: "CB", x: 50, y: 75 },
    { slot: "RCB", x: 75, y: 71 },

    { slot: "LM", x: 13, y: 48 },
    { slot: "LCM", x: 38, y: 51 },
    { slot: "RCM", x: 62, y: 51 },
    { slot: "RM", x: 87, y: 48 },

    { slot: "LW", x: 20, y: 22 },
    { slot: "ST", x: 50, y: 15 },
    { slot: "RW", x: 80, y: 22 },
  ],
};

const FORMATION_NAMES =
  Object.keys(
    FORMATION_LAYOUTS
  ) as FormationName[];

function initials(
  firstName: string,
  lastName: string
) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`
    .toUpperCase();
}

function publishedLabel(
  value: string
) {
  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(
    new Date(value)
  );
}

export function FormationBoard({
  matchId,
  teamName,
  opponentName,
  players,
  onChanged,
}: FormationBoardProps) {
  const [formation, setFormation] =
    useState<FormationName>("4-3-3");

  const [assignments, setAssignments] =
    useState<Record<string, string>>({});

  const [publishedAt, setPublishedAt] =
    useState<string | null>(null);

  const [pickerSlot, setPickerSlot] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [message, setMessage] =
    useState("");

  const [hasChanges, setHasChanges] =
    useState(false);

  const playersById = useMemo(
    () =>
      new Map(
        players.map(
          (player) => [
            player.id,
            player,
          ]
        )
      ),
    [players]
  );

  const assignedPlayerIds =
    useMemo(
      () =>
        new Set(
          Object.values(
            assignments
          )
        ),
      [assignments]
    );

  // sync assignments with squad roles
  useEffect(() => {
    const starterIds = new Set(
      players
        .filter(
          (player) =>
            player.selected &&
            player.matchPlayer?.role ===
              "STARTER"
        )
        .map(
          (player) => player.id
        )
    );

    setAssignments(
      (current) => {
        let changed = false;

        const next:
          Record<string, string> = {};

        for (
          const [
            slot,
            playerId,
          ] of Object.entries(
            current
          )
        ) {
          if (
            starterIds.has(
              playerId
            )
          ) {
            next[slot] =
              playerId;
          } else {
            changed = true;
          }
        }

        return changed
          ? next
          : current;
      }
    );
  }, [players]);
  const bench = useMemo(
    () =>
      players.filter(
        (player) =>
          player.selected &&
          !assignedPlayerIds.has(
            player.id
          )
      ),
    [
      players,
      assignedPlayerIds,
    ]
  );

  const slots =
    FORMATION_LAYOUTS[formation];

  const assignedCount =
    Object.keys(assignments).length;

  async function loadLineup() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/matches/${matchId}/lineup`,
          {
            cache: "no-store",
          }
        );

      const data =
        (await response.json()) as
          LineupResponse & {
            error?: string;
          };

      if (!response.ok) {
        setError(
          data.error ||
            "Formacioni nuk mund të ngarkohej."
        );
        return;
      }

      const nextFormation =
        data.match.formation &&
        FORMATION_LAYOUTS[
          data.match.formation
        ]
          ? data.match.formation
          : "4-3-3";

      const nextAssignments:
        Record<string, string> = {};

      for (
        const item of
        data.squad || []
      ) {
        if (
          item.role === "STARTER" &&
          item.lineupSlot
        ) {
          nextAssignments[
            item.lineupSlot
          ] = item.playerId;
        }
      }

      setFormation(
        nextFormation
      );

      setAssignments(
        nextAssignments
      );

      setPublishedAt(
        data.match.publishedAt
      );

      setHasChanges(false);
    } catch {
      setError(
        "Ndodhi një problem gjatë ngarkimit të formacionit."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadLineup();
  }, [matchId, players]);

  function ndryshoFormacionin(
    value: FormationName
  ) {
    const validSlots =
      new Set(
        FORMATION_LAYOUTS[
          value
        ].map(
          (item) => item.slot
        )
      );

    const nextAssignments:
      Record<string, string> = {};

    for (
      const [
        slot,
        playerId,
      ] of Object.entries(
        assignments
      )
    ) {
      if (
        validSlots.has(slot)
      ) {
        nextAssignments[slot] =
          playerId;
      }
    }

    setFormation(value);

    setAssignments(
      nextAssignments
    );

    setHasChanges(true);
    setMessage("");
    setError("");
  }

  function zgjidhSportistin(
    playerId: string
  ) {
    if (!pickerSlot) {
      return;
    }

    setAssignments(
      (current) => {
        const next = {
          ...current,
        };

        for (
          const slot of
          Object.keys(next)
        ) {
          if (
            next[slot] ===
            playerId
          ) {
            delete next[slot];
          }
        }

        next[pickerSlot] =
          playerId;

        return next;
      }
    );

    setPickerSlot(null);
    setHasChanges(true);
    setMessage("");
    setError("");
  }

  function liroPozicionin(
    slot: string
  ) {
    setAssignments(
      (current) => {
        const next = {
          ...current,
        };

        delete next[slot];

        return next;
      }
    );

    setPickerSlot(null);
    setHasChanges(true);
    setMessage("");
    setError("");
  }

  function payloadAssignments() {
    return Object.entries(
      assignments
    ).map(
      ([slot, playerId]) => ({
        slot,
        playerId,
      })
    );
  }

  async function ruajDraftin(
    silent = false
  ) {
    setSaving(true);
    setError("");

    if (!silent) {
      setMessage("");
    }

    try {
      const response =
        await fetch(
          `/api/matches/${matchId}/lineup`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "SAVE",
              formation,
              assignments:
                payloadAssignments(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Formacioni nuk mund të ruhej."
        );

        return false;
      }

      setPublishedAt(null);
      setHasChanges(false);

      if (!silent) {
        setMessage(
          "Drafti i formacionit u ruajt."
        );
      }

      await onChanged?.();
      await loadLineup();

      return true;
    } catch {
      setError(
        "Ndodhi një problem gjatë ruajtjes së formacionit."
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publiko() {
    setMessage("");
    setError("");

    const saved =
      await ruajDraftin(true);

    if (!saved) {
      return;
    }

    setSaving(true);

    try {
      const response =
        await fetch(
          `/api/matches/${matchId}/lineup`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "PUBLISH",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Formacioni nuk mund të publikohej."
        );
        return;
      }

      setPublishedAt(
        data.publishedAt
      );

      setMessage(
        "Formacioni u publikua për sportistët."
      );

      await loadLineup();
    } catch {
      setError(
        "Ndodhi një problem gjatë publikimit të formacionit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function hiqPublikimin() {
    setSaving(true);
    setError("");
    setMessage("");

    try {
      const response =
        await fetch(
          `/api/matches/${matchId}/lineup`,
          {
            method: "PATCH",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              action: "UNPUBLISH",
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Publikimi nuk mund të hiqej."
        );
        return;
      }

      setPublishedAt(null);

      setMessage(
        "Formacioni është kthyer në draft."
      );
    } catch {
      setError(
        "Ndodhi një problem gjatë heqjes së publikimit."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="border-t border-slate-100 p-6">
        <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500">
          Duke ngarkuar Formation Board...
        </div>
      </div>
    );
  }

  return (
    <>
      <section className="border-t border-slate-100 p-6">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
              Match Lineup
            </p>

            <h3 className="mt-1 text-xl font-black text-slate-950">
              Formation Board
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              {teamName} vs {opponentName} · vendos titullarët në fushë.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                Skema
              </label>

              <select
                value={formation}
                onChange={(event) =>
                  ndryshoFormacionin(
                    event.target
                      .value as FormationName
                  )
                }
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold text-slate-800 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              >
                {FORMATION_NAMES.map(
                  (name) => (
                    <option
                      key={name}
                      value={name}
                    >
                      {name}
                    </option>
                  )
                )}
              </select>
            </div>

            <button
              type="button"
              onClick={() =>
                void ruajDraftin()
              }
              disabled={saving}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <Save size={16} />
              Ruaj draftin
            </button>

            {publishedAt ? (
              <button
                type="button"
                onClick={() =>
                  void hiqPublikimin()
                }
                disabled={saving}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-amber-50 px-4 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:opacity-50"
              >
                <EyeOff size={16} />
                Hiq publikimin
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  void publiko()
                }
                disabled={
                  saving ||
                  assignedCount !== 11
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-bold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Eye size={16} />
                Publiko formacionin
              </button>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-700">
            {formation}
          </span>

          <span
            className={`rounded-full px-3 py-1.5 text-xs font-bold ${
              assignedCount === 11
                ? "bg-emerald-50 text-emerald-700"
                : "bg-blue-50 text-blue-700"
            }`}
          >
            {assignedCount}/11 titullarë
          </span>

          {publishedAt ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Check size={13} />
              Publikuar{" "}
              {publishedLabel(
                publishedAt
              )}
            </span>
          ) : (
            <span className="rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
              Draft
            </span>
          )}

          {hasChanges && (
            <span className="rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
              Ndryshime të paruajtura
            </span>
          )}
        </div>

        {assignedCount !== 11 && (
          <p className="mt-3 text-xs text-slate-500">
            Plotëso të 11 pozicionet për të aktivizuar publikimin.
          </p>
        )}

        {error && (
          <div className="mt-4 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}

        {message && (
          <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
            {message}
          </div>
        )}

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_280px]">
          <div className="mx-auto w-full max-w-[720px]">
            <div className="relative aspect-[3/4] min-h-[620px] overflow-hidden rounded-[32px] border-4 border-emerald-800 bg-emerald-600 shadow-inner">
              <div className="absolute inset-4 rounded-2xl border-2 border-white/75" />

              <div className="absolute left-4 right-4 top-1/2 border-t-2 border-white/75" />

              <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/75" />

              <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />

              <div className="absolute left-1/2 top-4 h-[18%] w-[48%] -translate-x-1/2 border-x-2 border-b-2 border-white/75" />

              <div className="absolute bottom-4 left-1/2 h-[18%] w-[48%] -translate-x-1/2 border-x-2 border-t-2 border-white/75" />

              <div className="absolute left-1/2 top-4 h-[8%] w-[24%] -translate-x-1/2 border-x-2 border-b-2 border-white/75" />

              <div className="absolute bottom-4 left-1/2 h-[8%] w-[24%] -translate-x-1/2 border-x-2 border-t-2 border-white/75" />

              {slots.map(
                ({
                  slot,
                  x,
                  y,
                }) => {
                  const playerId =
                    assignments[slot];

                  const player =
                    playerId
                      ? playersById.get(
                          playerId
                        )
                      : null;

                  return (
                    <button
                      key={slot}
                      type="button"
                      onClick={() =>
                        setPickerSlot(
                          slot
                        )
                      }
                      style={{
                        left: `${x}%`,
                        top: `${y}%`,
                      }}
                      className={`absolute z-10 flex w-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-2xl border px-2 py-2 text-center shadow-lg transition hover:scale-105 sm:w-[108px] ${
                        player
                          ? "border-slate-700 bg-slate-950 text-white"
                          : "border-white/70 bg-white/90 text-slate-800 hover:bg-white"
                      }`}
                    >
                      {player ? (
                        <>
                          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-black">
                            {initials(
                              player.firstName,
                              player.lastName
                            )}
                          </span>

                          <span className="mt-1 max-w-full truncate text-xs font-black">
                            {player.firstName}
                          </span>

                          <span className="max-w-full truncate text-[10px] font-semibold opacity-75">
                            {player.lastName}
                          </span>
                        </>
                      ) : (
                        <>
                          <Plus
                            size={19}
                          />

                          <span className="mt-1 text-[10px] font-black uppercase tracking-wide">
                            Shto
                          </span>
                        </>
                      )}

                      <span
                        className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-black ${
                          player
                            ? "bg-white/10 text-white"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {slot}
                      </span>
                    </button>
                  );
                }
              )}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex items-center gap-2">
                <UsersRound
                  size={18}
                  className="text-slate-500"
                />

                <h4 className="font-black text-slate-950">
                  Stoli
                </h4>
              </div>

              <p className="mt-1 text-xs text-slate-500">
                Sportistët e grumbulluar që nuk janë në 11-shen.
              </p>

              <div className="mt-4 space-y-2">
                {bench.length === 0 ? (
                  <p className="rounded-xl bg-white p-3 text-xs text-slate-500">
                    Nuk ka lojtarë në stol.
                  </p>
                ) : (
                  bench.map(
                    (player) => (
                      <div
                        key={player.id}
                        className="flex items-center gap-3 rounded-xl bg-white p-3"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                          {initials(
                            player.firstName,
                            player.lastName
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {player.firstName}{" "}
                            {player.lastName}
                          </p>

                          <p className="truncate text-xs text-slate-500">
                            {player.matchPlayer
                              ?.position ||
                              player.teamPosition ||
                              player.position ||
                              "Pa pozicion"}
                          </p>
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                Si funksionon
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Kliko një pozicion në fushë dhe zgjidh sportistin.
                Mund të zgjedhësh edhe një lojtar që nuk është ende në grumbullim.
              </p>

              <p className="mt-3 text-sm leading-6 text-slate-300">
                Kur ruan draftin, lojtarët në fushë bëhen automatikisht titullarë.
              </p>
            </div>
          </aside>
        </div>
      </section>

      {pickerSlot && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="max-h-[82vh] w-full max-w-lg overflow-hidden rounded-[28px] bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-100 p-5">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-emerald-600">
                  Pozicioni {pickerSlot}
                </p>

                <h4 className="mt-1 text-lg font-black text-slate-950">
                  Zgjidh sportistin
                </h4>
              </div>

              <button
                type="button"
                onClick={() =>
                  setPickerSlot(null)
                }
                className="rounded-xl p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[62vh] overflow-y-auto p-5">
              {assignments[
                pickerSlot
              ] && (
                <button
                  type="button"
                  onClick={() =>
                    liroPozicionin(
                      pickerSlot
                    )
                  }
                  className="mb-4 w-full rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-left text-sm font-bold text-red-700 transition hover:bg-red-100"
                >
                  Hiq nga fusha - në stol
                </button>
              )}

              <div className="space-y-2">
                {players.map(
                  (player) => {
                    const alreadyUsed =
                      assignedPlayerIds.has(
                        player.id
                      );

                    const usedHere =
                      assignments[
                        pickerSlot
                      ] === player.id;

                    return (
                      <button
                        key={player.id}
                        type="button"
                        onClick={() =>
                          zgjidhSportistin(
                            player.id
                          )
                        }
                        className={`flex w-full items-center justify-between gap-3 rounded-2xl border p-3 text-left transition ${
                          usedHere
                            ? "border-emerald-300 bg-emerald-50"
                            : "border-slate-200 hover:border-blue-200 hover:bg-blue-50"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                            {initials(
                              player.firstName,
                              player.lastName
                            )}
                          </div>

                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-950">
                              {player.firstName}{" "}
                              {player.lastName}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-500">
                              {player.teamPosition ||
                                player.position ||
                                "Pa pozicion"}

                              {player.selected
                                ? " · Në grumbullim"
                                : " · Jashtë grumbullimit"}
                            </p>
                          </div>
                        </div>

                        {usedHere ? (
                          <Check
                            size={18}
                            className="shrink-0 text-emerald-600"
                          />
                        ) : alreadyUsed ? (
                          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold text-slate-500">
                            Në fushë
                          </span>
                        ) : (
                          <Plus
                            size={18}
                            className="shrink-0 text-blue-600"
                          />
                        )}
                      </button>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}