"use client";

import {
  Building2,
  CalendarDays,
  MapPin,
  Search,
  ShieldCheck,
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
  | "ACTIVE";

export function AcademiesClient({
  initialAcademies,
}: {
  initialAcademies: Academy[];
}) {
  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialAcademies[0]?.id ?? null
    );

  const counts = useMemo(
    () => ({
      all: initialAcademies.length,

      trial: initialAcademies.filter(
        (academy) =>
          academy.status === "TRIAL"
      ).length,

      active: initialAcademies.filter(
        (academy) =>
          academy.subscription?.status ===
          "ACTIVE"
      ).length,
    }),
    [initialAcademies]
  );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    return initialAcademies.filter(
      (academy) => {
        if (
          filter === "TRIAL" &&
          academy.status !== "TRIAL"
        ) {
          return false;
        }

        if (
          filter === "ACTIVE" &&
          academy.subscription?.status !==
            "ACTIVE"
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
    initialAcademies,
    query,
    filter,
  ]);

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

      <div className="grid gap-4 sm:grid-cols-3">
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
          title="Abonime aktive"
          value={counts.active}
          icon={
            <ShieldCheck size={18} />
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
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
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
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
                    "block w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0",
                    selected?.id ===
                    academy.id
                      ? "bg-blue-50/70"
                      : "hover:bg-slate-50",
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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5 sm:p-6">
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

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
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

              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
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

              <div className="border-t border-slate-100 p-5 sm:p-6">
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

              <div className="border-t border-slate-100 p-5 sm:p-6">
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
            </div>
          )}
        </section>
      </div>
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
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
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
        "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition",
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
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
    <div className="rounded-xl bg-slate-50 px-3 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-950">
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
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
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
