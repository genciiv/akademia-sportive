"use client";

import {
  Ban,
  Building2,
  CheckCircle2,
  KeyRound,
  LogOut,
  Mail,
  Phone,
  Power,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
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
  isActive: boolean;
  mustChangePassword: boolean;
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

type ActionType =
  | "ACCESS"
  | "SESSIONS"
  | "RESET"
  | "DELETE"
  | null;

export function UsersClient({
  initialUsers,
  currentAdminId,
}: {
  initialUsers: User[];
  currentAdminId: string;
}) {
  const [users, setUsers] =
    useState(initialUsers);

  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialUsers[0]?.id ?? null
    );

  const [pendingAction, setPendingAction] =
    useState<ActionType>(null);

  const [feedback, setFeedback] =
    useState<{
      type: "success" | "error";
      message: string;
    } | null>(null);

  const [temporaryPassword, setTemporaryPassword] =
    useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] =
    useState<User | null>(null);

  const [deleteConfirmation, setDeleteConfirmation] =
    useState("");

  const counts = useMemo(
    () => ({
      all: users.length,

      admins: users.filter(
        (user) =>
          user.role ===
          "PLATFORM_ADMIN"
      ).length,

      academyUsers:
        users.filter(
          (user) =>
            user.memberships.some(
              (membership) =>
                membership.status ===
                "ACTIVE"
            )
        ).length,

      verified:
        users.filter(
          (user) =>
            user.emailVerified
        ).length,

      active:
        users.filter(
          (user) =>
            user.isActive
        ).length,

      anomalies:
        users.filter(
          (user) =>
            user.role !==
              "PLATFORM_ADMIN" &&
            user.memberships.length === 0 &&
            user._count.ownedAcademies === 0
        ).length,
    }),
    [users]
  );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    return users.filter(
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
          filter ===
          "NO_ACADEMY"
        ) {
          const isAnomaly =
            user.role !==
              "PLATFORM_ADMIN" &&
            user.memberships.length === 0 &&
            user._count
              .ownedAcademies === 0;

          if (!isAnomaly) {
            return false;
          }
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
    users,
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

  function updateUser(
    userId: string,
    updater: (
      user: User
    ) => User
  ) {
    setUsers((current) =>
      current.map((user) =>
        user.id === userId
          ? updater(user)
          : user
      )
    );
  }

  async function toggleAccess(
    user: User
  ) {
    const nextState =
      !user.isActive;

    setFeedback(null);
    setPendingAction("ACCESS");

    try {
      const response =
        await fetch(
          `/api/platform-admin/users/${user.id}/access`,
          {
            method: "PATCH",

            headers: {
              "content-type":
                "application/json",
            },

            body: JSON.stringify({
              isActive:
                nextState,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Veprimi dështoi."
        );
      }

      updateUser(
        user.id,
        (current) => ({
          ...current,
          isActive:
            nextState,
          mustChangePassword:
            nextState
              ? true
              : current.mustChangePassword,

          _count: {
            ...current._count,
            sessions:
              nextState
                ? 0
                : 0,
          },
        })
      );

      if (
        nextState &&
        typeof data.temporaryPassword === "string"
      ) {
        setTemporaryPassword(
          data.temporaryPassword
        );
      } else {
        setTemporaryPassword(
          null
        );
      }

      setFeedback({
        type: "success",
        message: nextState
          ? "Llogaria u aktivizua me sukses."
          : "Llogaria u bllokua dhe sesionet u mbyllën.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Veprimi dështoi.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function revokeSessions(
    user: User
  ) {
    setFeedback(null);
    setPendingAction("SESSIONS");

    try {
      const response =
        await fetch(
          `/api/platform-admin/users/${user.id}/sessions`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Mbyllja e sesioneve dështoi."
        );
      }

      updateUser(
        user.id,
        (current) => ({
          ...current,

          _count: {
            ...current._count,
            sessions: 0,
          },
        })
      );

      setFeedback({
        type: "success",
        message:
          data.revokedSessions === 1
            ? "1 sesion u mbyll."
            : `${data.revokedSessions ?? 0} sesione u mbyllën.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Veprimi dështoi.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function deleteUserPermanently(
    user: User
  ) {
    if (
      deleteConfirmation.trim() !==
      "FSHIJ"
    ) {
      return;
    }

    setFeedback(null);
    setPendingAction("DELETE");

    try {
      const response =
        await fetch(
          `/api/platform-admin/users/${user.id}`,
          {
            method: "DELETE",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Fshirja e përdoruesit dështoi."
        );
      }

      setUsers((current) =>
        current.filter(
          (item) =>
            item.id !== user.id
        )
      );

      setDeleteTarget(null);
      setDeleteConfirmation("");
      setTemporaryPassword(null);

      setSelectedId((current) =>
        current === user.id
          ? null
          : current
      );

      setFeedback({
        type: "success",
        message:
          "Përdoruesi u fshi përgjithmonë nga platforma.",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Fshirja e përdoruesit dështoi.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  async function sendPasswordReset(
    user: User
  ) {
    setFeedback(null);
    setPendingAction("RESET");

    try {
      const response =
        await fetch(
          `/api/platform-admin/users/${user.id}/password-reset`,
          {
            method: "POST",
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Email-i nuk mund të dërgohej."
        );
      }

      setFeedback({
        type: "success",
        message:
          `Linku për rivendosjen e fjalëkalimit iu dërgua ${user.email}.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Veprimi dështoi.",
      });
    } finally {
      setPendingAction(null);
    }
  }

  return (
    <div>
      <section className="mb-6 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
            <UsersRound size={25} />
          </div>

          <div>
            <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
              <Sparkles size={12} />
              Menaxhimi i përdoruesve
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Përdoruesit
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Monitoro llogaritë, aksesin,
              sesionet dhe lidhjen e
              përdoruesve me akademitë.
            </p>
          </div>
        </div>
      </section>

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
          value={counts.academyUsers}
          icon={
            <Building2 size={18} />
          }
        />

        <Stat
          title="Llogari aktive"
          value={counts.active}
          icon={
            <CheckCircle2 size={18} />
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 rounded-[22px] border border-slate-200/80 bg-white p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
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
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition hover:border-slate-300 focus:border-violet-300 focus:ring-4 focus:ring-violet-50"
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
              filter ===
              "NO_ACADEMY"
            }
            onClick={() =>
              setFilter(
                "NO_ACADEMY"
              )
            }
          >
            Anomali{" "}
            {counts.anomalies}
          </FilterButton>
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-sky-50/60 px-5 py-4">
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
            <div className="max-h-[760px] overflow-y-auto">
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
                      onClick={() => {
                        setSelectedId(
                          user.id
                        );

                        setFeedback(
                          null
                        );

                        setTemporaryPassword(
                          null
                        );
                      }}
                      className={[
                        "block w-full border-l-4 border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0",
                        selected?.id ===
                        user.id
                          ? "border-l-violet-600 bg-gradient-to-r from-violet-50 via-white to-white"
                          : "border-l-transparent hover:bg-violet-50/40",
                      ].join(" ")}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {user.name}
                            </p>

                            <span
                              className={[
                                "h-2 w-2 shrink-0 rounded-full",
                                user.isActive
                                  ? "bg-emerald-500"
                                  : "bg-red-500",
                              ].join(" ")}
                            />
                          </div>

                          <p className="mt-1 truncate text-xs text-slate-500">
                            {user.email}
                          </p>

                          <p className="mt-1 text-[11px] text-slate-400">
                            {active.length > 0
                              ? `${active.length} akademi aktive`
                              : user.role === "PLATFORM_ADMIN"
                                ? "Administrator platforme"
                                : "Anomali: pa lidhje me akademi"}
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
            <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-violet-200 bg-violet-50/30 p-8 text-center">
              <div>
                <UserRound
                  size={30}
                  className="mx-auto text-violet-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Zgjidh një përdorues
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/70 via-white to-sky-50/50 p-5 sm:p-6">
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

                      <AccountBadge
                        active={
                          selected.isActive
                        }
                      />

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

                    <h2 className="mt-3 text-xl font-black text-slate-950">
                      {selected.name}
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Regjistruar më{" "}
                      {formatDateTime(
                        selected.createdAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-violet-100 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                      Sesione
                    </p>

                    <p className="mt-1 text-lg font-black text-slate-950">
                      {
                        selected._count
                          .sessions
                      }
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
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

              <div className="border-t border-violet-100 bg-slate-50/30 p-5 sm:p-6">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
                    Siguria e llogarisë
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Menaxho aksesin,
                    sesionet dhe rikuperimin
                    e fjalëkalimit.
                  </p>
                </div>

                {feedback ? (
                  <div
                    className={[
                      "mt-4 rounded-2xl border px-4 py-3 text-sm font-medium",
                      feedback.type ===
                      "success"
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-red-200 bg-red-50 text-red-700",
                    ].join(" ")}
                  >
                    {feedback.message}
                  </div>
                ) : null}

                {temporaryPassword ? (
                  <div className="mt-4 rounded-2xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
                      Fjalëkalimi i përkohshëm
                    </p>

                    <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <code className="break-all rounded-xl bg-white px-3 py-2 text-sm font-black text-slate-950 ring-1 ring-violet-100">
                        {temporaryPassword}
                      </code>

                      <button
                        type="button"
                        onClick={() =>
                          navigator.clipboard.writeText(
                            temporaryPassword
                          )
                        }
                        className="shrink-0 rounded-xl border border-violet-200 bg-white px-4 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
                      >
                        Kopjo fjalëkalimin
                      </button>
                    </div>

                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      Jepja këtë fjalëkalim përdoruesit vetëm një herë.
                      Pas hyrjes së parë do të duhet ta ndryshojë.
                    </p>
                  </div>
                ) : null}

                <div className="mt-4 grid gap-3 lg:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      sendPasswordReset(
                        selected
                      )
                    }
                    disabled={
                      pendingAction !==
                      null
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 text-xs font-bold text-violet-700 transition hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <KeyRound
                      size={16}
                    />

                    {pendingAction ===
                    "RESET"
                      ? "Duke dërguar..."
                      : "Dërgo reset password"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      revokeSessions(
                        selected
                      )
                    }
                    disabled={
                      pendingAction !==
                        null ||
                      selected.id ===
                        currentAdminId
                    }
                    className="flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 text-xs font-bold text-sky-700 transition hover:bg-sky-100 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <LogOut size={16} />

                    {pendingAction ===
                    "SESSIONS"
                      ? "Duke mbyllur..."
                      : "Mbyll sesionet"}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      toggleAccess(
                        selected
                      )
                    }
                    disabled={
                      pendingAction !==
                        null ||
                      selected.id ===
                        currentAdminId ||
                      selected.role ===
                        "PLATFORM_ADMIN"
                    }
                    className={[
                      "flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50",
                      selected.isActive
                        ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                        : "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
                    ].join(" ")}
                  >
                    {selected.isActive ? (
                      <Ban size={16} />
                    ) : (
                      <Power
                        size={16}
                      />
                    )}

                    {pendingAction ===
                    "ACCESS"
                      ? "Duke ruajtur..."
                      : selected.isActive
                        ? "Blloko llogarinë"
                        : "Aktivizo llogarinë"}
                  </button>
                </div>

                {selected.role !== "PLATFORM_ADMIN" ? (
                  <div className="mt-5 rounded-2xl border border-red-200 bg-red-50/60 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.12em] text-red-700">
                          Zona e rrezikut
                        </p>

                        <p className="mt-1 text-xs leading-5 text-red-600">
                          Fshirja është përfundimtare dhe nuk mund të rikthehet.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setDeleteTarget(
                            selected
                          );

                          setDeleteConfirmation(
                            ""
                          );

                          setFeedback(
                            null
                          );
                        }}
                        disabled={
                          pendingAction !== null ||
                          selected._count
                            .ownedAcademies > 0
                        }
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 size={15} />
                        Fshi përdoruesin
                      </button>
                    </div>

                    {selected._count.ownedAcademies > 0 ? (
                      <p className="mt-3 text-[11px] text-red-600">
                        Ky përdorues është owner i një akademie dhe nuk mund të fshihet pa transferuar ose mbyllur akademinë.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {selected.id ===
                currentAdminId ? (
                  <p className="mt-3 text-[11px] text-slate-400">
                    Veprimet që mund të
                    mbyllin aksesin tënd janë
                    të çaktivizuara për
                    siguri.
                  </p>
                ) : selected.role ===
                  "PLATFORM_ADMIN" ? (
                  <p className="mt-3 text-[11px] text-slate-400">
                    Llogaritë Platform Admin
                    janë të mbrojtura nga
                    bllokimi me këtë veprim.
                  </p>
                ) : null}
              </div>

              <div className="border-t border-violet-100 bg-slate-50/30 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
                      Akademitë
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Membership-et e përdoruesit.
                    </p>
                  </div>

                  <span className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 shadow-sm">
                    {
                      selected.memberships
                        .length
                    }
                  </span>
                </div>

                {selected.memberships
                  .length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-white p-4 text-sm text-slate-500">
                    {selected.role === "PLATFORM_ADMIN"
                      ? "Platform Admin nuk ka nevojë të jetë pjesë e një akademie."
                      : "Ky USER nuk ka lidhje me asnjë akademi. Kjo konsiderohet anomali administrative."}
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selected.memberships.map(
                      (membership) => (
                        <div
                          key={
                            membership.id
                          }
                          className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-violet-200"
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
                <div className="border-t border-violet-100 p-5 sm:p-6">
                  <div className="flex items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sky-700">
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

      {deleteTarget ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-md rounded-[24px] border border-red-100 bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <Trash2 size={21} />
            </div>

            <h3 className="mt-4 text-xl font-black text-slate-950">
              Fshi përdoruesin përgjithmonë?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Po fshini{" "}
              <strong>
                {deleteTarget.name}
              </strong>{" "}
              ({deleteTarget.email}).
              Ky veprim e heq llogarinë dhe nuk mund të rikthehet.
            </p>

            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-800">
                Për të konfirmuar, shkruaj:
              </p>

              <p className="mt-1 text-sm font-black tracking-widest text-red-700">
                FSHIJ
              </p>
            </div>

            <input
              value={deleteConfirmation}
              onChange={(event) =>
                setDeleteConfirmation(
                  event.target.value
                )
              }
              placeholder="Shkruaj FSHIJ"
              className="mt-4 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
            />

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeleteTarget(null);
                  setDeleteConfirmation("");
                }}
                disabled={
                  pendingAction ===
                  "DELETE"
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={() =>
                  deleteUserPermanently(
                    deleteTarget
                  )
                }
                disabled={
                  deleteConfirmation.trim() !==
                    "FSHIJ" ||
                  pendingAction ===
                    "DELETE"
                }
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {pendingAction ===
                "DELETE"
                  ? "Duke fshirë..."
                  : "Fshi përgjithmonë"}
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
    "Përdorues total":
      "border-violet-200 bg-gradient-to-br from-violet-100 via-violet-50/70 to-white",

    "Platform Admin":
      "border-sky-200 bg-gradient-to-br from-sky-100 via-sky-50/70 to-white",

    "Me akademi aktive":
      "border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50/70 to-white",

    "Llogari aktive":
      "border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50/70 to-white",
  } as const;

  return (
    <div
      className={[
        "rounded-[24px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        tones[
          title as keyof typeof tones
        ] ??
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

function PlatformBadge() {
  return (
    <span className="shrink-0 rounded-full bg-violet-100 px-2.5 py-1 text-[10px] font-bold text-violet-700">
      PLATFORM ADMIN
    </span>
  );
}

function AccountBadge({
  active,
}: {
  active: boolean;
}) {
  return (
    <span
      className={[
        "rounded-full px-2.5 py-1 text-[10px] font-bold",
        active
          ? "bg-emerald-50 text-emerald-700"
          : "bg-red-50 text-red-700",
      ].join(" ")}
    >
      {active
        ? "LLOGARI AKTIVE"
        : "E BLLOKUAR"}
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
    Number(
      getPart("month")
    );

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