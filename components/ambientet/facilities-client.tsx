"use client";

import dynamic from "next/dynamic";

import {
  type ElementType,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Activity,
  Building2,
  CirclePlus,
  Edit3,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  Wrench,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

const FacilityMap = dynamic(
  () =>
    import(
      "@/components/ambientet/facility-map"
    ),
  {
    ssr: false,
  }
);

type FacilityType =
  | "FOOTBALL_FIELD"
  | "BASKETBALL_COURT"
  | "VOLLEYBALL_COURT"
  | "TENNIS_COURT"
  | "SWIMMING_POOL"
  | "GYM"
  | "FITNESS_ROOM"
  | "MULTIPURPOSE_HALL"
  | "CLASSROOM"
  | "OTHER";

type FacilityStatus =
  | "ACTIVE"
  | "MAINTENANCE"
  | "INACTIVE";

type Facility = {
  id: string;
  academyId: string;
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  isIndoor: boolean;
  capacity: number | null;
  surface: string | null;
  dimensions: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

type FormState = {
  name: string;
  type: FacilityType;
  status: FacilityStatus;
  isIndoor: boolean;
  capacity: string;
  surface: string;
  dimensions: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  description: string;
  notes: string;
};

const TYPE_OPTIONS: Array<{
  value: FacilityType;
  label: string;
}> = [
  {
    value: "FOOTBALL_FIELD",
    label: "Fushë futbolli",
  },
  {
    value: "BASKETBALL_COURT",
    label: "Fushë basketbolli",
  },
  {
    value: "VOLLEYBALL_COURT",
    label: "Fushë volejbolli",
  },
  {
    value: "TENNIS_COURT",
    label: "Fushë tenisi",
  },
  {
    value: "SWIMMING_POOL",
    label: "Pishinë",
  },
  {
    value: "GYM",
    label: "Palestër",
  },
  {
    value: "FITNESS_ROOM",
    label: "Sallë fitnesi",
  },
  {
    value: "MULTIPURPOSE_HALL",
    label: "Sallë multifunksionale",
  },
  {
    value: "CLASSROOM",
    label: "Klasë / sallë mësimore",
  },
  {
    value: "OTHER",
    label: "Tjetër",
  },
];

const STATUS_OPTIONS: Array<{
  value: FacilityStatus;
  label: string;
}> = [
  {
    value: "ACTIVE",
    label: "Aktiv",
  },
  {
    value: "MAINTENANCE",
    label: "Në mirëmbajtje",
  },
  {
    value: "INACTIVE",
    label: "Joaktiv",
  },
];

function initialForm(): FormState {
  return {
    name: "",
    type: "OTHER",
    status: "ACTIVE",
    isIndoor: false,
    capacity: "",
    surface: "",
    dimensions: "",
    address: "",
    latitude: null,
    longitude: null,
    description: "",
    notes: "",
  };
}

function typeLabel(
  type: FacilityType
) {
  return (
    TYPE_OPTIONS.find(
      (option) =>
        option.value === type
    )?.label ?? type
  );
}

function statusLabel(
  status: FacilityStatus
) {
  return (
    STATUS_OPTIONS.find(
      (option) =>
        option.value === status
    )?.label ?? status
  );
}

function statusClass(
  status: FacilityStatus
) {
  if (status === "ACTIVE") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
  }

  if (
    status === "MAINTENANCE"
  ) {
    return "bg-amber-50 text-amber-700 ring-amber-600/20";
  }

  return "bg-slate-100 text-slate-500 ring-slate-500/20";
}

export default function FacilitiesClient({
  canManageFacilities,
}: {
  canManageFacilities: boolean;
}) {
  const [
    facilities,
    setFacilities,
  ] = useState<Facility[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    saving,
    setSaving,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    statusFilter,
    setStatusFilter,
  ] = useState<
    FacilityStatus | "ALL"
  >("ALL");

  const [
    typeFilter,
    setTypeFilter,
  ] = useState<
    FacilityType | "ALL"
  >("ALL");

  const [
    formOpen,
    setFormOpen,
  ] = useState(false);

  const [
    editingFacilityId,
    setEditingFacilityId,
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
    selectedFacilityId,
    setSelectedFacilityId,
  ] = useState<string | null>(
    null
  );

  async function loadFacilities() {
    setLoading(true);
    setError("");

    try {
      const response =
        await fetch(
          "/api/facilities",
          {
            cache: "no-store",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Ambientet nuk mund të ngarkoheshin."
        );
        return;
      }

      setFacilities(
        Array.isArray(
          data.facilities
        )
          ? data.facilities
          : []
      );
    } catch {
      setError(
        "Ndodhi një problem gjatë ngarkimit të ambienteve."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadFacilities();
  }, []);

  const filteredFacilities =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      return facilities.filter(
        (facility) => {
          const matchesSearch =
            !query ||
            facility.name
              .toLowerCase()
              .includes(query) ||
            (
              facility.address ||
              ""
            )
              .toLowerCase()
              .includes(query) ||
            typeLabel(
              facility.type
            )
              .toLowerCase()
              .includes(query) ||
            (
              facility.surface ||
              ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter ===
              "ALL" ||
            facility.status ===
              statusFilter;

          const matchesType =
            typeFilter === "ALL" ||
            facility.type ===
              typeFilter;

          return (
            matchesSearch &&
            matchesStatus &&
            matchesType
          );
        }
      );
    }, [
      facilities,
      search,
      statusFilter,
      typeFilter,
    ]);

  const activeCount =
    facilities.filter(
      (facility) =>
        facility.status ===
        "ACTIVE"
    ).length;

  const maintenanceCount =
    facilities.filter(
      (facility) =>
        facility.status ===
        "MAINTENANCE"
    ).length;

  const indoorCount =
    facilities.filter(
      (facility) =>
        facility.isIndoor
    ).length;

  function openCreateForm() {
    setEditingFacilityId(
      null
    );

    setForm(
      initialForm()
    );

    setError("");
    setFormOpen(true);
  }

  function openEditForm(
    facility: Facility
  ) {
    setEditingFacilityId(
      facility.id
    );

    setForm({
      name: facility.name,
      type: facility.type,
      status: facility.status,
      isIndoor:
        facility.isIndoor,
      capacity:
        facility.capacity === null
          ? ""
          : String(
              facility.capacity
            ),
      surface:
        facility.surface ?? "",
      dimensions:
        facility.dimensions ?? "",
      address:
        facility.address ?? "",
      latitude:
        facility.latitude,
      longitude:
        facility.longitude,
      description:
        facility.description ??
        "",
      notes:
        facility.notes ?? "",
    });

    setError("");
    setFormOpen(true);
  }

  function closeForm() {
    if (saving) {
      return;
    }

    setFormOpen(false);

    setEditingFacilityId(
      null
    );
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !canManageFacilities
    ) {
      return;
    }

    setSaving(true);
    setError("");

    const endpoint =
      editingFacilityId
        ? `/api/facilities/${editingFacilityId}`
        : "/api/facilities";

    try {
      const response =
        await fetch(
          endpoint,
          {
            method:
              editingFacilityId
                ? "PATCH"
                : "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              name: form.name,
              type: form.type,
              status: form.status,
              isIndoor:
                form.isIndoor,

              capacity:
                form.capacity.trim()
                  ? Number(
                      form.capacity
                    )
                  : null,

              surface:
                form.surface,

              dimensions:
                form.dimensions,

              address:
                form.address,

              latitude:
                form.latitude,

              longitude:
                form.longitude,

              description:
                form.description,

              notes:
                form.notes,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Ambienti nuk mund të ruhej."
        );
        return;
      }

      setFormOpen(false);

      setEditingFacilityId(
        null
      );

      await loadFacilities();
    } catch {
      setError(
        "Ndodhi një problem gjatë ruajtjes së ambientit."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(
    facility: Facility
  ) {
    if (
      !canManageFacilities
    ) {
      return;
    }

    const confirmed =
      window.confirm(
        `Ta fshij ambientin "${facility.name}"?`
      );

    if (!confirmed) {
      return;
    }

    setError("");

    try {
      const response =
        await fetch(
          `/api/facilities/${facility.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        setError(
          data.error ||
            "Ambienti nuk mund të fshihej."
        );
        return;
      }

      await loadFacilities();
    } catch {
      setError(
        "Ndodhi një problem gjatë fshirjes së ambientit."
      );
    }
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="relative overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-violet-50 p-5 shadow-sm sm:p-6 lg:flex lg:items-center lg:justify-between lg:gap-6">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Building2
                  size={22}
                />
              </div>

              <div>
                <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                  Ambientet
                </h1>

                <p className="mt-1 text-sm text-slate-500">
                  Menaxho fushat,
                  sallat dhe ambientet
                  sportive të akademisë.
                </p>
              </div>
            </div>
          </div>

          {canManageFacilities && (
            <button
              type="button"
              onClick={
                openCreateForm
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-md"
            >
              <CirclePlus
                size={18}
              />
              Shto ambient
            </button>
          )}
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Ambiente aktive"
            value={activeCount}
            subtitle="Gati për përdorim"
            icon={Activity}
            tone="emerald"
          />

          <StatCard
            title="Totali"
            value={
              facilities.length
            }
            subtitle="Ambiente të regjistruara"
            icon={Building2}
            tone="blue"
          />

          <StatCard
            title="Në mirëmbajtje"
            value={
              maintenanceCount
            }
            subtitle="Përkohësisht të kufizuara"
            icon={Wrench}
            tone="amber"
          />

          <StatCard
            title="Indoor"
            value={indoorCount}
            subtitle="Ambiente të mbyllura"
            icon={UsersRound}
            tone="violet"
          />
        </div>

        <div className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm">
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
                placeholder="Kërko sipas emrit, llojit, sipërfaqes ose adresës..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div className="relative">
              <Filter
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <select
                value={typeFilter}
                onChange={(
                  event
                ) =>
                  setTypeFilter(
                    event.target
                      .value as
                      | FacilityType
                      | "ALL"
                  )
                }
                className="h-full min-w-[190px] rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm text-slate-700 outline-none"
              >
                <option value="ALL">
                  Të gjitha llojet
                </option>

                {TYPE_OPTIONS.map(
                  (option) => (
                    <option
                      key={
                        option.value
                      }
                      value={
                        option.value
                      }
                    >
                      {option.label}
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
                    | FacilityStatus
                    | "ALL"
                )
              }
              className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none"
            >
              <option value="ALL">
                Çdo status
              </option>

              {STATUS_OPTIONS.map(
                (option) => (
                  <option
                    key={
                      option.value
                    }
                    value={
                      option.value
                    }
                  >
                    {option.label}
                  </option>
                )
              )}
            </select>

            <button
              type="button"
              onClick={() =>
                void loadFacilities()
              }
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-3 text-slate-500 transition hover:bg-slate-50"
              aria-label="Rifresko"
            >
              <RefreshCw
                size={17}
              />
            </button>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(440px,1.1fr)] xl:items-start">
          <div className="min-w-0">
            {loading ? (
          <div className="rounded-[24px] border border-slate-200 bg-white p-10 text-center text-sm text-slate-500">
            Duke ngarkuar
            ambientet...
          </div>
        ) : filteredFacilities.length ===
          0 ? (
          <div className="rounded-[24px] border border-dashed border-slate-300 bg-white p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
              <Building2
                size={28}
              />
            </div>

            <h3 className="mt-4 text-lg font-bold text-slate-900">
              Nuk u gjet asnjë
              ambient
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Ndrysho filtrat ose
              regjistro ambientin e
              parë të akademisë.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredFacilities.map(
              (facility) => (
                <article
                  key={
                    facility.id
                  }
                  onClick={() => setSelectedFacilityId(facility.id)}
                  className={`group cursor-pointer overflow-hidden rounded-[24px] border bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:shadow-lg ${selectedFacilityId === facility.id ? "border-blue-400 ring-4 ring-blue-50" : "border-slate-200 hover:border-blue-200"}`}
                >
                  <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50 to-slate-50 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                          <Building2
                            size={22}
                          />
                        </div>

                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-bold text-slate-950">
                            {
                              facility.name
                            }
                          </h2>

                          <p className="mt-1 text-xs font-medium text-slate-500">
                            {typeLabel(
                              facility.type
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap justify-end gap-2">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${statusClass(
                            facility.status
                          )}`}
                        >
                          {statusLabel(
                            facility.status
                          )}
                        </span>

                        <span className="inline-flex rounded-full bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 ring-1 ring-slate-200">
                          {facility.isIndoor
                            ? "Indoor"
                            : "Outdoor"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5">
                    <div className="grid grid-cols-2 gap-3">
                      <DetailBox
                        label="Kapaciteti"
                        value={
                          facility.capacity
                            ? `${facility.capacity} persona`
                            : "—"
                        }
                      />

                      <DetailBox
                        label="Sipërfaqja"
                        value={
                          facility.surface ||
                          "—"
                        }
                      />

                      <DetailBox
                        label="Dimensionet"
                        value={
                          facility.dimensions ||
                          "—"
                        }
                      />

                      <DetailBox
                        label="Vendndodhja"
                        value={
                          facility.address ||
                          "—"
                        }
                        icon={
                          <MapPin
                            size={14}
                          />
                        }
                      />
                    </div>

                    <p className="mt-4 min-h-[42px] text-sm leading-6 text-slate-600">
                      {facility.description ||
                        "Pa përshkrim të shtuar."}
                    </p>

                    {facility.notes ? (
                      <div className="mt-4 rounded-xl bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
                        {
                          facility.notes
                        }
                      </div>
                    ) : null}

                    {canManageFacilities && (
                      <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                        <button
                          type="button"
                          onClick={() =>
                            openEditForm(
                              facility
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-100"
                        >
                          <Edit3
                            size={14}
                          />
                          Edito
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void handleDelete(
                              facility
                            )
                          }
                          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                        >
                          <Trash2
                            size={14}
                          />
                          Fshi
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            )}
          </div>
            )}
          </div>

          <div className="xl:sticky xl:top-6">
            <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white p-3 shadow-sm">
              <div className="flex items-center justify-between gap-3 px-2 pb-3 pt-1">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Harta e ambienteve
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    Zgjidh një ambient për të parë vendndodhjen e saktë.
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                  <MapPin size={18} />
                </div>
              </div>

              <FacilityMap
                facilities={filteredFacilities}
                selectedFacilityId={selectedFacilityId}
                onSelectFacility={setSelectedFacilityId}
                heightClassName="h-[520px] xl:h-[620px]"
              />
            </div>
          </div>
        </div>
      </div>

      {formOpen &&
        canManageFacilities ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-xl font-bold text-slate-950">
                  {editingFacilityId
                    ? "Edito ambientin"
                    : "Ambient i ri"}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Regjistro të dhënat
                  dhe disponueshmërinë
                  e ambientit.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  closeForm
                }
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form
              onSubmit={
                handleSubmit
              }
              className="space-y-5 p-6"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Emri i ambientit">
                  <input
                    required
                    maxLength={160}
                    value={
                      form.name
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          name:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="p.sh. Fusha kryesore"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </Field>

                <Field label="Lloji">
                  <select
                    value={
                      form.type
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          type:
                            event
                              .target
                              .value as FacilityType,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    {TYPE_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Statusi">
                  <select
                    value={
                      form.status
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          status:
                            event
                              .target
                              .value as FacilityStatus,
                        })
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  >
                    {STATUS_OPTIONS.map(
                      (option) => (
                        <option
                          key={
                            option.value
                          }
                          value={
                            option.value
                          }
                        >
                          {option.label}
                        </option>
                      )
                    )}
                  </select>
                </Field>

                <Field label="Kapaciteti">
                  <input
                    type="number"
                    min={1}
                    max={100000}
                    value={
                      form.capacity
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          capacity:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="p.sh. 500"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </Field>

                <Field label="Sipërfaqja">
                  <input
                    value={
                      form.surface
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          surface:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="p.sh. Bar natyral"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </Field>

                <Field label="Dimensionet">
                  <input
                    value={
                      form.dimensions
                    }
                    onChange={(
                      event
                    ) =>
                      setForm(
                        (
                          current
                        ) => ({
                          ...current,
                          dimensions:
                            event
                              .target
                              .value,
                        })
                      )
                    }
                    placeholder="p.sh. 105 x 68 m"
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                  />
                </Field>
              </div>

              <Field label="Adresa / vendndodhja">
                <input
                  value={
                    form.address
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        address:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Vendndodhja e ambientit"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <div className="rounded-[24px] border border-blue-100 bg-blue-50/50 p-3 sm:p-4">
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      Vendndodhja e saktë
                    </p>
                    <p className="mt-1 text-xs leading-5 text-slate-500">
                      Kliko në hartë ose zvarrit pin-in deri te hyrja / fusha e saktë.
                    </p>
                  </div>

                  {form.latitude !== null && form.longitude !== null ? (
                    <div className="rounded-xl bg-white px-3 py-2 text-[11px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-200">
                      {form.latitude.toFixed(6)}, {form.longitude.toFixed(6)}
                    </div>
                  ) : null}
                </div>

                <FacilityMap
                  editable
                  selectedLatitude={form.latitude}
                  selectedLongitude={form.longitude}
                  onLocationChange={(latitude, longitude) =>
                    setForm((current) => ({
                      ...current,
                      latitude,
                      longitude,
                    }))
                  }
                  heightClassName="h-[300px] sm:h-[340px]"
                />

                {form.latitude !== null && form.longitude !== null ? (
                  <button
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        latitude: null,
                        longitude: null,
                      }))
                    }
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
                  >
                    <X size={14} />
                    Hiq vendndodhjen
                  </button>
                ) : null}
              </div>

              <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <input
                  type="checkbox"
                  checked={
                    form.isIndoor
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        isIndoor:
                          event
                            .target
                            .checked,
                      })
                    )
                  }
                  className="h-4 w-4 rounded border-slate-300"
                />

                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Ambient indoor
                  </p>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Aktivizoje nëse
                    ambienti është i
                    mbyllur.
                  </p>
                </div>
              </label>

              <Field label="Përshkrimi">
                <textarea
                  rows={4}
                  value={
                    form.description
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Përshkrimi i ambientit..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              <Field label="Shënime">
                <textarea
                  rows={3}
                  value={
                    form.notes
                  }
                  onChange={(
                    event
                  ) =>
                    setForm(
                      (
                        current
                      ) => ({
                        ...current,
                        notes:
                          event
                            .target
                            .value,
                      })
                    )
                  }
                  placeholder="Shënime shtesë..."
                  className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
                />
              </Field>

              {error ? (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <div className="flex justify-end gap-3 border-t border-slate-100 pt-5">
                <button
                  type="button"
                  onClick={
                    closeForm
                  }
                  disabled={
                    saving
                  }
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                >
                  Anulo
                </button>

                <button
                  type="submit"
                  disabled={
                    saving
                  }
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving
                    ? "Duke ruajtur..."
                    : editingFacilityId
                      ? "Ruaj ndryshimet"
                      : "Ruaj ambientin"}
                </button>
              </div>
            </form>
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
  tone = "blue",
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: ElementType;
  tone?: "blue" | "emerald" | "amber" | "violet";
}) {
  const toneStyles = {
    blue: {
      card: "border-blue-100 bg-blue-50/70",
      icon: "bg-white text-blue-600 ring-blue-100",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50/70",
      icon: "bg-white text-emerald-600 ring-emerald-100",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/70",
      icon: "bg-white text-amber-600 ring-amber-100",
    },
    violet: {
      card: "border-violet-100 bg-violet-50/70",
      icon: "bg-white text-violet-600 ring-violet-100",
    },
  } as const;

  const styles =
    toneStyles[tone];

  return (
    <div className={`rounded-[22px] border p-5 shadow-sm ${styles.card}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
            {title}
          </p>

          <p className="mt-2 text-2xl font-bold text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {subtitle}
          </p>
        </div>

        <div className={`flex h-10 w-10 items-center justify-center rounded-xl shadow-sm ring-1 ${styles.icon}`}>
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function DetailBox({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: ReactNode;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-1 truncate text-sm font-semibold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </span>

      {children}
    </label>
  );
}
