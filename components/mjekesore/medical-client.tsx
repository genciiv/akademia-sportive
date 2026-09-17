"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  Activity,
  AlertTriangle,
  Edit3,
  HeartPulse,
  Plus,
  RefreshCw,
  Search,
  ShieldAlert,
  Stethoscope,
  Trash2,
  UserRound,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type MedicalRecordType =
  | "INJURY"
  | "ILLNESS"
  | "CHECKUP"
  | "OTHER";

type MedicalRecordStatus =
  | "ACTIVE"
  | "RECOVERING"
  | "RESOLVED";

type MedicalAvailability =
  | "AVAILABLE"
  | "LIMITED"
  | "UNAVAILABLE";

type Player = {
  id: string;
  firstName: string;
  lastName: string;
  position: string | null;
  jerseyNumber: number | null;
  status: string;
};

type MedicalRecord = {
  id: string;
  type: MedicalRecordType;
  title: string;
  status: MedicalRecordStatus;
  availability: MedicalAvailability;
  startedAt: string;
  expectedReturnAt: string | null;
  resolvedAt: string | null;
  description: string | null;
  restrictions: string | null;
  recoveryNotes: string | null;
  privateNotes?: string | null;
  createdAt: string;
  updatedAt: string;
};

type MedicalClientProps = {
  canManageMedical: boolean;
};

type FormState = {
  type: MedicalRecordType;
  title: string;
  status: MedicalRecordStatus;
  availability: MedicalAvailability;
  startedAt: string;
  expectedReturnAt: string;
  resolvedAt: string;
  description: string;
  restrictions: string;
  recoveryNotes: string;
  privateNotes: string;
};

const TYPE_LABELS:
  Record<MedicalRecordType, string> = {
    INJURY: "Dëmtim",
    ILLNESS: "Sëmundje",
    CHECKUP: "Kontroll",
    OTHER: "Tjetër",
  };

const STATUS_LABELS:
  Record<MedicalRecordStatus, string> = {
    ACTIVE: "Aktiv",
    RECOVERING: "Në rikuperim",
    RESOLVED: "I zgjidhur",
  };

const AVAILABILITY_LABELS:
  Record<MedicalAvailability, string> = {
    AVAILABLE: "I disponueshëm",
    LIMITED: "I kufizuar",
    UNAVAILABLE: "I padisponueshëm",
  };

