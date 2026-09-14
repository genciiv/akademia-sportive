"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  CalendarDays,
  CircleDollarSign,
  ContactRound,
  BellRing,
  ClipboardCheck,
  Dumbbell,
  FileBarChart,
  LayoutDashboard,
  Medal,
  ReceiptText,
  ScanSearch,
  Settings,
  ShieldCheck,
  Target,
  UsersRound,
  UserCog,
  WalletCards,
  X,
} from "lucide-react";

import {
  PERMISSIONS,
  type Permission,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavItem = {
  label: string;
  href: string;
  icon: React.ElementType;
  permissions: readonly Permission[];
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

type AcademyAccessResponse = {
  permissions?: Permission[];
};

const groups: NavGroup[] = [
  {
    title: "TË PËRGJITHSHME",
    items: [
      {
        label: "Paneli kryesor",
        href: "/",
        icon: LayoutDashboard,
        permissions: [
          PERMISSIONS.DASHBOARD_VIEW,
        ],
      },
      {
        label: "Kalendari",
        href: "/kalendari",
        icon: CalendarDays,
        permissions: [
          PERMISSIONS.CALENDAR_VIEW,
        ],
      },
      {
        label: "Ushtrimet",
        href: "/ushtrimet",
        icon: Dumbbell,
        permissions: [
          PERMISSIONS.DRILLS_VIEW,
        ],
      },
      {
        label: "Taktikat",
        href: "/taktikat",
        icon: Target,
        permissions: [
          PERMISSIONS.TACTICS_VIEW,
        ],
      },
      {
        label: "Baza e njohurive",
        href: "/baza-njohurive",
        icon: BookOpen,
        permissions: [
          PERMISSIONS.KNOWLEDGE_VIEW,
        ],
      },
    ],
  },
  {
    title: "MENAXHIMI SPORTIV",
    items: [
      {
        label: "Ekipet",
        href: "/ekipet",
        icon: ShieldCheck,
        permissions: [
          PERMISSIONS.TEAMS_VIEW,
        ],
      },
      {
        label: "Sportistët",
        href: "/anetaret",
        icon: UsersRound,
        permissions: [
          PERMISSIONS.PLAYERS_VIEW,
        ],
      },
      {
        label: "Kujdestarët",
        href: "/kujdestaret",
        icon: ContactRound,
        permissions: [
          PERMISSIONS.GUARDIANS_VIEW,
        ],
      },
      {
        label: "Njoftimet",
        href: "/njoftimet",
        icon: BellRing,
        permissions: [
          PERMISSIONS.NOTIFICATIONS_VIEW,
        ],
      },
      {
        label: "Trajnerët",
        href: "/trajneret",
        icon: Dumbbell,
        permissions: [
          PERMISSIONS.COACHES_VIEW,
        ],
      },
      {
        label: "Seancat stërvitore",
        href: "/seancat",
        icon: ClipboardCheck,
        permissions: [
          PERMISSIONS.TRAINING_VIEW,
        ],
      },
      {
        label: "Ndeshjet",
        href: "/ndeshjet",
        icon: Medal,
        permissions: [
          PERMISSIONS.MATCHES_VIEW,
        ],
      },
      {
        label: "Performanca",
        href: "/performanca",
        icon: BarChart3,
        permissions: [
          PERMISSIONS.PERFORMANCE_VIEW,
        ],
      },
      {
        label: "Skautimi",
        href: "/skautimi",
        icon: ScanSearch,
        permissions: [
          PERMISSIONS.SCOUTING_VIEW,
        ],
      },
    ],
  },
  {
    title: "ADMINISTRIMI",
    items: [
      {
        label: "Stafi",
        href: "/stafi",
        icon: UserCog,
        permissions: [
          PERMISSIONS.STAFF_VIEW,
        ],
      },
      {
        label: "Pagesat",
        href: "/pagesat",
        icon: ReceiptText,
        permissions: [
          PERMISSIONS.PAYMENTS_VIEW,
        ],
      },
      {
        label: "Financa",
        href: "/financa",
        icon: CircleDollarSign,
        permissions: [
          PERMISSIONS.FINANCE_VIEW,
        ],
      },
      {
        label: "Shpenzimet",
        href: "/shpenzimet",
        icon: WalletCards,
        permissions: [
          PERMISSIONS.EXPENSES_VIEW,
        ],
      },
      {
        label: "Raportet",
        href: "/raportet",
        icon: FileBarChart,
        permissions: [
          PERMISSIONS.REPORTS_SPORTS_VIEW,
          PERMISSIONS.REPORTS_FINANCE_VIEW,
        ],
      },
      {
        label: "Cilësimet",
        href: "/cilesimet",
        icon: Settings,
        permissions: [
          PERMISSIONS.SETTINGS_VIEW,
        ],
      },
    ],
  },
];

export function Sidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  const [
    permissions,
    setPermissions,
  ] = useState<Permission[] | null>(
    null
  );

  useEffect(() => {
    const controller =
      new AbortController();

    async function loadAccess() {
      try {
        const response = await fetch(
          "/api/academy-access",
          {
            signal:
              controller.signal,
            cache: "no-store",
          }
        );

        if (!response.ok) {
          setPermissions([]);
          return;
        }

        const data =
          (await response.json()) as
            AcademyAccessResponse;

        setPermissions(
          Array.isArray(
            data.permissions
          )
            ? data.permissions
            : []
        );
      } catch (error) {
        if (
          error instanceof Error &&
          error.name === "AbortError"
        ) {
          return;
        }

        setPermissions([]);
      }
    }

    void loadAccess();

    return () => {
      controller.abort();
    };
  }, []);

  const visibleGroups =
    permissions === null
      ? []
      : groups
          .map((group) => ({
            ...group,

            items:
              group.items.filter(
                (item) =>
                  item.permissions.some(
                    (permission) =>
                      permissions.includes(
                        permission
                      )
                  )
              ),
          }))
          .filter(
            (group) =>
              group.items.length > 0
          );

  return (
    <aside
      className={cn(
        "flex h-full w-[265px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5",
        mobile &&
          "w-[285px] shadow-2xl"
      )}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <Logo />

        {mobile ? (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            aria-label="Mbyll menunë"
          >
            <X size={20} />
          </button>
        ) : null}
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        {permissions === null ? (
          <p className="px-3 py-2 text-xs font-medium text-slate-400">
            Duke ngarkuar menunë...
          </p>
        ) : (
          visibleGroups.map(
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
                      const active =
                        pathname ===
                        item.href;

                      const Icon =
                        item.icon;

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
                          className={cn(
                            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                            active
                              ? "bg-blue-50 text-blue-700"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                          )}
                        >
                          <Icon
                            size={18}
                            strokeWidth={
                              1.8
                            }
                          />

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
          )
        )}
      </nav>
    </aside>
  );
}