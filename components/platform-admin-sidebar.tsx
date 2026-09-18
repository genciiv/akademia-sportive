"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CircleDollarSign,
  CreditCard,
  FileBarChart,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  UsersRound,
  ClipboardList,
  X,
} from "lucide-react";

import { Logo } from "@/components/logo";

const groups = [
  {
    title: "PLATFORMA",
    items: [
      {
        label: "Paneli kryesor",
        href: "/platform-admin",
        icon: LayoutDashboard,
      },
      {
        label: "Aplikimet",
        href: "/platform-admin/aplikimet",
        icon: ClipboardList,
      },
      {
        label: "Akademitë",
        href: "/platform-admin/akademite",
        icon: Building2,
      },
      {
        label: "Përdoruesit",
        href: "/platform-admin/perdoruesit",
        icon: UsersRound,
      },
    ],
  },
  {
    title: "FINANCA",
    items: [
      {
        label: "Abonimet",
        href: "/platform-admin/abonimet",
        icon: CreditCard,
      },
      {
        label: "Pagesat",
        href: "/platform-admin/pagesat",
        icon: CircleDollarSign,
      },
      {
        label: "Raportet",
        href: "/platform-admin/raportet",
        icon: FileBarChart,
      },
    ],
  },
  {
    title: "SISTEMI",
    items: [
      {
        label: "Cilësimet",
        href: "/platform-admin/cilesimet",
        icon: Settings,
      },
    ],
  },
];

export function PlatformAdminSidebar({
  mobile = false,
  onClose,
}: {
  mobile?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <aside
      className={[
        "flex h-full w-[265px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5",
        mobile ? "w-[285px] shadow-2xl" : "",
      ].join(" ")}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <div>
          <Logo />

          <div className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.08em] text-blue-700">
            <ShieldCheck size={12} />
            Platform Admin
          </div>
        </div>

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
        {groups.map((group) => (
          <div
            key={group.title}
            className="mb-6"
          >
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.08em] text-slate-400">
              {group.title}
            </p>

            <div className="space-y-1">
              {group.items.map((item) => {
                const active =
                  item.href === "/platform-admin"
                    ? pathname === item.href
                    : pathname === item.href ||
                      pathname.startsWith(
                        `${item.href}/`
                      );

                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={[
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
                    ].join(" ")}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                    />

                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}