function todayInputValue() {
  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, "0");

  const day =
    String(
      now.getDate()
    ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function initialForm(): FormState {
  return {
    type: "INJURY",
    title: "",
    status: "ACTIVE",
    availability: "LIMITED",
    startedAt: todayInputValue(),
    expectedReturnAt: "",
    resolvedAt: "",
    description: "",
    restrictions: "",
    recoveryNotes: "",
    privateNotes: "",
  };
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

function availabilityClasses(
  value: MedicalAvailability
) {
  if (
    value === "UNAVAILABLE"
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (
    value === "LIMITED"
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-200";
  }

  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
}

function statusClasses(
  value: MedicalRecordStatus
) {
  if (
    value === "ACTIVE"
  ) {
    return "bg-rose-50 text-rose-700 ring-rose-200";
  }

  if (
    value === "RECOVERING"
  ) {
    return "bg-blue-50 text-blue-700 ring-blue-200";
  }

  return "bg-slate-100 text-slate-600 ring-slate-200";
}

export default function MedicalClient({
  canManageMedical,
}: MedicalClientProps) {
  const [
    players,
    setPlayers,
  ] = useState<Player[]>([]);

  const [
    selectedPlayerId,
    setSelectedPlayerId,
  ] = useState("");

  const [
    records,
    setRecords,
  ] = useState<MedicalRecord[]>([]);

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    loadingPlayers,
    setLoadingPlayers,
  ] = useState(true);

  const [
    loadingRecords,
    setLoadingRecords,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingRecordId,
    setEditingRecordId,
  ] = useState<string | null>(
    null
  );

  const [
    form,
    setForm,
  ] = useState<FormState>(
    initialForm()
  );

  const [
    saving,
    setSaving,
  ] = useState(false);

  const selectedPlayer =
    useMemo(
      () =>
        players.find(
          (player) =>
            player.id ===
            selectedPlayerId
        ) ?? null,
      [
        players,
        selectedPlayerId,
      ]
    );

  const filteredPlayers =
    useMemo(
      () => {
        const query =
          search
            .trim()
            .toLocaleLowerCase(
              "sq-AL"
            );

        if (!query) {
          return players;
        }

        return players.filter(
          (player) => {
            const fullName =
              `${player.firstName} ${player.lastName}`
                .toLocaleLowerCase(
                  "sq-AL"
                );

            const position =
              (
                player.position ??
                ""
              ).toLocaleLowerCase(
                "sq-AL"
              );

            return (
              fullName.includes(
                query
              ) ||
              position.includes(
                query
              )
            );
          }
        );
      },
      [
        players,
        search,
      ]
    );

  const activeRecords =
    useMemo(
      () =>
        records.filter(
          (record) =>
            record.status !==
            "RESOLVED"
        ),
      [records]
    );

  const currentAvailability =
    useMemo<
      MedicalAvailability | null
    >(
      () => {
        if (
          activeRecords.some(
            (record) =>
              record.availability ===
              "UNAVAILABLE"
          )
        ) {
          return "UNAVAILABLE";
        }

        if (
          activeRecords.some(
            (record) =>
              record.availability ===
              "LIMITED"
          )
        ) {
          return "LIMITED";
        }

        if (
          activeRecords.length > 0
        ) {
          return "AVAILABLE";
        }

        return null;
      },
      [activeRecords]
    );

  const recoveringCount =
    records.filter(
      (record) =>
        record.status ===
        "RECOVERING"
    ).length;

  async function loadPlayers() {
    setLoadingPlayers(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/players",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Sportistët nuk mund të ngarkoheshin."
        );
      }

      const nextPlayers:
        Player[] =
        Array.isArray(
          data.players
        )
          ? data.players
          : [];

      setPlayers(
        nextPlayers
      );

      setSelectedPlayerId(
        (current) => {
          if (
            current &&
            nextPlayers.some(
              (player) =>
                player.id ===
                current
            )
          ) {
            return current;
          }

          return (
            nextPlayers[0]
              ?.id ?? ""
          );
        }
      );
    } catch (loadError) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Sportistët nuk mund të ngarkoheshin."
      );
    } finally {
      setLoadingPlayers(false);
    }
  }

  async function loadRecords(
    playerId: string
  ) {
    if (!playerId) {
      setRecords([]);
      return;
    }

    setLoadingRecords(true);
    setError("");

    try {
      const response =
        await fetch(
          `/api/players/${playerId}/medical-records`,
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Rekordet mjekësore nuk mund të ngarkoheshin."
        );
      }

      setRecords(
        Array.isArray(
          data.records
        )
          ? data.records
          : []
      );
    } catch (loadError) {
      setRecords([]);

      setError(
        loadError instanceof Error
          ? loadError.message
          : "Rekordet mjekësore nuk mund të ngarkoheshin."
      );
    } finally {
      setLoadingRecords(false);
    }
  }

  useEffect(() => {
    void loadPlayers();
  }, []);

  useEffect(() => {
    void loadRecords(
      selectedPlayerId
    );
  }, [selectedPlayerId]);

  function openCreateForm() {
    setEditingRecordId(null);

    setForm(
      initialForm()
    );

    setFormOpen(true);
    setError("");
  }

  function openEditForm(
    record: MedicalRecord
  ) {
    setEditingRecordId(
      record.id
    );

    setForm({
      type: record.type,
      title: record.title,
      status: record.status,
      availability:
        record.availability,
      startedAt:
        record.startedAt.slice(
          0,
          10
        ),
      expectedReturnAt:
        record.expectedReturnAt
          ? record.expectedReturnAt.slice(
              0,
              10
            )
          : "",
      resolvedAt:
        record.resolvedAt
          ? record.resolvedAt.slice(
              0,
              10
            )
          : "",
      description:
        record.description ?? "",
      restrictions:
        record.restrictions ?? "",
      recoveryNotes:
        record.recoveryNotes ?? "",
      privateNotes:
        record.privateNotes ?? "",
    });

    setFormOpen(true);
    setError("");
  }

  async function handleDelete(
    record: MedicalRecord
  ) {
    if (
      !selectedPlayerId ||
      !canManageMedical
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Ta fshij rekordin "${record.title}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          `/api/players/${selectedPlayerId}/medical-records/${record.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Rekordi mjekësor nuk mund të fshihej."
        );
      }

      await loadRecords(
        selectedPlayerId
      );
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Rekordi mjekësor nuk mund të fshihej."
      );
    }
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !selectedPlayerId ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");

    try {
      const endpoint =
        editingRecordId
          ? `/api/players/${selectedPlayerId}/medical-records/${editingRecordId}`
          : `/api/players/${selectedPlayerId}/medical-records`;

      const response =
        await fetch(
          endpoint,
          {
            method:
              editingRecordId
                ? "PATCH"
                : "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
            body: JSON.stringify({
              ...form,
              expectedReturnAt:
                form.expectedReturnAt ||
                null,
              resolvedAt:
                form.status ===
                "RESOLVED"
                  ? form.resolvedAt ||
                    null
                  : null,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Rekordi mjekësor nuk mund të ruhej."
        );
      }

      setFormOpen(false);
      setEditingRecordId(null);

      setForm(
        initialForm()
      );

      await loadRecords(
        selectedPlayerId
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Rekordi mjekësor nuk mund të ruhej."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-rose-50 p-2.5 text-rose-700">
              <HeartPulse
                size={22}
              />
            </div>

            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Moduli mjekësor
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Dëmtime, sëmundje,
                kufizime dhe rikuperim
                të sportistëve.
              </p>
            </div>
          </div>

          {canManageMedical &&
            selectedPlayer && (
              <button
                type="button"
                onClick={
                  openCreateForm
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <Plus size={17} />
                Shto rekord
              </button>
            )}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 p-4">
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
                  placeholder="Kërko sportistin..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
                />
              </div>
            </div>

            <div className="max-h-[680px] overflow-y-auto p-2">
              {loadingPlayers ? (
                <div className="flex items-center justify-center gap-2 p-8 text-sm text-slate-500">
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />
                  Duke ngarkuar...
                </div>
              ) : filteredPlayers.length ===
                0 ? (
                <div className="p-8 text-center text-sm text-slate-500">
                  Nuk u gjet asnjë
                  sportist.
                </div>
              ) : (
                filteredPlayers.map(
                  (player) => {
                    const active =
                      player.id ===
                      selectedPlayerId;

                    return (
                      <button
                        key={
                          player.id
                        }
                        type="button"
                        onClick={() =>
                          setSelectedPlayerId(
                            player.id
                          )
                        }
                        className={`mb-1 flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition ${
                          active
                            ? "bg-slate-900 text-white"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                            active
                              ? "bg-white/10"
                              : "bg-slate-100"
                          }`}
                        >
                          <UserRound
                            size={17}
                          />
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold">
                            {
                              player.firstName
                            }{" "}
                            {
                              player.lastName
                            }
                          </p>

                          <p
                            className={`mt-0.5 truncate text-xs ${
                              active
                                ? "text-slate-300"
                                : "text-slate-500"
                            }`}
                          >
                            {player.position ||
                              "Pa pozicion"}
                            {player.jerseyNumber !==
                              null &&
                              ` · #${player.jerseyNumber}`}
                          </p>
                        </div>
                      </button>
                    );
                  }
                )
              )}
            </div>
          </aside>

          <section className="space-y-5">
            {!selectedPlayer ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
                <Stethoscope
                  size={34}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm text-slate-500">
                  Zgjidh një sportist për
                  të parë profilin
                  mjekësor.
                </p>
              </div>
            ) : (
              <>
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Sportisti
                      </p>

                      <h2 className="mt-1 text-xl font-bold text-slate-900">
                        {
                          selectedPlayer.firstName
                        }{" "}
                        {
                          selectedPlayer.lastName
                        }
                      </h2>
                    </div>

                    {currentAvailability ? (
                      <span
                        className={`inline-flex w-fit items-center rounded-full px-3 py-1.5 text-xs font-semibold ring-1 ring-inset ${availabilityClasses(
                          currentAvailability
                        )}`}
                      >
                        {
                          AVAILABILITY_LABELS[
                            currentAvailability
                          ]
                        }
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                        Pa kufizime aktive
                      </span>
                    )}
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <Activity size={16} />
                        <span className="text-xs font-medium">
                          Rekorde aktive
                        </span>
                      </div>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {
                          activeRecords.length
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <HeartPulse
                          size={16}
                        />
                        <span className="text-xs font-medium">
                          Në rikuperim
                        </span>
                      </div>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {
                          recoveringCount
                        }
                      </p>
                    </div>

                    <div className="rounded-xl bg-slate-50 p-4">
                      <div className="flex items-center gap-2 text-slate-500">
                        <ShieldAlert
                          size={16}
                        />
                        <span className="text-xs font-medium">
                          Gjithsej
                        </span>
                      </div>

                      <p className="mt-2 text-2xl font-bold text-slate-900">
                        {records.length}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
                  <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        Historiku mjekësor
                      </h3>

                      <p className="mt-0.5 text-xs text-slate-500">
                        Rekordet më të
                        fundit shfaqen të
                        parat.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void loadRecords(
                          selectedPlayer.id
                        )
                      }
                      disabled={
                        loadingRecords
                      }
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                      title="Rifresko"
                    >
                      <RefreshCw
                        size={17}
                        className={
                          loadingRecords
                            ? "animate-spin"
                            : ""
                        }
                      />
                    </button>
                  </div>

                  {loadingRecords ? (
                    <div className="flex items-center justify-center gap-2 p-12 text-sm text-slate-500">
                      <RefreshCw
                        size={17}
                        className="animate-spin"
                      />
                      Duke ngarkuar
                      rekordet...
                    </div>
                  ) : records.length ===
                    0 ? (
                    <div className="p-12 text-center">
                      <Stethoscope
                        size={34}
                        className="mx-auto text-slate-300"
                      />

                      <p className="mt-3 text-sm font-medium text-slate-700">
                        Nuk ka rekorde
                        mjekësore.
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        Historiku do të
                        shfaqet këtu pasi
                        të shtohet rekordi
                        i parë.
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {records.map(
                        (record) => (
                          <article
                            key={
                              record.id
                            }
                            className="p-5"
                          >
                            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-xs font-semibold text-slate-500">
                                    {
                                      TYPE_LABELS[
                                        record
                                          .type
                                      ]
                                    }
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClasses(
                                      record.status
                                    )}`}
                                  >
                                    {
                                      STATUS_LABELS[
                                        record
                                          .status
                                      ]
                                    }
                                  </span>

                                  <span
                                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${availabilityClasses(
                                      record.availability
                                    )}`}
                                  >
                                    {
                                      AVAILABILITY_LABELS[
                                        record
                                          .availability
                                      ]
                                    }
                                  </span>
                                </div>

                                <h4 className="mt-2 text-base font-semibold text-slate-900">
                                  {
                                    record.title
                                  }
                                </h4>
                              </div>

                              <div className="flex items-center gap-2">
                                <div className="text-xs text-slate-500">
                                  Filluar:{" "}
                                  <span className="font-medium text-slate-700">
                                    {formatDate(
                                      record.startedAt
                                    )}
                                  </span>
                                </div>

                                {canManageMedical && (
                                  <div className="flex items-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        openEditForm(
                                          record
                                        )
                                      }
                                      className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                                      title="Edito"
                                    >
                                      <Edit3 size={16} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        void handleDelete(
                                          record
                                        )
                                      }
                                      className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-50 hover:text-rose-700"
                                      title="Fshi"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 grid gap-3 text-sm md:grid-cols-2">
                              <div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Rikthimi i
                                  pritshëm
                                </span>

                                <p className="mt-1 text-slate-700">
                                  {formatDate(
                                    record.expectedReturnAt
                                  )}
                                </p>
                              </div>

                              <div>
                                <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Data e
                                  zgjidhjes
                                </span>

                                <p className="mt-1 text-slate-700">
                                  {formatDate(
                                    record.resolvedAt
                                  )}
                                </p>
                              </div>
                            </div>

                            {record.description && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Përshkrimi
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                  {
                                    record.description
                                  }
                                </p>
                              </div>
                            )}

                            {record.restrictions && (
                              <div className="mt-4 rounded-xl bg-amber-50 p-3">
                                <div className="flex items-start gap-2">
                                  <AlertTriangle
                                    size={16}
                                    className="mt-0.5 shrink-0 text-amber-600"
                                  />

                                  <div>
                                    <p className="text-xs font-semibold text-amber-800">
                                      Kufizime
                                    </p>

                                    <p className="mt-1 whitespace-pre-wrap text-sm text-amber-900">
                                      {
                                        record.restrictions
                                      }
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {record.recoveryNotes && (
                              <div className="mt-4">
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                  Rikuperimi
                                </p>

                                <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700">
                                  {
                                    record.recoveryNotes
                                  }
                                </p>
                              </div>
                            )}

                            {canManageMedical &&
                              record.privateNotes && (
                                <div className="mt-4 rounded-xl border border-violet-100 bg-violet-50 p-3">
                                  <p className="text-xs font-semibold text-violet-700">
                                    Shënime
                                    private
                                  </p>

                                  <p className="mt-1 whitespace-pre-wrap text-sm text-violet-900">
                                    {
                                      record.privateNotes
                                    }
                                  </p>
                                </div>
                              )}
                          </article>
                        )
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {formOpen &&
        selectedPlayer &&
        canManageMedical && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
            <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-5 py-4">
                <div>
                  <h2 className="font-semibold text-slate-900">
                    {editingRecordId
                      ? "Edito rekordin mjekësor"
                      : "Rekord i ri mjekësor"}
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    {
                      selectedPlayer.firstName
                    }{" "}
                    {
                      selectedPlayer.lastName
                    }
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFormOpen(
                      false
                    )
                  }
                  className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-5 p-5"
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      Lloji
                    </span>

                    <select
                      value={
                        form.type
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            type:
                              event
                                .target
                                .value as MedicalRecordType,
                          }
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    >
                      <option value="INJURY">
                        Dëmtim
                      </option>
                      <option value="ILLNESS">
                        Sëmundje
                      </option>
                      <option value="CHECKUP">
                        Kontroll
                      </option>
                      <option value="OTHER">
                        Tjetër
                      </option>
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      Disponueshmëria
                    </span>

                    <select
                      value={
                        form.availability
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            availability:
                              event
                                .target
                                .value as MedicalAvailability,
                          }
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    >
                      <option value="AVAILABLE">
                        I disponueshëm
                      </option>
                      <option value="LIMITED">
                        I kufizuar
                      </option>
                      <option value="UNAVAILABLE">
                        I padisponueshëm
                      </option>
                    </select>
                  </label>
                </div>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    Titulli
                  </span>

                  <input
                    required
                    maxLength={200}
                    value={
                      form.title
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        title:
                          event.target
                            .value,
                      })
                    }
                    placeholder="p.sh. Dëmtim i kyçit të këmbës"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      Statusi
                    </span>

                    <select
                      value={
                        form.status
                      }
                      onChange={(
                        event
                      ) =>
                        setForm(
                          {
                            ...form,
                            status:
                              event
                                .target
                                .value as MedicalRecordStatus,
                            resolvedAt:
                              event
                                .target
                                .value ===
                              "RESOLVED"
                                ? form.resolvedAt
                                : "",
                          }
                        )
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    >
                      <option value="ACTIVE">
                        Aktiv
                      </option>
                      <option value="RECOVERING">
                        Në rikuperim
                      </option>
                      <option value="RESOLVED">
                        I zgjidhur
                      </option>
                    </select>
                  </label>

                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      Data e fillimit
                    </span>

                    <input
                      required
                      type="date"
                      value={
                        form.startedAt
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          startedAt:
                            event.target
                              .value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    />
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-1.5 text-sm">
                    <span className="font-medium text-slate-700">
                      Rikthimi i
                      pritshëm
                    </span>

                    <input
                      type="date"
                      value={
                        form.expectedReturnAt
                      }
                      onChange={(
                        event
                      ) =>
                        setForm({
                          ...form,
                          expectedReturnAt:
                            event.target
                              .value,
                        })
                      }
                      className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                    />
                  </label>

                  {form.status ===
                    "RESOLVED" && (
                    <label className="space-y-1.5 text-sm">
                      <span className="font-medium text-slate-700">
                        Data e
                        zgjidhjes
                      </span>

                      <input
                        required
                        type="date"
                        value={
                          form.resolvedAt
                        }
                        onChange={(
                          event
                        ) =>
                          setForm({
                            ...form,
                            resolvedAt:
                              event
                                .target
                                .value,
                          })
                        }
                        className="w-full rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                      />
                    </label>
                  )}
                </div>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    Përshkrimi
                  </span>

                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={
                      form.description
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        description:
                          event.target
                            .value,
                      })
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    Kufizime sportive
                  </span>

                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={
                      form.restrictions
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        restrictions:
                          event.target
                            .value,
                      })
                    }
                    placeholder="p.sh. Pa sprint, pa kontakt fizik..."
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    Shënime rikuperimi
                  </span>

                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={
                      form.recoveryNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        recoveryNotes:
                          event.target
                            .value,
                      })
                    }
                    className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 outline-none focus:border-slate-400"
                  />
                </label>

                <label className="block space-y-1.5 text-sm">
                  <span className="font-medium text-slate-700">
                    Shënime private
                  </span>

                  <textarea
                    rows={3}
                    maxLength={4000}
                    value={
                      form.privateNotes
                    }
                    onChange={(
                      event
                    ) =>
                      setForm({
                        ...form,
                        privateNotes:
                          event.target
                            .value,
                      })
                    }
                    placeholder="Të dukshme vetëm për rolet me MEDICAL_MANAGE."
                    className="w-full resize-y rounded-xl border border-violet-200 bg-violet-50/40 px-3 py-2.5 outline-none focus:border-violet-400"
                  />
                </label>

                <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
                  <button
                    type="button"
                    onClick={() =>
                      setFormOpen(
                        false
                      )
                    }
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Anulo
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                  >
                    {saving
                      ? "Duke ruajtur..."
                      : editingRecordId
                        ? "Ruaj ndryshimet"
                        : "Ruaj rekordin"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
    </AppShell>
  );
}
