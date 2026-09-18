"use client";

import Link from "next/link";
import { LayoutDashboard, Dumbbell, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

export function PublicHomeNav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const isAuthenticated = Boolean(session?.user);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 12);
    };

    onScroll();

    window.addEventListener("scroll", onScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-slate-200/80 bg-white/90 shadow-sm backdrop-blur-xl"
          : "border-slate-200/70 bg-white/80 backdrop-blur-lg"
      }`}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8">
        <div className="flex items-center gap-4">
          <Link href="/" className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
              <Dumbbell size={18} />
            </span>

            <div>
              <p className="text-sm font-bold leading-tight text-slate-950">
                Akademia Sportive
              </p>

              <p className="text-[10px] text-slate-400">
                Platforma e menaxhimit
              </p>
            </div>
          </Link>


        </div>

        <nav className="hidden items-center gap-8 text-sm font-medium text-slate-600 xl:flex">
          <a
            href="#platforma"
            className="transition hover:text-blue-600"
          >
            Platforma
          </a>

          <a
            href="#funksionet"
            className="transition hover:text-blue-600"
          >
            Funksionet
          </a>

          <a
            href="#planet"
            className="transition hover:text-blue-600"
          >
            Planet
          </a>
        </nav>

        <div className="hidden min-w-[190px] items-center justify-end gap-3 xl:flex">
          {!isPending && isAuthenticated && (
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}

          {!isPending && !isAuthenticated && (
            <>
              <Link
                href="/hyrje"
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Hyr
              </Link>

              <Link
                href="/regjistrohu"
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
              >
                Fillo falas
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Mbyll menunë" : "Hap menunë"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm xl:hidden"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      <div
        className={`overflow-hidden bg-white transition-all duration-300 xl:hidden ${
          open
            ? "max-h-[460px] border-t border-slate-100 opacity-100"
            : "max-h-0 opacity-0"
        }`}
      >
        <nav className="mx-auto max-w-7xl px-5 py-5">
          {!isPending && isAuthenticated && (
            <Link
              href="/dashboard"
              onClick={() => setOpen(false)}
              className="mb-3 flex items-center gap-2 rounded-xl bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700"
            >
              <LayoutDashboard size={16} />
              Dashboard
            </Link>
          )}

          {[
            ["Platforma", "#platforma"],
            ["Funksionet", "#funksionet"],
            ["Planet", "#planet"],
          ].map(([label, href]) => (
            <a
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="flex border-b border-slate-100 py-4 text-sm font-semibold text-slate-700"
            >
              {label}
            </a>
          ))}

          {!isPending && !isAuthenticated && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/hyrje"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Hyr
              </Link>

              <Link
                href="/regjistrohu"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white"
              >
                Fillo falas
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}