"use client";

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
  WalletCards,
  X
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";

type NavItem = { label: string; href: string; icon: React.ElementType };

type NavGroup = { title: string; items: NavItem[] };

const groups: NavGroup[] = [
  {
    title: "TË PËRGJITHSHME",
    items: [
      { label: "Paneli kryesor", href: "/", icon: LayoutDashboard },
      { label: "Kalendari", href: "/kalendari", icon: CalendarDays },
      { label: "Ushtrimet", href: "/ushtrimet", icon: Dumbbell },
      { label: "Taktikat", href: "/taktikat", icon: Target },
      { label: "Baza e njohurive", href: "/baza-njohurive", icon: BookOpen }
    ]
  },
  {
    title: "MENAXHIMI SPORTIV",
    items: [
      { label: "Ekipet", href: "/ekipet", icon: ShieldCheck },
      { label: "Sportistët", href: "/anetaret", icon: UsersRound },
      { label: "Kujdestarët", href: "/kujdestaret", icon: ContactRound },
      { label: "Njoftimet", href: "/njoftimet", icon: BellRing },
      { label: "Trajnerët", href: "/trajneret", icon: Dumbbell },
      { label: "Seancat stërvitore", href: "/seancat", icon: ClipboardCheck },
      { label: "Ndeshjet", href: "/ndeshjet", icon: Medal },
      { label: "Performanca", href: "/performanca", icon: BarChart3 },
      { label: "Skautimi", href: "/skautimi", icon: ScanSearch }
    ]
  },
  {
    title: "ADMINISTRIMI",
    items: [
      { label: "Pagesat", href: "/pagesat", icon: ReceiptText },
      { label: "Financa", href: "/financa", icon: CircleDollarSign },
      { label: "Shpenzimet", href: "/shpenzimet", icon: WalletCards },
      { label: "Raportet", href: "/raportet", icon: FileBarChart },
      { label: "Cilësimet", href: "/cilesimet", icon: Settings }
    ]
  }
];

export function Sidebar({ mobile = false, onClose }: { mobile?: boolean; onClose?: () => void }) {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "flex h-full w-[265px] shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-5",
        mobile && "w-[285px] shadow-2xl"
      )}
    >
      <div className="mb-6 flex items-center justify-between px-2">
        <Logo />
        {mobile && (
          <button onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100" aria-label="Mbyll menunë">
            <X size={20} />
          </button>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto pr-1">
        {groups.map((group) => (
          <div key={group.title} className="mb-6">
            <p className="mb-2 px-3 text-[10px] font-semibold tracking-[0.08em] text-slate-400">{group.title}</p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const active = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition",
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"
                    )}
                  >
                    <Icon size={18} strokeWidth={1.8} />
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
