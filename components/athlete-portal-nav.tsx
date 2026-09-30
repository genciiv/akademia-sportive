"use client";

import {
  CalendarDays,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
  Menu,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { authClient } from "@/lib/auth-client";

type AthletePortalNavProps = {
  athleteName: string;
  academyName: string;
};

const navigation = [
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
] as const;

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

export function AthletePortalNav({
  athleteName,
  academyName,
}: AthletePortalNavProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [signingOut, setSigningOut] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleSignOut() {
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

  function navigationLinks(closeMobile = false) {
    return navigation.map((item) => {
      const Icon = item.icon;

      const active =
        pathname === item.href || pathname.startsWith(`${item.href}/`);

      return (
        <Link
          key={item.href}
          href={item.href}
          onClick={() => {
            if (closeMobile) {
              setMobileOpen(false);
            }
          }}
          className={[
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition",
            active
              ? "bg-slate-900 text-white"
              : "text-slate-700 hover:bg-slate-100",
          ].join(" ")}
        >
          <Icon className="h-4 w-4" />

          {item.label}
        </Link>
      );
    });
  }

  const profile = (
    <div className="border-b border-slate-100 p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-900 text-sm font-semibold text-white">
          {initials(athleteName) || <UserRound className="h-4 w-4" />}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-950">
            {athleteName}
          </p>

          <p className="truncate text-xs text-slate-500">
            {academyName}
          </p>
        </div>
      </div>
    </div>
  );

  const logoutButton = (
    <div className="border-t border-slate-100 p-3">
      <button
        type="button"
        onClick={handleSignOut}
        disabled={signingOut}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <LogOut className="h-4 w-4" />

        {signingOut ? "Duke dalë..." : "Dil nga llogaria"}
      </button>
    </div>
  );

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          aria-expanded={mobileOpen}
          aria-controls="athlete-mobile-navigation"
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-left shadow-sm"
        >
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
              Menu
            </p>

            <p className="mt-0.5 truncate text-sm font-semibold text-slate-950">
              Portali i Sportistit
            </p>
          </div>

          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
            {mobileOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </span>
        </button>

        {mobileOpen ? (
          <div
            id="athlete-mobile-navigation"
            className="mt-3 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg"
          >
            {profile}

            <nav className="space-y-1 p-3">
              {navigationLinks(true)}
            </nav>

            {logoutButton}
          </div>
        ) : null}
      </div>

      <aside className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white lg:block">
        {profile}

        <nav className="space-y-1 p-3">
          {navigationLinks()}
        </nav>

        {logoutButton}
      </aside>
    </>
  );
}
