"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  Archive,
  Edit3,
  Filter,
  Layers3,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Target,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type TacticPhase =
  | "ATTACK"
  | "DEFENSE"
  | "ATTACK_TRANSITION"
  | "DEFENSE_TRANSITION"
  | "SET_PIECE";

type Team = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
};

type Tactic = {
  id: string;
  name: string;
  formation: string | null;
  phase: TacticPhase;
  sport: string | null;
  objective: string | null;
  description: string | null;
  notes: string | null;
  boardData: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  teamId: string | null;
  team: Team | null;
  canManage: boolean;
};

const PHASE_LABELS:
  Record<TacticPhase, string> = {
    ATTACK: "Sulm",
    DEFENSE: "Mbrojtje",
    ATTACK_TRANSITION:
      "Tranzicion sulmues",
    DEFENSE_TRANSITION:
      "Tranzicion mbrojtës",
    SET_PIECE:
      "Goditje standarde",
  };

const FORMATIONS = [
  "4-3-3",
  "4-2-3-1",
  "4-4-2",
  "3-5-2",
  "3-4-3",
  "4-1-4-1",
];

const FORMATION_POSITIONS:
  Record<
    string,
    Array<[number, number]>
  > = {
    "4-3-3": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [28, 52],
      [50, 57],
      [72, 52],
      [18, 27],
      [50, 20],
      [82, 27],
    ],
    "4-2-3-1": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [36, 57],
      [64, 57],
      [18, 36],
      [50, 40],
      [82, 36],
      [50, 18],
    ],
    "4-4-2": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [18, 48],
      [38, 52],
      [62, 52],
      [82, 48],
      [38, 22],
      [62, 22],
    ],
    "3-5-2": [
      [50, 90],
      [28, 73],
      [50, 77],
      [72, 73],
      [12, 49],
      [34, 53],
      [50, 57],
      [66, 53],
      [88, 49],
      [38, 22],
      [62, 22],
    ],
    "3-4-3": [
      [50, 90],
      [28, 73],
      [50, 77],
      [72, 73],
      [18, 49],
      [40, 54],
      [60, 54],
      [82, 49],
      [18, 24],
      [50, 18],
      [82, 24],
    ],
    "4-1-4-1": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [50, 59],
      [18, 40],
      [40, 43],
      [60, 43],
      [82, 40],
      [50, 18],
    ],
  };

function phaseClass(
  phase: TacticPhase
) {
  if (phase === "ATTACK") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (phase === "DEFENSE") {
    return "bg-blue-50 text-blue-700 ring-blue-100";
  }

  if (
    phase === "SET_PIECE"
  ) {
    return "bg-violet-50 text-violet-700 ring-violet-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function TacticalPitch({
  formation,
}: {
  formation: string | null;
}) {
  const positions =
    FORMATION_POSITIONS[
      formation || ""
    ] ??
    FORMATION_POSITIONS["4-3-3"];

  return (
    <div className="relative aspect-[1.45/1] overflow-hidden rounded-2xl bg-emerald-600 shadow-inner">
      <div className="absolute inset-3 rounded-xl border border-white/60" />

      <div className="absolute left-1/2 top-3 bottom-3 w-px -translate-x-1/2 bg-white/55" />

      <div className="absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/55" />

      <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/70" />

      <div className="absolute left-1/2 top-3 h-[17%] w-[42%] -translate-x-1/2 border border-t-0 border-white/55" />

      <div className="absolute bottom-3 left-1/2 h-[17%] w-[42%] -translate-x-1/2 border border-b-0 border-white/55" />

      {positions.map(
        ([x, y], index) => (
          <div
            key={index}
            className="absolute flex h-6 w-6 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-slate-950 text-[8px] font-bold text-white shadow-md"
            style={{
              left: `${x}%`,
              top: `${y}%`,
            }}
          >
            {index + 1}
          </div>
        )
      )}

      <div className="absolute bottom-2 right-3 rounded-md bg-slate-950/70 px-2 py-1 text-[9px] font-semibold text-white backdrop-blur-sm">
        {formation ||
          "Pa formacion"}
      </div>
    </div>
  );
}

