"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Archive,
  BellRing,
  Loader2,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

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
      <PageHeader
        title="Njoftimet"
        description="Krijo dhe menaxho njoftimet e akademisë dhe të ekipeve."
      />

      <div className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            label="Njoftime gjithsej"
            value={
              data?.summary.total ?? 0
            }
          />

          <StatCard
            label="Aktive"
            value={
              data?.summary.active ?? 0
            }
          />

          <StatCard
            label="Të rëndësishme"
            value={
              data?.summary.important ??
              0
            }
          />

          <StatCard
            label="Urgjente"
            value={
              data?.summary.urgent ?? 0
            }
          />
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
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
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-slate-400"
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
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
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
          <div className="flex min-h-52 items-center justify-center rounded-2xl border border-slate-200 bg-white">
            <Loader2 className="h-6 w-6 animate-spin text-slate-500" />
          </div>
        ) : notifications.length ===
          0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
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
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-slate-950">
                          {
                            notification.title
                          }
                        </h2>

                        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">
                          {prioritetiShqip(
                            notification.priority
                          )}
                        </span>

                        <span className="rounded-full border border-slate-200 px-2.5 py-1 text-xs font-semibold text-slate-600">
                          {statusiShqip(
                            notification.status
                          )}
                        </span>
                      </div>

                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {
                          notification.message
                        }
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 space-y-1 text-sm text-slate-500">
                    <p>
                      Audienca:{" "}
                      <span className="font-semibold text-slate-700">
                        {notification.audience ===
                        "ALL"
                          ? "E gjithë akademia"
                          : notification.team
                              ?.name ??
                            "Ekip"}
                      </span>
                    </p>

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
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
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
                      className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
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
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-3 text-2xl font-bold text-slate-950">
        {value}
      </p>
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
      <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
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
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-400"
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
            className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
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