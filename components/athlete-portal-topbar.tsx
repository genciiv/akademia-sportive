"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  Megaphone,
  Menu,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import { authClient } from "@/lib/auth-client";

type Props = {
  athleteName: string;
  academyName: string;
  onMenu: () => void;
};

type NotificationPreview = {
  id: string;
  title: string;
  message: string;
  href: string | null;
  audience: "ALL" | "TEAM";
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

function initials(
  name: string
) {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return "SP";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

function formatNotificationDate(
  value: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Europe/Tirane",
        day: "2-digit",
        month: "2-digit",
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

  return `${get("day")}/${get("month")} · ${get("hour")}:${get("minute")}`;
}

function notificationVisual(
  notification:
    NotificationPreview
) {
  if (
    notification.priority ===
    "URGENT"
  ) {
    return {
      Icon: ShieldAlert,
      className:
        "bg-rose-100 text-rose-700",
    };
  }

  if (
    notification.priority ===
    "IMPORTANT"
  ) {
    return {
      Icon: Megaphone,
      className:
        "bg-amber-100 text-amber-700",
    };
  }

  if (
    notification.audience ===
    "TEAM"
  ) {
    return {
      Icon: UsersRound,
      className:
        "bg-violet-100 text-violet-700",
    };
  }

  return {
    Icon: Bell,
    className:
      "bg-blue-100 text-blue-700",
  };
}

export function AthletePortalTopbar({
  athleteName,
  academyName,
  onMenu,
}: Props) {
  const router =
    useRouter();

  const {
    data: session,
  } = authClient.useSession();

  const [
    menuOpen,
    setMenuOpen,
  ] = useState(false);

  const [
    notificationOpen,
    setNotificationOpen,
  ] = useState(false);

  const [
    signingOut,
    setSigningOut,
  ] = useState(false);

  const [
    unreadCount,
    setUnreadCount,
  ] = useState(0);

  const [
    notifications,
    setNotifications,
  ] = useState<
    NotificationPreview[]
  >([]);

  const profileRef =
    useRef<HTMLDivElement | null>(
      null
    );

  const notificationRef =
    useRef<HTMLDivElement | null>(
      null
    );

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        profileRef.current &&
        !profileRef.current.contains(
          target
        )
      ) {
        setMenuOpen(false);
      }

      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          target
        )
      ) {
        setNotificationOpen(
          false
        );
      }
    }

    document.addEventListener(
      "mousedown",
      handleClickOutside
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, []);

  async function loadNotifications() {
    try {
      const response =
        await fetch(
          "/api/athlete/notifications",
          {
            cache: "no-store",
          }
        );

      if (!response.ok) {
        return;
      }

      const data =
        (await response.json()) as {
          unreadCount?: number;
          notifications?:
            NotificationPreview[];
        };

      setUnreadCount(
        data.unreadCount ??
          0
      );

      setNotifications(
        data.notifications ??
          []
      );
    } catch {
      // Non-critical UI.
    }
  }

  useEffect(() => {
    loadNotifications();

    function handleUpdate() {
      loadNotifications();
    }

    window.addEventListener(
      "athlete-notifications-updated",
      handleUpdate
    );

    return () => {
      window.removeEventListener(
        "athlete-notifications-updated",
        handleUpdate
      );
    };
  }, []);

  async function openNotification(
    notification:
      NotificationPreview
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
        await loadNotifications();

        window.dispatchEvent(
          new CustomEvent(
            "athlete-notifications-updated"
          )
        );
      }
    }

    setNotificationOpen(
      false
    );

    router.push(
      notification.href ||
        "/sportist/njoftimet"
    );
  }

  async function signOut() {
    if (signingOut) {
      return;
    }

    setSigningOut(true);

    try {
      await authClient.signOut();

      router.push("/hyrje");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl p-2 text-slate-600 transition hover:bg-slate-100 lg:hidden"
          aria-label="Hap menunë"
        >
          <Menu size={21} />
        </button>

        <div className="flex items-center gap-2">
          <span className="hidden h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600 sm:flex">
            <ShieldCheck
              size={16}
              strokeWidth={1.8}
            />
          </span>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              Portali i Sportistit
            </p>

            <p className="truncate text-[11px] text-slate-400">
              {academyName}
            </p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <div
          ref={notificationRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() => {
              setNotificationOpen(
                (value) => !value
              );

              setMenuOpen(false);

              if (
                !notificationOpen
              ) {
                loadNotifications();
              }
            }}
            className={[
              "relative flex h-10 w-10 items-center justify-center rounded-xl border transition",
              notificationOpen
                ? "border-blue-200 bg-blue-50 text-blue-700"
                : "border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700",
            ].join(" ")}
            aria-label="Njoftimet"
            aria-expanded={
              notificationOpen
            }
          >
            <Bell size={18} />

            {unreadCount > 0 ? (
              <span className="absolute -right-1 -top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[9px] font-black leading-none text-white">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            ) : null}
          </button>

          {notificationOpen ? (
            <div className="absolute right-0 top-[50px] z-50 w-[340px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[390px]">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3.5">
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    Njoftimet
                  </p>

                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {unreadCount === 0
                      ? "Nuk ke njoftime të palexuara"
                      : `${unreadCount} të palexuara`}
                  </p>
                </div>

                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Bell size={15} />
                </span>
              </div>

              <div className="max-h-[390px] overflow-y-auto p-2">
                {notifications.length ===
                0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bell
                      size={24}
                      className="mx-auto text-slate-300"
                    />

                    <p className="mt-3 text-sm font-semibold text-slate-600">
                      Nuk ka njoftime
                    </p>
                  </div>
                ) : (
                  notifications
                    .slice(0, 5)
                    .map(
                      (
                        notification
                      ) => {
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
                              openNotification(
                                notification
                              )
                            }
                            className={[
                              "flex w-full items-start gap-3 rounded-xl p-3 text-left transition",
                              notification.isRead
                                ? "hover:bg-slate-50"
                                : "bg-blue-50/60 hover:bg-blue-50",
                            ].join(" ")}
                          >
                            <span
                              className={[
                                "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                                visual.className,
                              ].join(" ")}
                            >
                              <Icon
                                size={16}
                              />
                            </span>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-start gap-2">
                                <p
                                  className={[
                                    "line-clamp-1 flex-1 text-xs text-slate-900",
                                    notification.isRead
                                      ? "font-semibold"
                                      : "font-black",
                                  ].join(" ")}
                                >
                                  {
                                    notification.title
                                  }
                                </p>

                                {!notification.isRead ? (
                                  <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                                ) : null}
                              </div>

                              <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-500">
                                {
                                  notification.message
                                }
                              </p>

                              <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                                <span>
                                  {formatNotificationDate(
                                    notification.publishedAt
                                  )}
                                </span>

                                {notification.team ? (
                                  <>
                                    <span>
                                      ·
                                    </span>

                                    <span className="truncate text-violet-600">
                                      {
                                        notification.team.name
                                      }
                                    </span>
                                  </>
                                ) : null}
                              </div>
                            </div>
                          </button>
                        );
                      }
                    )
                )}
              </div>

              <div className="border-t border-slate-100 p-2">
                <Link
                  href="/sportist/njoftimet"
                  onClick={() =>
                    setNotificationOpen(
                      false
                    )
                  }
                  className="flex w-full items-center justify-center rounded-xl px-3 py-2.5 text-xs font-bold text-blue-700 transition hover:bg-blue-50"
                >
                  Shiko të gjitha njoftimet
                </Link>
              </div>
            </div>
          ) : null}
        </div>

        <div
          ref={profileRef}
          className="relative"
        >
          <button
            type="button"
            onClick={() => {
              setMenuOpen(
                (value) =>
                  !value
              );

              setNotificationOpen(
                false
              );
            }}
            className="flex items-center gap-2 rounded-xl px-2 py-1.5 transition hover:bg-slate-50"
            aria-label="Hap profilin"
            aria-expanded={
              menuOpen
            }
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-xs font-bold text-white">
              {initials(
                athleteName
              )}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="max-w-[170px] truncate text-xs font-semibold text-slate-900">
                {athleteName}
              </p>

              <p className="text-[10px] text-slate-400">
                Sportist
              </p>
            </div>

            <ChevronDown
              size={15}
              className="hidden text-slate-400 sm:block"
            />
          </button>

          {menuOpen ? (
            <div className="absolute right-0 top-[52px] z-50 w-60 rounded-xl border border-slate-200 bg-white p-2 shadow-xl">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-900">
                  {athleteName}
                </p>

                <p className="mt-0.5 truncate text-[11px] text-slate-500">
                  {session?.user?.email ||
                    academyName}
                </p>
              </div>

              <Link
                href="/sportist/dashboard"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <UserRound size={16} />
                Përmbledhja sportive
              </Link>

              <Link
                href="/sportist/llogaria"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <UserRound size={16} />
                Llogaria ime
              </Link>
              <Link
                href="/sportist/njoftimet"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-50"
              >
                <span className="flex items-center gap-2">
                  <Bell size={16} />
                  Njoftimet
                </span>

                {unreadCount > 0 ? (
                  <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    {unreadCount}
                  </span>
                ) : null}
              </Link>

              <div className="my-1 border-t border-slate-100" />

              <button
                type="button"
                onClick={signOut}
                disabled={
                  signingOut
                }
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 transition hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={16} />

                {signingOut
                  ? "Duke dalë..."
                  : "Dil"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}