"use client";

import {
  Ban,
  Building2,
  CalendarDays,
  Loader2,
  MapPin,
  Power,
  RotateCcw,
  Search,
  ShieldCheck,
  TriangleAlert,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

type Academy = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  city: string | null;
  country: string | null;
  address: string | null;
  status: string;
  createdAt: string;

  owner: {
    name: string | null;
    email: string;
  };

  subscription: {
    status: string;
    trialStartsAt: string | null;
    trialEndsAt: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
    graceEndsAt: string | null;
    cancelledAt: string | null;

    plan: {
      code: string;
      name: string;
    };
  } | null;

  _count: {
    memberships: number;
    branches: number;
    players: number;
    teams: number;
    coaches: number;
  };
};

type Filter =
  | "ALL"
  | "TRIAL"
  | "ACTIVE"
  | "SUSPENDED";

type StatusAction =
  | "SUSPEND"
  | "REACTIVATE";

export function AcademiesClient({
  initialAcademies,
}: {
  initialAcademies: Academy[];
}) {
  const [academies, setAcademies] =
    useState<Academy[]>(
      initialAcademies
    );

  const [query, setQuery] =
    useState("");

  const [
    statusTarget,
    setStatusTarget,
  ] = useState<{
    academy: Academy;
    action: StatusAction;
  } | null>(null);

  const [
    statusLoading,
    setStatusLoading,
  ] = useState(false);

  const [
    statusError,
    setStatusError,
  ] = useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialAcademies[0]?.id ?? null
    );

  const counts = useMemo(
    () => ({
      all: academies.length,

      trial: academies.filter(
        (academy) =>
          academy.status === "TRIAL"
      ).length,

      active: academies.filter(
        (academy) =>
          academy.status === "ACTIVE"
      ).length,

      suspended: academies.filter(
        (academy) =>
          academy.status ===
          "SUSPENDED"
      ).length,
    }),
    [academies]
  );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    return academies.filter(
      (academy) => {
        if (
          filter === "TRIAL" &&
          academy.status !== "TRIAL"
        ) {
          return false;
        }

        if (
          filter === "ACTIVE" &&
          academy.status !== "ACTIVE"
        ) {
          return false;
        }

        if (
          filter === "SUSPENDED" &&
          academy.status !==
            "SUSPENDED"
        ) {
          return false;
        }

        if (!value) {
          return true;
        }

        return [
          academy.name,
          academy.slug,
          academy.owner.name ?? "",
          academy.owner.email,
          academy.city ?? "",
          academy.country ?? "",
          academy.subscription?.plan.name ??
            "",
          academy.subscription?.plan.code ??
            "",
        ].some((field) =>
          field
            .toLowerCase()
            .includes(value)
        );
      }
    );
  }, [
    academies,
    query,
    filter,
  ]);

  async function updateAcademyStatus() {
    if (
      !statusTarget ||
      statusLoading
    ) {
      return;
    }

    setStatusLoading(true);
    setStatusError("");

    try {
      const response = await fetch(
        `/api/platform-admin/academies/${statusTarget.academy.id}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            action:
              statusTarget.action,
          }),
        }
      );

      const data =
        (await response.json().catch(
          () => null
        )) as {
          error?: string;
          academy?: {
            id: string;
            status: string;
          };
        } | null;

      if (
        !response.ok ||
        !data?.academy
      ) {
        setStatusError(
          data?.error ||
            "Veprimi nuk mund të kryhej."
        );
        return;
      }

      const updatedAcademy =
        data.academy;

      setAcademies((current) =>
        current.map((academy) =>
          academy.id ===
          updatedAcademy.id
            ? {
                ...academy,
                status:
                  updatedAcademy.status,
              }
            : academy
        )
      );

      setStatusTarget(null);
    } catch {
      setStatusError(
        "Ndodhi një problem gjatë komunikimit me serverin."
      );
    } finally {
      setStatusLoading(false);
    }
  }
  const selected =
    visible.find(
      (academy) =>
        academy.id === selectedId
    ) ??
    visible[0] ??
    null;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Akademitë
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Menaxho dhe monitoro akademitë e
          regjistruara në platformë.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Akademi totale"
          value={counts.all}
          icon={
            <Building2 size={18} />
          }
        />

        <Stat
          title="Në trial"
          value={counts.trial}
          icon={
            <CalendarDays size={18} />
          }
        />

        <Stat
          title="Akademi aktive"
          value={counts.active}
          icon={
            <ShieldCheck size={18} />
          }
        />

        <Stat
          title="Çaktivizuara"
          value={counts.suspended}
          icon={
            <Ban size={18} />
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(event.target.value)
            }
            placeholder="Kërko akademi, pronar, qytet ose plan..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition hover:border-slate-300 focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <FilterButton
            active={filter === "ALL"}
            onClick={() =>
              setFilter("ALL")
            }
          >
            Të gjitha {counts.all}
          </FilterButton>

          <FilterButton
            active={filter === "TRIAL"}
            onClick={() =>
              setFilter("TRIAL")
            }
          >
            Trial {counts.trial}
          </FilterButton>

          <FilterButton
            active={filter === "ACTIVE"}
            onClick={() =>
              setFilter("ACTIVE")
            }
          >
            Aktive {counts.active}
          </FilterButton>

          <FilterButton
            active={
              filter === "SUSPENDED"
            }
            onClick={() =>
              setFilter("SUSPENDED")
            }
          >
            Çaktivizuara{" "}
            {counts.suspended}
          </FilterButton>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-sky-50/60 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">
              Lista e akademive
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {visible.length} rezultate
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <Building2
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nuk u gjet asnjë akademi.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              {visible.map((academy) => (
                <button
                  key={academy.id}
                  type="button"
                  onClick={() =>
                    setSelectedId(
                      academy.id
                    )
                  }
                  className={[
                    "block w-full border-l-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0",
                    selected?.id ===
                    academy.id
                      ? "border-l-violet-600 bg-gradient-to-r from-violet-50 via-white to-white"
                      : "border-l-transparent hover:bg-violet-50/40",
                  ].join(" ")}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {academy.name}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {academy.owner.name ||
                          academy.owner.email}
                      </p>

                      <p className="mt-1 text-[11px] text-slate-400">
                        {academy.city ||
                          "Pa qytet"}
                        {" · "}
                        {academy.subscription
                          ?.plan.name ||
                          "Pa plan"}
                      </p>
                    </div>

                    <AcademyStatus
                      status={
                        academy.status
                      }
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>

        <section className="min-w-0">
          {!selected ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div>
                <Building2
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Zgjidh një akademi
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/70 via-white to-sky-50/50 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AcademyStatus
                        status={
                          selected.status
                        }
                      />

                      {selected.subscription ? (
                        <SubscriptionStatus
                          status={
                            selected
                              .subscription
                              .status
                          }
                        />
                      ) : null}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      {selected.name}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Krijuar më{" "}
                      {formatDateTime(
                        selected.createdAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Plani
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-900">
                      {selected.subscription
                        ?.plan.name ||
                        "Pa abonim"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
                <Info
                  icon={
                    <UserRound size={15} />
                  }
                  label="Pronari"
                  value={
                    selected.owner.name ||
                    "—"
                  }
                />

                <Info
                  icon={
                    <UsersRound size={15} />
                  }
                  label="Email pronari"
                  value={
                    selected.owner.email
                  }
                />

                <Info
                  icon={
                    <MapPin size={15} />
                  }
                  label="Vendndodhja"
                  value={[
                    selected.city,
                    selected.country,
                  ]
                    .filter(Boolean)
                    .join(", ") || "—"}
                />

                <Info
                  icon={
                    <Building2 size={15} />
                  }
                  label="Slug"
                  value={selected.slug}
                />
              </div>

              <div className="border-t border-violet-100 bg-slate-50/30 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Përdorimi
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                  <MiniStat
                    label="Përdorues"
                    value={
                      selected._count
                        .memberships
                    }
                  />

                  <MiniStat
                    label="Degë"
                    value={
                      selected._count
                        .branches
                    }
                  />

                  <MiniStat
                    label="Sportistë"
                    value={
                      selected._count.players
                    }
                  />

                  <MiniStat
                    label="Ekipe"
                    value={
                      selected._count.teams
                    }
                  />

                  <MiniStat
                    label="Trajnerë"
                    value={
                      selected._count.coaches
                    }
                  />
                </div>
              </div>

              <div className="border-t border-violet-100 bg-slate-50/30 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Abonimi
                </p>

                {selected.subscription ? (
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <Info
                      icon={
                        <ShieldCheck
                          size={15}
                        />
                      }
                      label="Statusi"
                      value={
                        selected.subscription
                          .status
                      }
                    />

                    <Info
                      icon={
                        <CalendarDays
                          size={15}
                        />
                      }
                      label="Trial përfundon"
                      value={
                        selected.subscription
                          .trialEndsAt
                          ? formatDateTime(
                              selected
                                .subscription
                                .trialEndsAt
                            )
                          : "—"
                      }
                    />

                    <Info
                      icon={
                        <CalendarDays
                          size={15}
                        />
                      }
                      label="Periudha përfundon"
                      value={
                        selected.subscription
                          .currentPeriodEnd
                          ? formatDateTime(
                              selected
                                .subscription
                                .currentPeriodEnd
                            )
                          : "—"
                      }
                    />

                    <Info
                      icon={
                        <ShieldCheck
                          size={15}
                        />
                      }
                      label="Kodi i planit"
                      value={
                        selected.subscription
                          .plan.code
                      }
                    />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-slate-500">
                    Kjo akademi nuk ka abonim.
                  </p>
                )}
              </div>
              <div className="border-t border-violet-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Statusi i akademisë
                    </p>

                    <div className="mt-2 flex items-center gap-2">
                      <AcademyStatus
                        status={
                          selected.status
                        }
                      />

                      <span className="text-xs text-slate-500">
                        {selected.status ===
                        "SUSPENDED"
                          ? "Aksesi në akademi është i bllokuar."
                          : "Akademia mund të përdoret normalisht."}
                      </span>
                    </div>
                  </div>

                  {selected.status ===
                  "SUSPENDED" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusError("");
                        setStatusTarget({
                          academy: selected,
                          action:
                            "REACTIVATE",
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-emerald-700"
                    >
                      <RotateCcw
                        size={16}
                      />

                      Riaktivizo akademinë
                    </button>
                  ) : selected.status !==
                    "CANCELLED" ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusError("");
                        setStatusTarget({
                          academy: selected,
                          action:
                            "SUSPEND",
                        });
                      }}
                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100"
                    >
                      <Power size={16} />

                      Çaktivizo akademinë
                    </button>
                  ) : null}
                </div>

                {selected.status ===
                "SUSPENDED" ? (
                  <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
                    <div className="flex gap-3">
                      <TriangleAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-amber-700"
                      />

                      <p className="text-sm leading-6 text-amber-900">
                        Pronari, stafi dhe sportistët nuk mund ta përdorin këtë akademi.
                        Të gjitha të dhënat dhe historiku ruhen.
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
      {statusTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-[28px] border border-white/70 bg-white p-6 shadow-2xl">
            <div
              className={[
                "flex h-12 w-12 items-center justify-center rounded-2xl",
                statusTarget.action ===
                "SUSPEND"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-emerald-100 text-emerald-700",
              ].join(" ")}
            >
              {statusTarget.action ===
              "SUSPEND" ? (
                <TriangleAlert size={23} />
              ) : (
                <RotateCcw size={22} />
              )}
            </div>

            <h3 className="mt-5 text-xl font-black text-slate-950">
              {statusTarget.action ===
              "SUSPEND"
                ? "Çaktivizo akademinë?"
                : "Riaktivizo akademinë?"}
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {statusTarget.action ===
              "SUSPEND"
                ? `Pronari, stafi dhe sportistët e "${statusTarget.academy.name}" nuk do të mund ta përdorin akademinë derisa ta riaktivizosh. Të dhënat nuk do të fshihen.`
                : `"${statusTarget.academy.name}" do të rikthehet në përdorim dhe përdoruesit do të kenë përsëri akses.`}
            </p>

            {statusError ? (
              <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                {statusError}
              </div>
            ) : null}

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={statusLoading}
                onClick={() => {
                  setStatusTarget(null);
                  setStatusError("");
                }}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="button"
                disabled={statusLoading}
                onClick={
                  updateAcademyStatus
                }
                className={[
                  "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold text-white transition disabled:opacity-60",
                  statusTarget.action ===
                  "SUSPEND"
                    ? "bg-amber-600 hover:bg-amber-700"
                    : "bg-emerald-600 hover:bg-emerald-700",
                ].join(" ")}
              >
                {statusLoading ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : statusTarget.action ===
                  "SUSPEND" ? (
                  <Power size={16} />
                ) : (
                  <RotateCcw size={16} />
                )}

                {statusTarget.action ===
                "SUSPEND"
                  ? "Po, çaktivizoje"
                  : "Po, riaktivizoje"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  const tones = {
    "Akademi totale":
      "border-violet-200 bg-gradient-to-br from-violet-100 via-violet-50/70 to-white",
    "Në trial":
      "border-sky-200 bg-gradient-to-br from-sky-100 via-sky-50/70 to-white",
    "Akademi aktive":
      "border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50/70 to-white",
    "Çaktivizuara":
      "border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50/70 to-white",
  } as const;

  return (
    <div
      className={[
        "rounded-[24px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        tones[title as keyof typeof tones] ??
          "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-slate-100">
        {icon}
      </div>

      <p className="mt-4 text-xs font-bold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}
function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-2xl px-3.5 py-2 text-xs font-bold transition",
        active
          ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
          : "border border-slate-200 bg-white text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-3 py-3 shadow-sm">
      <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-violet-200 hover:bg-violet-50/40">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          {icon}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-3 break-words text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}
function AcademyStatus({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    TRIAL:
      "bg-blue-50 text-blue-700",
    ACTIVE:
      "bg-emerald-50 text-emerald-700",
    SUSPENDED:
      "bg-amber-50 text-amber-700",
    INACTIVE:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ??
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

function SubscriptionStatus({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    TRIALING:
      "bg-violet-50 text-violet-700",
    ACTIVE:
      "bg-emerald-50 text-emerald-700",
    PAST_DUE:
      "bg-amber-50 text-amber-700",
    EXPIRED:
      "bg-red-50 text-red-700",
    CANCELLED:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${
        styles[status] ??
        "bg-slate-100 text-slate-600"
      }`}
    >
      {status}
    </span>
  );
}

const MONTHS_SQ = [
  "jan",
  "shk",
  "mar",
  "pri",
  "maj",
  "qer",
  "kor",
  "gus",
  "sht",
  "tet",
  "nën",
  "dhj",
];

function formatDateTime(
  value: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Europe/Tirane",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(
      new Date(value)
    );

  const getPart = (
    type:
      | "day"
      | "month"
      | "year"
      | "hour"
      | "minute"
  ) =>
    parts.find(
      (part) => part.type === type
    )?.value ?? "";

  const day = getPart("day");
  const month =
    Number(getPart("month"));
  const year = getPart("year");
  const hour = getPart("hour");
  const minute = getPart("minute");

  return `${day} ${
    MONTHS_SQ[month - 1] ?? ""
  } ${year}, ${hour}:${minute}`;
}
