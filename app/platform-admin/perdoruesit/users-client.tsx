"use client";

import {
  Building2,
  CheckCircle2,
  Mail,
  Phone,
  Search,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

type Membership = {
  id: string;
  role: string;
  status: string;
  joinedAt: string;

  academy: {
    id: string;
    name: string;
    status: string;
  };
};

type User = {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  emailVerified: boolean;
  phone: string | null;
  role: "PLATFORM_ADMIN" | "USER";
  createdAt: string;

  memberships: Membership[];

  _count: {
    ownedAcademies: number;
    sessions: number;
  };
};

type Filter =
  | "ALL"
  | "PLATFORM_ADMIN"
  | "ACADEMY"
  | "NO_ACADEMY";

export function UsersClient({
  initialUsers,
}: {
  initialUsers: User[];
}) {
  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialUsers[0]?.id ?? null
    );

  const counts = useMemo(
    () => ({
      all: initialUsers.length,

      admins: initialUsers.filter(
        (user) =>
          user.role === "PLATFORM_ADMIN"
      ).length,

      academyUsers:
        initialUsers.filter(
          (user) =>
            user.memberships.some(
              (membership) =>
                membership.status ===
                "ACTIVE"
            )
        ).length,

      verified:
        initialUsers.filter(
          (user) =>
            user.emailVerified
        ).length,
    }),
    [initialUsers]
  );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    return initialUsers.filter(
      (user) => {
        const activeMemberships =
          user.memberships.filter(
            (membership) =>
              membership.status ===
              "ACTIVE"
          );

        if (
          filter ===
            "PLATFORM_ADMIN" &&
          user.role !==
            "PLATFORM_ADMIN"
        ) {
          return false;
        }

        if (
          filter === "ACADEMY" &&
          activeMemberships.length === 0
        ) {
          return false;
        }

        if (
          filter === "NO_ACADEMY" &&
          activeMemberships.length > 0
        ) {
          return false;
        }

        if (!value) {
          return true;
        }

        return [
          user.name,
          user.firstName ?? "",
          user.lastName ?? "",
          user.email,
          user.phone ?? "",
          user.role,
          ...user.memberships.map(
            (membership) =>
              membership.academy.name
          ),
        ].some((field) =>
          field
            .toLowerCase()
            .includes(value)
        );
      }
    );
  }, [
    initialUsers,
    query,
    filter,
  ]);

  const selected =
    visible.find(
      (user) =>
        user.id === selectedId
    ) ??
    visible[0] ??
    null;

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Përdoruesit
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Monitoro llogaritë dhe aksesin e
          përdoruesve në platformë.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Përdorues total"
          value={counts.all}
          icon={
            <UsersRound size={18} />
          }
        />

        <Stat
          title="Platform Admin"
          value={counts.admins}
          icon={
            <ShieldCheck size={18} />
          }
        />

        <Stat
          title="Me akademi aktive"
          value={
            counts.academyUsers
          }
          icon={
            <Building2 size={18} />
          }
        />

        <Stat
          title="Email i verifikuar"
          value={counts.verified}
          icon={
            <CheckCircle2 size={18} />
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-md">
          <Search
            size={17}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Kërko emër, email, telefon ose akademi..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto">
          <FilterButton
            active={
              filter === "ALL"
            }
            onClick={() =>
              setFilter("ALL")
            }
          >
            Të gjithë {counts.all}
          </FilterButton>

          <FilterButton
            active={
              filter ===
              "PLATFORM_ADMIN"
            }
            onClick={() =>
              setFilter(
                "PLATFORM_ADMIN"
              )
            }
          >
            Admin {counts.admins}
          </FilterButton>

          <FilterButton
            active={
              filter === "ACADEMY"
            }
            onClick={() =>
              setFilter("ACADEMY")
            }
          >
            Me akademi{" "}
            {counts.academyUsers}
          </FilterButton>

          <FilterButton
            active={
              filter === "NO_ACADEMY"
            }
            onClick={() =>
              setFilter(
                "NO_ACADEMY"
              )
            }
          >
            Pa akademi{" "}
            {counts.all -
              counts.academyUsers}
          </FilterButton>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">
              Lista e përdoruesve
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {visible.length} rezultate
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <UsersRound
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nuk u gjet asnjë përdorues.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              {visible.map(
                (user) => {
                  const active =
                    user.memberships.filter(
                      (
                        membership
                      ) =>
                        membership.status ===
                        "ACTIVE"
                    );

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() =>
                        setSelectedId(
                          user.id
                        )
                      }
                      className={[
                        "block w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0",
                        selected?.id ===
                        user.id
                          ? "bg-blue-50/70"
                          : "hover:bg-slate-50",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {user.name}
                          </p>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {user.email}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {active.length > 0
                              ? `${active.length} akademi aktive`
                              : "Pa akademi aktive"}
                          </p>
                        </div>

                        {user.role ===
                        "PLATFORM_ADMIN" ? (
                          <PlatformBadge />
                        ) : null}
                      </div>
                    </button>
                  );
                }
              )}
            </div>
          )}
        </section>

        <section className="min-w-0">
          {!selected ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div>
                <UserRound
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Zgjidh një përdorues
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      {selected.role ===
                      "PLATFORM_ADMIN" ? (
                        <PlatformBadge />
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                          USER
                        </span>
                      )}

                      {selected.emailVerified ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                          Email i verifikuar
                        </span>
                      ) : (
                        <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold text-amber-700">
                          Email i paverifikuar
                        </span>
                      )}
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      {selected.name}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Regjistruar më{" "}
                      {formatDateTime(
                        selected.createdAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Sesione
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {
                        selected._count
                          .sessions
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
                <Info
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  label="Emri"
                  value={selected.name}
                />

                <Info
                  icon={
                    <Mail size={15} />
                  }
                  label="Email"
                  value={selected.email}
                />

                <Info
                  icon={
                    <Phone size={15} />
                  }
                  label="Telefon"
                  value={
                    selected.phone ||
                    "—"
                  }
                />

                <Info
                  icon={
                    <ShieldCheck
                      size={15}
                    />
                  }
                  label="Roli i platformës"
                  value={selected.role}
                />
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Akademitë
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Membership-et e përdoruesit.
                    </p>
                  </div>

                  <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {
                      selected.memberships
                        .length
                    }
                  </span>
                </div>

                {selected.memberships
                  .length === 0 ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Ky përdorues nuk është
                    pjesë e asnjë akademie.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selected.memberships.map(
                      (membership) => (
                        <div
                          key={
                            membership.id
                          }
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-900">
                                {
                                  membership
                                    .academy
                                    .name
                                }
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                Roli:{" "}
                                {
                                  membership.role
                                }
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                Anëtar që prej{" "}
                                {formatDateTime(
                                  membership.joinedAt
                                )}
                              </p>
                            </div>

                            <MembershipBadge
                              status={
                                membership.status
                              }
                            />
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
              </div>

              {selected._count
                .ownedAcademies > 0 ? (
                <div className="border-t border-slate-100 p-5 sm:p-6">
                  <div className="flex items-center gap-3 rounded-xl bg-blue-50 px-4 py-3 text-blue-700">
                    <Building2 size={18} />

                    <p className="text-sm font-semibold">
                      Ky përdorues është
                      pronar i{" "}
                      {
                        selected._count
                          .ownedAcademies
                      }{" "}
                      akademive.
                    </p>
                  </div>
                </div>
              ) : null}
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

function PlatformBadge() {
  return (
    <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
      PLATFORM ADMIN
    </span>
  );
}

function MembershipBadge({
  status,
}: {
  status: string;
}) {
  const styles: Record<
    string,
    string
  > = {
    ACTIVE:
      "bg-emerald-50 text-emerald-700",
    INVITED:
      "bg-blue-50 text-blue-700",
    SUSPENDED:
      "bg-amber-50 text-amber-700",
    REMOVED:
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
      (part) =>
        part.type === type
    )?.value ?? "";

  const day = getPart("day");
  const month =
    Number(getPart("month"));
  const year =
    getPart("year");
  const hour =
    getPart("hour");
  const minute =
    getPart("minute");

  return `${day} ${
    MONTHS_SQ[month - 1] ?? ""
  } ${year}, ${hour}:${minute}`;
}