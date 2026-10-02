"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  AlertTriangle,
  Archive,
  BellRing,
  CalendarDays,
  CheckCircle2,
  Loader2,
  Megaphone,
  Pencil,
  Plus,
  Search,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";

type Audience =
  | "ALL"
  | "TEAM";

type Priority =
  | "NORMAL"
  | "IMPORTANT"
  | "URGENT";

type Status =
  | "ACTIVE"
  | "ARCHIVED";

type Team = {
  id: string;
  name: string;
};

type Notification = {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  priority: Priority;
  status: Status;
  publishedAt: string;
  expiresAt: string | null;
  teamId: string | null;
  team: Team | null;
};

type ApiResponse = {
  notifications: Notification[];
  teams: Team[];
  summary: {
    total: number;
    active: number;
    important: number;
    urgent: number;
  };
};

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

function dataShqip(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getDate()} ${
    MUAJT[date.getMonth()]
  } ${date.getFullYear()}`;
}

function prioritetiShqip(
  priority: Priority
) {
  if (priority === "URGENT") {
    return "Urgjent";
  }

  if (priority === "IMPORTANT") {
    return "I rëndësishëm";
  }

  return "Normal";
}

function statusiShqip(
  status: Status
) {
  return status === "ACTIVE"
    ? "Aktiv"
    : "Arkivuar";
}

export default function NotificationsClient() {
  const [data, setData] =
    useState<ApiResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<Status | "ALL">("ALL");

  const [
    modalNotification,
    setModalNotification,
  ] =
    useState<
      Notification | "NEW" | null
    >(null);

  const [
    notificationPerFshirje,
    setNotificationPerFshirje,
  ] =
    useState<Notification | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  async function ngarko() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/notifications",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Njoftimet nuk u ngarkuan."
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ngarko();
  }, []);

  const notifications =
    useMemo(() => {
      if (!data) {
        return [];
      }

      const query =
        search.trim().toLowerCase();

      return data.notifications.filter(
        (notification) => {
          const matchesSearch =
            !query ||
            notification.title
              .toLowerCase()
              .includes(query) ||
            notification.message
              .toLowerCase()
              .includes(query) ||
            (
              notification.team?.name ??
              ""
            )
              .toLowerCase()
              .includes(query);

          const matchesStatus =
            statusFilter === "ALL" ||
            notification.status ===
              statusFilter;

          return (
            matchesSearch &&
            matchesStatus
          );
        }
      );
    }, [
      data,
      search,
      statusFilter,
    ]);

  async function ndryshoStatusin(
    notification: Notification
  ) {
    try {
      const response = await fetch(
        `/api/notifications/${notification.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title:
              notification.title,
            message:
              notification.message,
            audience:
              notification.audience,
            priority:
              notification.priority,
            status:
              notification.status ===
              "ACTIVE"
                ? "ARCHIVED"
                : "ACTIVE",
            teamId:
              notification.teamId,
            expiresAt:
              notification.expiresAt,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Statusi nuk u ndryshua."
        );
      }

      await ngarko();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    }
  }

  async function fshi() {
    if (!notificationPerFshirje) {
      return;
    }

    setDeleting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/notifications/${notificationPerFshirje.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Njoftimi nuk u fshi."
        );
      }

      setNotificationPerFshirje(
        null
      );

      await ngarko();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AppShell>
      <section className="relative mb-5 overflow-hidden rounded-[28px] border border-blue-100 bg-gradient-to-br from-blue-50 via-indigo-50/60 to-violet-50 p-5 shadow-sm sm:p-6">
        <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm ring-1 ring-blue-100">
              <Megaphone className="h-6 w-6" />
            </div>

            <div>
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Njoftimet
              </h1>

              <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
                Krijo dhe menaxho komunikimet për akademinë dhe ekipet nga një vend i vetëm.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalNotification("NEW")
            }
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Shto njoftim
          </button>
        </div>
      </section>

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Njoftime gjithsej"
            value={data?.summary.total ?? 0}
            description="Të gjitha njoftimet"
            icon={BellRing}
            tone="blue"
          />

          <StatCard
            label="Aktive"
            value={data?.summary.active ?? 0}
            description="Aktive dhe të vlefshme"
            icon={CheckCircle2}
            tone="emerald"
          />

          <StatCard
            label="Të rëndësishme"
            value={data?.summary.important ?? 0}
            description="Prioritet i lartë"
            icon={AlertTriangle}
            tone="amber"
          />

          <StatCard
            label="Urgjente"
            value={data?.summary.urgent ?? 0}
            description="Kërkojnë vëmendje"
            icon={Megaphone}
            tone="rose"
          />
        </div>

        <div className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white p-3 shadow-sm md:flex-row md:items-center md:justify-between">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Kërko njoftimin..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-300 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target
                    .value as
                    | Status
                    | "ALL"
                )
              }
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            >
              <option value="ALL">
                Të gjitha
              </option>

              <option value="ACTIVE">
                Aktive
              </option>

              <option value="ARCHIVED">
                Të arkivuara
              </option>
            </select>
          </div>

          <button
            type="button"
            onClick={() =>
              setModalNotification(
                "NEW"
              )
            }
            className="hidden"
          >
            <Plus className="h-4 w-4" />

            Shto njoftim
          </button>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="flex min-h-56 items-center justify-center rounded-[24px] border border-slate-200 bg-white shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : notifications.length ===
          0 ? (
          <div className="rounded-[24px] border border-dashed border-blue-200 bg-blue-50/30 p-12 text-center">
            <BellRing className="mx-auto h-9 w-9 text-slate-400" />

            <h2 className="mt-4 text-base font-bold text-slate-950">
              Nuk ka njoftime
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Krijo njoftimin e parë
              për akademinë ose për një
              ekip.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-2">
            {notifications.map(
              (notification) => (
                <div
                  key={
                    notification.id
                  }
                  className="group overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/70 via-white to-violet-50/50 p-5">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-950">
                          {
                            notification.title
                          }
                        </h2>

                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${notification.priority === "URGENT" ? "bg-rose-100 text-rose-700" : notification.priority === "IMPORTANT" ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-600"}`}>
                          {prioritetiShqip(
                            notification.priority
                          )}
                        </span>

                        <span className={`rounded-full border px-2.5 py-1 text-xs font-bold ${notification.status === "ACTIVE" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
                          {statusiShqip(
                            notification.status
                          )}
                        </span>
                      </div>

                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {
                          notification.message
                        }
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 p-5 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl bg-slate-50 p-3.5">
                      Audienca:{" "}
                      <span className="font-semibold text-slate-700">
                        {notification.audience ===
                        "ALL"
                          ? "E gjithë akademia"
                          : notification.team
                              ?.name ??
                            "Ekip"}
                      </span>
                    </div>

                    <p>
                      Publikuar më:{" "}
                      <span className="font-semibold text-slate-700">
                        {dataShqip(
                          notification.publishedAt
                        )}
                      </span>
                    </p>

                    {notification.expiresAt ? (
                      <p>
                        Skadon më:{" "}
                        <span className="font-semibold text-slate-700">
                          {dataShqip(
                            notification.expiresAt
                          )}
                        </span>
                      </p>
                    ) : null}
                  </div>

                  <div className="mt-5 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
                    <button
                      type="button"
                      onClick={() =>
                        setModalNotification(
                          notification
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Pencil className="h-4 w-4" />

                      Ndrysho
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        ndryshoStatusin(
                          notification
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <Archive className="h-4 w-4" />

                      {notification.status ===
                      "ACTIVE"
                        ? "Arkivo"
                        : "Riaktivizo"}
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        setNotificationPerFshirje(
                          notification
                        )
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 shadow-sm transition hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />

                      Fshi
                    </button>
                  </div>
                </div>
              )
            )}
          </div>
        )}
      </div>

      {modalNotification ? (
        <NotificationModal
          notification={
            modalNotification
          }
          teams={
            data?.teams ?? []
          }
          onClose={() =>
            setModalNotification(null)
          }
          onSaved={async () => {
            setModalNotification(null);
            await ngarko();
          }}
        />
      ) : null}

      {notificationPerFshirje ? (
        <ConfirmModal
          title="Fshi njoftimin"
          message={`A je i sigurt që dëshiron të fshish njoftimin “${notificationPerFshirje.title}”?`}
          loading={deleting}
          onCancel={() =>
            setNotificationPerFshirje(
              null
            )
          }
          onConfirm={fshi}
        />
      ) : null}
    </AppShell>
  );
}

function StatCard({
  label,
  value,
  description,
  icon: Icon,
  tone,
}: {
  label: string;
  value: number;
  description: string;
  icon: React.ElementType;
  tone:
    | "blue"
    | "emerald"
    | "amber"
    | "rose";
}) {
  const styles = {
    blue: {
      card: "border-blue-100 bg-blue-50/70",
      icon: "text-blue-600 ring-blue-100",
    },
    emerald: {
      card: "border-emerald-100 bg-emerald-50/70",
      icon: "text-emerald-600 ring-emerald-100",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/70",
      icon: "text-amber-600 ring-amber-100",
    },
    rose: {
      card: "border-rose-100 bg-rose-50/70",
      icon: "text-rose-600 ring-rose-100",
    },
  } as const;

  const style = styles[tone];

  return (
    <div
      className={`rounded-[22px] border p-4 shadow-sm sm:p-5 ${style.card}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">
            {label}
          </p>

          <p className="mt-2 text-2xl font-black text-slate-950">
            {value}
          </p>

          <p className="mt-1 text-xs text-slate-500">
            {description}
          </p>
        </div>

        <div
          className={`flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ${style.icon}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function NotificationModal({
  notification,
  teams,
  onClose,
  onSaved,
}: {
  notification:
    | Notification
    | "NEW";
  teams: Team[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const editing =
    notification !== "NEW";

  const [title, setTitle] =
    useState(
      editing
        ? notification.title
        : ""
    );

  const [message, setMessage] =
    useState(
      editing
        ? notification.message
        : ""
    );

  const [audience, setAudience] =
    useState<Audience>(
      editing
        ? notification.audience
        : "ALL"
    );

  const [teamId, setTeamId] =
    useState(
      editing
        ? notification.teamId ?? ""
        : ""
    );

  const [priority, setPriority] =
    useState<Priority>(
      editing
        ? notification.priority
        : "NORMAL"
    );

  const [status, setStatus] =
    useState<Status>(
      editing
        ? notification.status
        : "ACTIVE"
    );

  const [expiresAt, setExpiresAt] =
    useState(
      editing &&
        notification.expiresAt
        ? notification.expiresAt.slice(
            0,
            10
          )
        : ""
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ruaj() {
    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        editing
          ? `/api/notifications/${notification.id}`
          : "/api/notifications",
        {
          method: editing
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            title,
            message,
            audience,
            teamId:
              audience === "TEAM"
                ? teamId
                : null,
            priority,
            status,
            expiresAt:
              expiresAt || null,
          }),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Njoftimi nuk u ruajt."
        );
      }

      await onSaved();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-[28px] border border-slate-200 bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-blue-100 bg-gradient-to-r from-blue-50 via-white to-violet-50 px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-slate-950">
              {editing
                ? "Ndrysho njoftimin"
                : "Shto njoftim"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Plotëso të dhënat e
              njoftimit.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Mbyll"
            className="rounded-xl bg-white p-2 text-slate-500 shadow-sm ring-1 ring-slate-200 transition hover:bg-slate-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-4 p-6">
          <Field label="Titulli">
            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />
          </Field>

          <Field label="Përmbajtja">
            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              rows={5}
              className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
            />
          </Field>

          <Field label="Audienca">
            <select
              value={audience}
              onChange={(event) =>
                setAudience(
                  event.target
                    .value as Audience
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="ALL">
                E gjithë akademia
              </option>

              <option value="TEAM">
                Ekip i caktuar
              </option>
            </select>
          </Field>

          {audience === "TEAM" ? (
            <Field label="Ekipi">
              <select
                value={teamId}
                onChange={(event) =>
                  setTeamId(
                    event.target.value
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              >
                <option value="">
                  Zgjidh ekipin
                </option>

                {teams.map((team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                  </option>
                ))}
              </select>
            </Field>
          ) : null}

          <Field label="Prioriteti">
            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target
                    .value as Priority
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            >
              <option value="NORMAL">
                Normal
              </option>

              <option value="IMPORTANT">
                I rëndësishëm
              </option>

              <option value="URGENT">
                Urgjent
              </option>
            </select>
          </Field>

          {editing ? (
            <Field label="Statusi">
              <select
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target
                      .value as Status
                  )
                }
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
              >
                <option value="ACTIVE">
                  Aktiv
                </option>

                <option value="ARCHIVED">
                  Arkivuar
                </option>
              </select>
            </Field>
          ) : null}

          <Field label="Data e skadimit">
            <input
              type="date"
              value={expiresAt}
              onChange={(event) =>
                setExpiresAt(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-300 focus:ring-4 focus:ring-blue-50"
            />

            <p className="mt-1 text-xs text-slate-500">
              Mund të lihet bosh nëse
              njoftimi nuk ka afat.
            </p>
          </Field>

          {error ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </div>

        <div className="flex justify-end gap-3 border-t border-slate-200 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Anulo
          </button>

          <button
            type="button"
            onClick={ruaj}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}

            Ruaj
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children:
    React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {label}
      </label>

      {children}
    </div>
  );
}

function ConfirmModal({
  title,
  message,
  loading,
  onCancel,
  onConfirm,
}: {
  title: string;
  message: string;
  loading: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="text-lg font-bold text-slate-950">
          {title}
        </h2>

        <p className="mt-2 text-sm leading-6 text-slate-600">
          {message}
        </p>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Anulo
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}

            Fshi
          </button>
        </div>
      </div>
    </div>
  );
}
