"use client";

import Link from "next/link";
import { LayoutDashboard, Menu, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";

import { authClient } from "@/lib/auth-client";

const NAV_LINKS = [
  ["Platforma", "#platforma"],
  ["Sportet", "#sportet"],
  ["Taktika", "#taktika"],
  ["Planet", "#planet"],
] as const;

/*
  Klasa "nav" ruhet konstante qëllimisht: efektet e faqes (public-home-fx)
  i shtojnë klasën "s" kur përdoruesi bën scroll.
*/
export function PublicHomeNav() {
  const [open, setOpen] = useState(false);

  const { data: session, isPending } = authClient.useSession();

  const isAuthenticated = Boolean(session?.user);

  const [isPlatformAdmin, setIsPlatformAdmin] = useState<boolean | null>(null);

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
    document.body.style.overflow = open ? "hidden" : "";

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const showPortalLink = !isPending && isAuthenticated && isPlatformAdmin !== null;
  const showGuestLinks = !isPending && !isAuthenticated;

  const portalHref = isPlatformAdmin ? "/platform-admin" : "/dashboard";
  const portalLabel = isPlatformAdmin ? "Platform Admin" : "Dashboard";
  const PortalIcon = isPlatformAdmin ? ShieldCheck : LayoutDashboard;

  return (
    <header className="nav">
      <div className="c nav-in">
        <Link href="/" className="logo">
          <i data-ic="bolt"></i>
          <span>
            <b>Akademia Sportive</b>
            <small>Platforma e menaxhimit</small>
          </span>
        </Link>

        <nav className="links">
          {NAV_LINKS.map(([label, href]) => (
            <a key={href} href={href}>
              {label}
            </a>
          ))}
        </nav>

        <div className="nav-r">
          <button
            type="button"
            className="tg"
            data-theme-btn
            aria-label="Ndrysho temën"
          />

          {showPortalLink && (
            <Link href={portalHref} className="btn p sm hide-s">
              <PortalIcon size={16} />
              {portalLabel}
            </Link>
          )}

          {showGuestLinks && (
            <>
              <Link href="/hyrje" className="btn g sm hide-s">
                Hyr
              </Link>

              <Link href="/apliko" className="btn p sm">
                Apliko
              </Link>
            </>
          )}

          <button
            type="button"
            className="burger"
            aria-label={open ? "Mbyll menunë" : "Hap menunë"}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X size={19} /> : <Menu size={19} />}
          </button>
        </div>
      </div>

      <div className={open ? "mob o" : "mob"}>
        {showPortalLink && (
          <Link href={portalHref} onClick={() => setOpen(false)}>
            {portalLabel}
          </Link>
        )}

        {NAV_LINKS.map(([label, href]) => (
          <a key={href} href={href} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}

        {showGuestLinks && (
          <Link href="/hyrje" onClick={() => setOpen(false)}>
            Hyr
          </Link>
        )}
      </div>
    </header>
  );
}
