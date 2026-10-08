"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Dumbbell,
  Menu,
  ShieldCheck,
  X,
} from "lucide-react";
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

  const [isPlatformAdmin, setIsPlatformAdmin] =
    useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (isPending) {
      return;
    }

    if (!isAuthenticated) {
      setIsPlatformAdmin(false);
      return;
    }

    setIsPlatformAdmin(null);

    fetch("/api/platform-admin/session", {
      method: "GET",
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) {
          return false;
        }

        const data = await response.json();

        return data?.platformAdmin === true;
      })
      .then((value) => {
        if (!cancelled) {
          setIsPlatformAdmin(value);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setIsPlatformAdmin(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isPending]);

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
      className={[
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "border-slate-200 bg-white shadow-[0_10px_30px_-24px_rgba(23,29,58,.28)]"
          : "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="mx-auto flex h-[76px] max-w-[1140px] items-center justify-between px-5 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-3 rounded-2xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/20"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white bg-white/75 text-[#3552ff] shadow-[0_12px_30px_-18px_rgba(20,83,45,.55)] backdrop-blur-xl">
            <Dumbbell size={19} />
          </span>

          <div>
            <p className="text-[15px] font-extrabold leading-tight tracking-[-0.025em] text-[#171d3a]">
              Akademia Sportive
            </p>

            <p className="mt-0.5 text-[10px] font-medium text-[#7b82a2]">
              Platforma e menaxhimit
            </p>
          </div>
        </Link>

        <nav className="hidden items-center gap-8 text-sm font-semibold text-[#5a6285] min-[860px]:flex">
          <a
            href="#platforma"
            className="transition hover:text-[#3552ff]"
          >
            Platforma
          </a>

          <a
            href="#funksionet"
            className="transition hover:text-[#3552ff]"
          >
            Funksionet
          </a>

          <a
            href="#planet"
            className="transition hover:text-[#3552ff]"
          >
            Planet
          </a>
        </nav>

        <div className="hidden min-w-[190px] items-center justify-end gap-3 min-[860px]:flex">
          {!isPending &&
            isAuthenticated &&
            isPlatformAdmin !== null && (
              <Link
                href={
                  isPlatformAdmin
                    ? "/platform-admin"
                    : "/dashboard"
                }
                className="inline-flex items-center gap-2 rounded-full bg-[#3552ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(53,82,255,.55)] transition hover:-translate-y-0.5 hover:bg-[#2945ef]"
              >
                {isPlatformAdmin ? (
                  <ShieldCheck size={16} />
                ) : (
                  <LayoutDashboard size={16} />
                )}

                {isPlatformAdmin
                  ? "Platform Admin"
                  : "Dashboard"}
              </Link>
            )}

          {!isPending && !isAuthenticated && (
            <>
              <Link
                href="/hyrje"
                className="rounded-full border border-[#171d3a]/15 bg-white/45 px-4 py-2.5 text-sm font-semibold text-[#171d3a] transition hover:-translate-y-0.5 hover:bg-white/75"
              >
                Hyr
              </Link>

              <Link
                href="/apliko"
                className="rounded-full bg-[#3552ff] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_10px_28px_-12px_rgba(53,82,255,.55)] transition hover:-translate-y-0.5 hover:bg-[#2945ef]"
              >
                Apliko
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Mbyll menunë" : "Hap menunë"}
          aria-expanded={open}
          onClick={() => setOpen((value) => !value)}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white bg-white/75 text-[#171d3a] shadow-sm backdrop-blur-xl min-[860px]:hidden"
        >
          {open ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      <div
        className={[
          "overflow-hidden bg-white transition-all duration-300 min-[860px]:hidden",
          open
            ? "max-h-[460px] border-t border-white opacity-100"
            : "max-h-0 opacity-0",
        ].join(" ")}
      >
        <nav className="mx-auto max-w-[1140px] px-5 py-5">
          {!isPending &&
            isAuthenticated &&
            isPlatformAdmin !== null && (
              <Link
                href={
                  isPlatformAdmin
                    ? "/platform-admin"
                    : "/dashboard"
                }
                onClick={() => setOpen(false)}
                className="mb-3 flex items-center gap-2 rounded-2xl bg-indigo-50 px-4 py-3 text-sm font-semibold text-[#3552ff]"
              >
                {isPlatformAdmin ? (
                  <ShieldCheck size={16} />
                ) : (
                  <LayoutDashboard size={16} />
                )}

                {isPlatformAdmin
                  ? "Platform Admin"
                  : "Dashboard"}
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
              className="flex border-b border-[#171d3a]/8 py-4 text-sm font-semibold text-[#5a6285]"
            >
              {label}
            </a>
          ))}

          {!isPending && !isAuthenticated && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <Link
                href="/hyrje"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-full border border-[#171d3a]/15 px-4 py-3 text-sm font-semibold text-[#171d3a]"
              >
                Hyr
              </Link>

              <Link
                href="/apliko"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-full bg-[#3552ff] px-4 py-3 text-sm font-semibold text-white"
              >
                Apliko
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}