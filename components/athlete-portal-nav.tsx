"use client";

import {
  Activity,
  Bell,
  CalendarDays,
  ClipboardCheck,
  Dumbbell,
  Goal,
  Layers3,
  LayoutDashboard,
  LibraryBig,
  Settings,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import {
  usePathname,
} from "next/navigation";

import { Logo } from "@/components/logo";

type Props = {
  athleteName: string;
  academyName: string;
  mobile?: boolean;
  onClose?: () => void;
};

const groups = [
  {
    title: "PORTALI",
    items: [
      {
        href: "/sportist/dashboard",
        label: "Përmbledhje",
        icon: LayoutDashboard,
      },
      {
        href: "/sportist/orari",
        label: "Orari",
        icon: CalendarDays,
      },
      {
        href: "/sportist/ndeshjet",
        label: "Ndeshjet",
        icon: Trophy,
      },
      {
        href: "/sportist/prezenca",
        label: "Prezenca",
        icon: ClipboardCheck,
      },
    ],
  },
  {
    title: "PERFORMANCA",
    items: [
      {
        href: "/sportist/performanca",
        label: "Performanca",
        icon: Activity,
      },
      {
        href: "/sportist/profili-fizik",
        label: "Profili fizik",
        icon: Dumbbell,
      },
    ],
  },
  {
    title: "STËRVITJA",
    items: [
      {
        href: "/sportist/ushtrimet",
        label: "Ushtrimet",
        icon: Layers3,
      },
      {
        href: "/sportist/taktikat",
        label: "Taktikat",
        icon: Goal,
      },
    ],
  },
  {
    title: "MATERIALE",
    items: [
      {
        href: "/sportist/baza-e-njohurive",
        label: "Baza e njohurive",
        icon: LibraryBig,
      },
      {
        href: "/sportist/njoftimet",
        label: "Njoftimet",
        icon: Bell,
      },
    ],
  },
  {
    title: "LLOGARIA",
    items: [
      {
        href: "/sportist/llogaria",
        label: "Llogaria ime",
        icon: Settings,
      },
    ],
  },
] as const;

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

export function AthletePortalNav({
  athleteName,
  academyName,
  mobile = false,
  onClose,
}: Props) {
  const pathname =
    usePathname();

  return (
    <aside
      className={[
        "flex h-full w-[265px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5",
        mobile
          ? "w-[285px] shadow-2xl"
          : "",
      ].join(" ")}
    >
      <div className="mb-5 flex items-start justify-between px-2">
        <div>
          <Logo />

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-violet-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-violet-700">
            <UserRound size={12} />
            Athlete Portal
          </div>
        </div>

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Mbyll menunë"
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      <div className="mb-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-violet-50 p-3.5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-xs font-bold text-blue-700 shadow-sm">
            {initials(
              athleteName
            )}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-slate-900">
              {athleteName}
            </p>

            <p className="mt-0.5 truncate text-[11px] text-slate-500">
              {academyName}
            </p>

            <span className="mt-1.5 inline-flex rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-emerald-700">
              Aktiv
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        {groups.map(
          (group) => (
            <div
              key={group.title}
              className="mb-6"
            >
              <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.08em] text-slate-400">
                {group.title}
              </p>

              <div className="space-y-1">
                {group.items.map(
                  (item) => {
                    const Icon =
                      item.icon;

                    const active =
                      pathname ===
                        item.href ||
                      pathname.startsWith(
                        `${item.href}/`
                      );

                    return (
                      <Link
                        key={
                          item.href
                        }
                        href={
                          item.href
                        }
                        onClick={
                          onClose
                        }
                        className={[
                          "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                          active
                            ? "bg-blue-50 text-blue-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                        ].join(" ")}
                      >
                        <span
                          className={[
                            "flex h-8 w-8 items-center justify-center rounded-lg transition",
                            active
                              ? "bg-white text-blue-600 shadow-sm"
                              : "bg-slate-50 text-slate-400",
                          ].join(" ")}
                        >
                          <Icon
                            size={17}
                            strokeWidth={
                              1.8
                            }
                          />
                        </span>

                        <span>
                          {
                            item.label
                          }
                        </span>
                      </Link>
                    );
                  }
                )}
              </div>
            </div>
          )
        )}
      </nav>
    </aside>
  );
}