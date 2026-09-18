"use client";

import {
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
} from "lucide-react";
import {
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

function initials(name?: string | null) {
  if (!name) {
    return "PA";
  }

  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${
    parts[parts.length - 1][0]
  }`.toUpperCase();
}

export function PlatformAdminTopbar({
  onMenu,
}: {
  onMenu: () => void;
}) {
  const router = useRouter();

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const [menuOpen, setMenuOpen] =
    useState(false);

  const [loggingOut, setLoggingOut] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const name =
    session?.user?.name ||
    "Platform Admin";

  async function logout() {
    setLoggingOut(true);

    await authClient.signOut();

    router.push("/hyrje");
    router.refresh();
  }

  return (
    <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenu}
          className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
          aria-label="Hap menunë"
        >
          <Menu size={21} />
        </button>

        <div className="hidden sm:block">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
            <ShieldCheck
              size={15}
              className="text-blue-600"
            />

            Administrimi i platformës
          </div>
        </div>
      </div>

      <div
        ref={menuRef}
        className="relative"
      >
        <button
          type="button"
          onClick={() =>
            setMenuOpen(
              (value) => !value
            )
          }
          className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50"
          aria-label="Hap profilin"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-xs font-bold text-white">
            {isPending
              ? "..."
              : initials(name)}
          </div>

          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-900">
              {isPending
                ? "Duke ngarkuar..."
                : name}
            </p>

            <p className="text-[10px] text-slate-400">
              Platform Admin
            </p>
          </div>

          <ChevronDown
            size={15}
            className="hidden text-slate-400 sm:block"
          />
        </button>

        {menuOpen ? (
          <div className="absolute right-0 top-[52px] z-50 w-56 rounded-xl border border-slate-200 bg-white p-2 shadow-lg">
            <div className="border-b border-slate-100 px-3 py-2">
              <p className="text-xs font-semibold text-slate-900">
                {name}
              </p>

              <p className="mt-0.5 truncate text-[11px] text-slate-500">
                {session?.user?.email || ""}
              </p>
            </div>

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut size={16} />

              {loggingOut
                ? "Duke dalë..."
                : "Dil"}
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}