export default function TaktikatClient() {
  const [
    tactics,
    setTactics,
  ] = useState<Tactic[]>([]);

  const [
    teams,
    setTeams,
  ] = useState<Team[]>([]);

  const [
    canManage,
    setCanManage,
  ] = useState(false);

  const [
    isTeamScoped,
    setIsTeamScoped,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    phaseFilter,
    setPhaseFilter,
  ] = useState<
    "ALL" | TacticPhase
  >("ALL");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    "ALL" | "ACTIVE" | "ARCHIVED"
  >("ALL");

  const [
    showForm,
    setShowForm,
  ] = useState(false);

  const [
    editing,
    setEditing,
  ] = useState<Tactic | null>(
    null
  );

  const [
    deleting,
    setDeleting,
  ] = useState<Tactic | null>(
    null
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    deletingNow,
    setDeletingNow,
  ] = useState(false);

  const [
    name,
    setName,
  ] = useState("");

  const [
    formation,
    setFormation,
  ] = useState("4-3-3");

  const [
    phase,
    setPhase,
  ] =
    useState<TacticPhase>(
      "ATTACK"
    );

  const [
    teamId,
    setTeamId,
  ] = useState("");

  const [
    sport,
    setSport,
  ] = useState("");

  const [
    objective,
    setObjective,
  ] = useState("");

  const [
    description,
    setDescription,
  ] = useState("");

  const [
    notes,
    setNotes,
  ] = useState("");

  const [
    isActive,
    setIsActive,
  ] = useState(true);

  async function loadTactics() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/tactics",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Taktikat nuk mund të ngarkoheshin."
        );
        return;
      }

      setTactics(
        data.tactics || []
      );

      setTeams(
        data.teams || []
      );

      setCanManage(
        Boolean(
          data.canManage
        )
      );

      setIsTeamScoped(
        Boolean(
          data.isTeamScoped
        )
      );
    } catch {
      setError(
        "Ndodhi një problem gjatë ngarkimit të taktikave."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadTactics();
  }, []);

  const filtered =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return tactics.filter(
        (tactic) => {
          const matchesSearch =
            !query ||
            tactic.name
              .toLowerCase()
              .includes(query) ||
            (
              tactic.formation ||
              ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              tactic.team?.name ||
              ""
            )
              .toLowerCase()
              .includes(query) ||
            (
              tactic.objective ||
              ""
            )
              .toLowerCase()
              .includes(query);

          const matchesPhase =
            phaseFilter ===
              "ALL" ||
            tactic.phase ===
              phaseFilter;

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            (statusFilter ===
              "ACTIVE" &&
              tactic.isActive) ||
            (statusFilter ===
              "ARCHIVED" &&
              !tactic.isActive);

          return (
            matchesSearch &&
            matchesPhase &&
            matchesStatus
          );
        }
      );
    }, [
      tactics,
      search,
      phaseFilter,
      statusFilter,
    ]);

  const activeCount =
    tactics.filter(
      (tactic) =>
        tactic.isActive
    ).length;

  const teamTactics =
    tactics.filter(
      (tactic) =>
        tactic.teamId
    ).length;

  const formationsCount =
    new Set(
      tactics
        .map(
          (tactic) =>
            tactic.formation
        )
        .filter(Boolean)
    ).size;

  function resetForm() {
    setName("");
    setFormation("4-3-3");
    setPhase("ATTACK");
    setTeamId("");
    setSport("");
    setObjective("");
    setDescription("");
    setNotes("");
    setIsActive(true);
    setEditing(null);
  }

  function openCreate() {
    resetForm();

    if (
      isTeamScoped &&
      teams.length > 0
    ) {
      setTeamId(
        teams[0].id
      );

      setSport(
        teams[0].sport
      );
    }

    setShowForm(true);
  }

  function openEdit(
    tactic: Tactic
  ) {
    setEditing(tactic);
    setName(tactic.name);
    setFormation(
      tactic.formation ||
        "4-3-3"
    );
    setPhase(tactic.phase);
    setTeamId(
      tactic.teamId || ""
    );
    setSport(
      tactic.sport || ""
    );
    setObjective(
      tactic.objective || ""
    );
    setDescription(
      tactic.description || ""
    );
    setNotes(
      tactic.notes || ""
    );
    setIsActive(
      tactic.isActive
    );
    setShowForm(true);
  }

  async function saveTactic(
    event: FormEvent
  ) {
    event.preventDefault();

    setSaving(true);
    setError("");

    try {
      const url = editing
        ? `/api/tactics/${editing.id}`
        : "/api/tactics";

      const response =
        await fetch(url, {
          method: editing
            ? "PATCH"
            : "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            name,
            formation,
            phase,
            teamId:
              teamId || null,
            sport:
              sport || null,
            objective,
            description,
            notes,
            isActive,

            boardData: {
              formation,
              positions:
                FORMATION_POSITIONS[
                  formation
                ] || [],
            },
          }),
        });

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Taktika nuk mund të ruhej."
        );
        return;
      }

      setShowForm(false);
      resetForm();
      await loadTactics();
    } catch {
      setError(
        "Ndodhi një problem gjatë ruajtjes së taktikës."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deleteTactic() {
    if (!deleting) {
      return;
    }

    setDeletingNow(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/tactics/${deleting.id}`,
          {
            method:
              "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Taktika nuk mund të fshihej."
        );
        return;
      }

      setDeleting(null);
      await loadTactics();
    } catch {
      setError(
        "Ndodhi një problem gjatë fshirjes së taktikës."
      );
    } finally {
      setDeletingNow(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 shadow-sm">
          <div className="flex flex-col gap-6 px-5 py-6 sm:px-7 sm:py-7 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-blue-700 shadow-sm">
                <Target size={14} />
                Qendra taktike
              </div>

              <h1 className="mt-4 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Taktikat
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Ndërto, organizo dhe menaxho planet taktike të akademisë dhe ekipeve.
              </p>
            </div>

            {canManage ? (
              <button
                onClick={openCreate}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md"
              >
                <Plus size={18} />
                Shto taktikë
              </button>
            ) : null}
          </div>
        </section>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Taktika aktive"
            value={activeCount}
            subtitle="Gati për përdorim"
            icon={Activity}
            tone="blue"
          />

          <StatCard
            title="Totali"
            value={
              tactics.length
            }
            subtitle="Biblioteka taktike"
            icon={Layers3}
            tone="violet"
          />

          <StatCard
            title="Të lidhura me ekip"
            value={teamTactics}
            subtitle="Plane specifike"
            icon={UsersRound}
            tone="emerald"
          />

          <StatCard
            title="Formacione"
            value={
              formationsCount
            }
            subtitle="Skema të përdorura"
            icon={Shield}
            tone="amber"
          />
        </div>

        <div className="rounded-[24px] border border-blue-100 bg-gradient-to-r from-blue-50/70 via-white to-violet-50/60 p-4 shadow-sm">
          <div className="grid gap-3 xl:grid-cols-[1fr_auto_auto_auto]">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                value={search}
                onChange={(
                  event
                ) =>
                  setSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Kërko sipas emrit, formacionit, ekipit ose objektivit..."
                className="w-full rounded-xl border border-blue-100 bg-white py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={
                  phaseFilter
                }
                onChange={(
                  event
                ) =>
                  setPhaseFilter(
                    event.target
                      .value as
                      | "ALL"
                      | TacticPhase
                  )
                }
                className="h-full min-w-[180px] rounded-xl border border-blue-100 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-700 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
              >
                <option value="ALL">
                  Të gjitha fazat
                </option>

                {Object.entries(
                  PHASE_LABELS
                ).map(
                  ([
                    value,
                    label,
                  ]) => (
                    <option
                      key={
                        value
                      }
                      value={
                        value
                      }
                    >
                      {label}
                    </option>
                  )
                )}
              </select>
            </div>

            <select
              value={
                statusFilter
              }
              onChange={(
                event
              ) =>
                setStatusFilter(
                  event.target
                    .value as
                    | "ALL"
                    | "ACTIVE"
                    | "ARCHIVED"
                )
              }
              className="rounded-xl border border-violet-100 bg-white px-3 py-2.5 text-sm text-slate-700 shadow-sm outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100/60"
            >
              <option value="ALL">
                Çdo status
              </option>
              <option value="ACTIVE">
                Aktive
              </option>
              <option value="ARCHIVED">
                Arkivuara
              </option>
            </select>

            <button
              onClick={() =>
                void loadTactics()
              }
              className="inline-flex items-center justify-center rounded-xl border border-blue-100 bg-white px-3 text-slate-500 shadow-sm transition hover:bg-blue-50 hover:text-blue-700"
              aria-label="Rifresko"
            >
              <RefreshCw
                size={17}
              />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Duke ngarkuar
            taktikat...
          </div>
        ) : filtered.length ===
          0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Target
                size={28}
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Nuk u gjetën taktika
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Krijo planin e parë
              taktik të akademisë.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map(
              (tactic) => (
                <article
                  key={
                    tactic.id
                  }
                  className="group flex h-full flex-col overflow-hidden rounded-[20px] border border-slate-200/80 bg-white shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md"
                >
                  <div className="p-3 pb-0">
                    <TacticalPitch
                      formation={
                        tactic.formation
                      }
                    />
                  </div>

                  <div className="flex flex-1 flex-col p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap gap-1.5">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ${phaseClass(
                              tactic.phase
                            )}`}
                          >
                            {
                              PHASE_LABELS[
                                tactic
                                  .phase
                              ]
                            }
                          </span>

                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              tactic.isActive
                                ? "bg-blue-50 text-blue-700"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >
                            {tactic.isActive
                              ? "Aktive"
                              : "Arkivuar"}
                          </span>
                        </div>

                        <h2 className="mt-2.5 line-clamp-1 text-base font-bold text-slate-950">
                          {
                            tactic.name
                          }
                        </h2>

                        <p className="mt-1 text-xs text-slate-500">
                          {tactic.team
                            ? tactic
                                .team
                                .name
                            : "Taktikë e akademisë"}
                          {tactic
                            .formation
                            ? ` • ${tactic.formation}`
                            : ""}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-600">
                      {tactic.objective ||
                        tactic.description ||
                        "Pa përshkrim të shtuar."}
                    </p>

                    {tactic.canManage ? (
                      <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-slate-100 pt-3">
                        <button
                          onClick={() =>
                            openEdit(
                              tactic
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                        >
                          <Edit3
                            size={
                              14
                            }
                          />
                          Edito
                        </button>

                        <button
                          onClick={() =>
                            setDeleting(
                              tactic
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 bg-white px-2.5 py-1.5 text-[11px] font-semibold text-red-600 transition hover:border-red-200 hover:bg-red-50"
                        >
                          <Trash2
                            size={
                              14
                            }
                          />
                          Fshi
                        </button>
                      </div>
                    ) : null}
                  </div>
                </article>
              )
            )}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-[30px] border border-blue-100 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editing
                    ? "Edito taktikën"
                    : "Taktikë e re"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Përcakto skemën,
                  fazën dhe ekipin.
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm(
                    false
                  )
                }
                className="rounded-xl border border-slate-200 bg-white p-2 text-slate-400 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                saveTactic
              }
              className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[1fr_320px]"
            >
              <div className="space-y-4">
                <Field
                  label="Emri i taktikës"
                  required
                >
                  <input
                    value={name}
                    onChange={(
                      event
                    ) =>
                      setName(
                        event
                          .target
                          .value
                      )
                    }
                    required
                    maxLength={
                      120
                    }
                    placeholder="p.sh. 4-3-3 Presing i lartë"
                    className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Formacioni">
                    <select
                      value={
                        formation
                      }
                      onChange={(
                        event
                      ) =>
                        setFormation(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                    >
                      {FORMATIONS.map(
                        (
                          item
                        ) => (
                          <option
                            key={
                              item
                            }
                            value={
                              item
                            }
                          >
                            {
                              item
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field label="Faza e lojës">
                    <select
                      value={
                        phase
                      }
                      onChange={(
                        event
                      ) =>
                        setPhase(
                          event
                            .target
                            .value as TacticPhase
                        )
                      }
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                    >
                      {Object.entries(
                        PHASE_LABELS
                      ).map(
                        ([
                          value,
                          label,
                        ]) => (
                          <option
                            key={
                              value
                            }
                            value={
                              value
                            }
                          >
                            {
                              label
                            }
                          </option>
                        )
                      )}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Ekipi">
                    <select
                      value={
                        teamId
                      }
                      onChange={(
                        event
                      ) => {
                        const id =
                          event
                            .target
                            .value;

                        setTeamId(
                          id
                        );

                        const team =
                          teams.find(
                            (
                              item
                            ) =>
                              item.id ===
                              id
                          );

                        if (
                          team &&
                          !sport
                        ) {
                          setSport(
                            team.sport
                          );
                        }
                      }}
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                    >
                      {!isTeamScoped ? (
                        <option value="">
                          Pa ekip specifik
                        </option>
                      ) : null}

                      {teams.map(
                        (
                          team
                        ) => (
                          <option
                            key={
                              team.id
                            }
                            value={
                              team.id
                            }
                          >
                            {
                              team.name
                            }
                            {team.ageGroup
                              ? ` • ${team.ageGroup}`
                              : ""}
                          </option>
                        )
                      )}
                    </select>
                  </Field>

                  <Field label="Sporti">
                    <select
                      value={
                        sport
                      }
                      onChange={(
                        event
                      ) =>
                        setSport(
                          event
                            .target
                            .value
                        )
                      }
                      className="w-full rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                    >
                      <option value="">
                        Automatik / pa përcaktuar
                      </option>
                      <option value="FOOTBALL">
                        Futboll
                      </option>
                      <option value="BASKETBALL">
                        Basketboll
                      </option>
                      <option value="VOLLEYBALL">
                        Volejboll
                      </option>
                      <option value="HANDBALL">
                        Hendboll
                      </option>
                      <option value="OTHER">
                        Tjetër
                      </option>
                    </select>
                  </Field>
                </div>

                <Field label="Objektivi">
                  <textarea
                    value={
                      objective
                    }
                    onChange={(
                      event
                    ) =>
                      setObjective(
                        event
                          .target
                          .value
                      )
                    }
                    rows={2}
                    maxLength={
                      500
                    }
                    placeholder="Çfarë synon kjo taktikë?"
                    className="w-full resize-none rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                  />
                </Field>

                <Field label="Përshkrimi">
                  <textarea
                    value={
                      description
                    }
                    onChange={(
                      event
                    ) =>
                      setDescription(
                        event
                          .target
                          .value
                      )
                    }
                    rows={4}
                    placeholder="Parimet, rolet dhe mënyra e ekzekutimit..."
                    className="w-full resize-none rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                  />
                </Field>

                <Field label="Shënime për stafin">
                  <textarea
                    value={notes}
                    onChange={(
                      event
                    ) =>
                      setNotes(
                        event
                          .target
                          .value
                      )
                    }
                    rows={3}
                    placeholder="Detaje shtesë për trajnerët..."
                    className="w-full resize-none rounded-xl border border-blue-100 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-100/60"
                  />
                </Field>

                <label className="flex items-center gap-3 rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/80 to-white px-4 py-3 shadow-sm">
                  <input
                    type="checkbox"
                    checked={
                      isActive
                    }
                    onChange={(
                      event
                    ) =>
                      setIsActive(
                        event
                          .target
                          .checked
                      )
                    }
                    className="h-4 w-4 rounded border-emerald-300 accent-emerald-600"
                  />

                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      Taktikë aktive
                    </p>
                    <p className="text-xs text-slate-500">
                      Tregoje në
                      bibliotekën
                      operative.
                    </p>
                  </div>
                </label>
              </div>

              <div className="space-y-4">
                <div className="rounded-[22px] border border-blue-100 bg-gradient-to-br from-blue-50/80 via-white to-emerald-50/50 p-4 shadow-sm">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
                    Preview i
                    formacionit
                  </p>

                  <TacticalPitch
                    formation={
                      formation
                    }
                  />

                  <div className="mt-3 rounded-xl border border-blue-100 bg-white/90 p-3 text-xs leading-5 text-slate-500 shadow-sm">
                    Skema ruhet bashkë
                    me taktikën dhe
                    shfaqet në kartë.
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t border-blue-100 pt-4 lg:col-span-2">
                <button
                  type="button"
                  onClick={() =>
                    setShowForm(
                      false
                    )
                  }
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  Anulo
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Duke ruajtur..."
                    : editing
                      ? "Ruaj ndryshimet"
                      : "Krijo taktikën"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {deleting ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Archive
                size={22}
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-950">
              Fshi taktikën?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              “{deleting.name}”
              do të hiqet
              përfundimisht.
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() =>
                  setDeleting(null)
                }
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
              >
                Anulo
              </button>

              <button
                onClick={() =>
                  void deleteTactic()
                }
                disabled={
                  deletingNow
                }
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                {deletingNow
                  ? "Duke fshirë..."
                  : "Fshi"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  tone: "blue" | "violet" | "emerald" | "amber";
}) {
  const tones = {
    blue: {
      card: "border-blue-100 bg-gradient-to-br from-blue-50 to-white",
      label: "text-blue-700",
      icon: "bg-blue-100 text-blue-700",
    },
    violet: {
      card: "border-violet-100 bg-gradient-to-br from-violet-50 to-white",
      label: "text-violet-700",
      icon: "bg-violet-100 text-violet-700",
    },
    emerald: {
      card: "border-emerald-100 bg-gradient-to-br from-emerald-50 to-white",
      label: "text-emerald-700",
      icon: "bg-emerald-100 text-emerald-700",
    },
    amber: {
      card: "border-amber-100 bg-gradient-to-br from-amber-50 to-white",
      label: "text-amber-700",
      icon: "bg-amber-100 text-amber-700",
    },
  } as const;

  const style = tones[tone];

  return (
    <div
      className={`rounded-[20px] border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md ${style.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p
            className={`text-[11px] font-semibold uppercase tracking-wide ${style.label}`}
          >
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}
function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children:
    React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
        {required ? (
          <span className="text-red-500">
            {" "}
            *
          </span>
        ) : null}
      </span>

      {children}
    </label>
  );
}