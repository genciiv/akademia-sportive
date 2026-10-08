"use client";

import {
  AlertTriangle,
  Bell,
  Check,
  CheckCheck,
  ChevronRight,
  Megaphone,
  ShieldAlert,
  UsersRound,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useState,
} from "react";

type NotificationItem = {
  id: string;
  title: string;
  message: string;
  href: string | null;

  audience:
    | "ALL"
    | "TEAM";

  priority:
    | "NORMAL"
    | "IMPORTANT"
    | "URGENT";

  publishedAt: string;

  team: {
    id: string;
    name: string;
  } | null;

  isRead: boolean;
};

function notificationVisual(
  notification: NotificationItem
) {
  if (
    notification.priority ===
    "URGENT"
  ) {
    return {
      Icon: ShieldAlert,
      iconClass:
        "bg-rose-100 text-rose-700",
      badgeClass:
        "bg-rose-100 text-rose-700",
      label: "Urgjente",
    };
  }

  if (
    notification.priority ===
    "IMPORTANT"
  ) {
    return {
      Icon: Megaphone,
      iconClass:
        "bg-amber-100 text-amber-700",
      badgeClass:
        "bg-amber-100 text-amber-700",
      label: "E rëndësishme",
    };
  }

  if (
    notification.audience ===
    "TEAM"
  ) {
    return {
      Icon: UsersRound,
      iconClass:
        "bg-violet-100 text-violet-700",
      badgeClass:
        "bg-violet-100 text-violet-700",
      label: "Ekipi",
    };
  }

  return {
    Icon: Bell,
    iconClass:
      "bg-blue-100 text-blue-700",
    badgeClass:
      "bg-blue-100 text-blue-700",
    label: "Njoftim",
  };
}

function formatDateTime(
  value: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Europe/Tirane",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }
    ).formatToParts(
      new Date(value)
    );

  const get = (
    type: string
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} · ${get("hour")}:${get("minute")}`;
}

function notifyTopbar() {
  window.dispatchEvent(
    new CustomEvent(
      "athlete-notifications-updated"
    )
  );
}

export function AthleteNotificationList({
  initialNotifications,
}: {
  initialNotifications:
    NotificationItem[];
}) {
  const router =
    useRouter();

  const [
    notifications,
    setNotifications,
  ] = useState(
    initialNotifications
  );

  const [
    markingAll,
    setMarkingAll,
  ] = useState(false);

  async function markRead(
    notification:
      NotificationItem
  ) {
    if (!notification.isRead) {
      const response =
        await fetch(
          `/api/athlete/notifications/${notification.id}/read`,
          {
            method: "POST",
          }
        );

      if (response.ok) {
        setNotifications(
          (current) =>
            current.map(
              (item) =>
                item.id ===
                notification.id
                  ? {
                      ...item,
                      isRead:
                        true,
                    }
                  : item
            )
        );

        notifyTopbar();
      }
    }

    if (notification.href) {
      router.push(
        notification.href
      );
    }
  }

  async function markAllRead() {
    if (markingAll) {
      return;
    }

    setMarkingAll(true);

    try {
      const response =
        await fetch(
          "/api/athlete/notifications",
          {
            method:
              "PATCH",
          }
        );

      if (!response.ok) {
        return;
      }

      setNotifications(
        (current) =>
          current.map(
            (item) => ({
              ...item,
              isRead: true,
            })
          )
      );

      notifyTopbar();
    } finally {
      setMarkingAll(false);
    }
  }

  const unreadCount =
    notifications.filter(
      (item) =>
        !item.isRead
    ).length;

  if (
    notifications.length === 0
  ) {
    return (
      <div className="rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-sm">
        <Bell
          size={32}
          className="mx-auto text-slate-300"
        />

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          Nuk ka njoftime
        </h2>

        <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
          Njoftimet e publikuara nga akademia për ty ose ekipin tënd do të shfaqen këtu.
        </p>
      </div>
    );
  }

  return (
    <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
            Inbox
          </p>

          <h2 className="mt-1 text-lg font-bold text-slate-950">
            Njoftimet e mia
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            {unreadCount === 0
              ? "Të gjitha njoftimet janë lexuar."
              : `${unreadCount} njoftime të palexuara.`}
          </p>
        </div>

        {unreadCount > 0 ? (
          <button
            type="button"
            onClick={
              markAllRead
            }
            disabled={
              markingAll
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:opacity-60"
          >
            <CheckCheck
              size={16}
            />

            {markingAll
              ? "Duke përditësuar..."
              : "Shëno të gjitha si të lexuara"}
          </button>
        ) : null}
      </div>

      <div className="mt-6 space-y-3">
        {notifications.map(
          (notification) => {
            const visual =
              notificationVisual(
                notification
              );

            const Icon =
              visual.Icon;

            return (
              <button
                key={
                  notification.id
                }
                type="button"
                onClick={() =>
                  markRead(
                    notification
                  )
                }
                className={[
                  "group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2",
                  notification.isRead
                    ? "border-slate-100 bg-slate-50/60 hover:border-slate-200"
                    : "border-blue-100 bg-blue-50/50 shadow-sm hover:border-blue-200",
                ].join(" ")}
              >
                <span
                  className={[
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
                    visual.iconClass,
                  ].join(" ")}
                >
                  <Icon
                    size={19}
                  />
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={[
                        "rounded-full px-2.5 py-1 text-[10px] font-bold",
                        visual.badgeClass,
                      ].join(" ")}
                    >
                      {
                        visual.label
                      }
                    </span>

                    {!notification.isRead ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[10px] font-bold text-white">
                        <AlertTriangle
                          size={10}
                        />
                        E re
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">
                        <Check
                          size={11}
                        />
                        Lexuar
                      </span>
                    )}
                  </div>

                  <h3 className={[
                    "mt-3 text-sm text-slate-900",
                    notification.isRead
                      ? "font-semibold"
                      : "font-black",
                  ].join(" ")}>
                    {
                      notification.title
                    }
                  </h3>

                  <p className="mt-1.5 line-clamp-3 text-sm leading-6 text-slate-500">
                    {
                      notification.message
                    }
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
                    <span>
                      {formatDateTime(
                        notification.publishedAt
                      )}
                    </span>

                    {notification.team ? (
                      <>
                        <span>
                          ·
                        </span>

                        <span className="font-medium text-violet-600">
                          {
                            notification.team.name
                          }
                        </span>
                      </>
                    ) : null}
                  </div>
                </div>

                {notification.href ? (
                  <ChevronRight
                    size={18}
                    className="mt-3 shrink-0 text-slate-300 transition group-hover:text-blue-600"
                  />
                ) : null}
              </button>
            );
          }
        )}
      </div>
    </section>
  );
}