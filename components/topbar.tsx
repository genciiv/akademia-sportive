"use client";

import Link from "next/link";
import {
  Bell,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  UserRound,
  UsersRound,
  Dumbbell,
  Shield,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { authClient } from "@/lib/auth-client";

type SearchResult = {
  id: string;
  type: "PLAYER" | "COACH" | "TEAM";
  title: string;
  subtitle: string;
  href: string;
};

function inicialet(name?: string | null) {
  if (!name) {
    return "P";
  }

  const pjeset = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (pjeset.length === 1) {
    return pjeset[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${pjeset[0][0]}${
    pjeset[pjeset.length - 1][0]
  }`.toUpperCase();
}

function SearchIcon({
  type,
}: {
  type: SearchResult["type"];
}) {
  if (type === "PLAYER") {
    return <UsersRound size={16} />;
  }

  if (type === "COACH") {
    return <Dumbbell size={16} />;
  }

  return <Shield size={16} />;
}

export function Topbar({
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

  const [dukeDale, setDukeDale] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [results, setResults] =
    useState<SearchResult[]>([]);

  const [searchOpen, setSearchOpen] =
    useState(false);

  const [searching, setSearching] =
    useState(false);

  const menuRef =
    useRef<HTMLDivElement | null>(null);

  const searchRef =
    useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleClickOutside(
      event: MouseEvent
    ) {
      const target =
        event.target as Node;

      if (
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setMenuOpen(false);
      }

      if (
        searchRef.current &&
        !searchRef.current.contains(target)
      ) {
        setSearchOpen(false);
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

  useEffect(() => {
    const value = query.trim();

    if (value.length < 2) {
      setResults([]);
      setSearching(false);

      return;
    }

    const controller =
      new AbortController();

    const timer = window.setTimeout(
      async () => {
        setSearching(true);

        try {
          const response = await fetch(
            `/api/search?q=${encodeURIComponent(
              value
            )}`,
            {
              cache: "no-store",
              signal:
                controller.signal,
            }
          );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                "Kërkimi dështoi."
            );
          }

          setResults(
            Array.isArray(data.results)
              ? data.results
              : []
          );

          setSearchOpen(true);
        } catch (error) {
          if (
            error instanceof Error &&
            error.name ===
              "AbortError"
          ) {
            return;
          }

          setResults([]);
        } finally {
          setSearching(false);
        }
      },
      250
    );

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  async function dil() {
    setDukeDale(true);

    await authClient.signOut();

    router.push("/hyrje");
    router.refresh();
  }

  function hapRezultatin(
    result: SearchResult
  ) {
    setQuery("");
    setResults([]);
    setSearchOpen(false);

    router.push(result.href);
  }

  const name =
    session?.user?.name ||
    "Përdorues";

  const groupedResults =
    useMemo(() => results, [results]);

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
      </div>

      <div
        ref={searchRef}
        className="relative mx-4 hidden w-full max-w-[380px] md:block"
      >
        <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
          <Search
            size={17}
            className="text-slate-400"
          />

          <input
            value={query}
            onChange={(event) => {
              setQuery(
                event.target.value
              );

              if (
                event.target.value
                  .trim().length >= 2
              ) {
                setSearchOpen(true);
              }
            }}
            onFocus={() => {
              if (
                query.trim().length >= 2
              ) {
                setSearchOpen(true);
              }
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            placeholder="Kërko sportist, trajner ose ekip..."
            aria-label="Kërko"
          />

          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setResults([]);
                setSearchOpen(false);
              }}
              aria-label="Pastro kërkimin"
              className="rounded p-1 text-slate-400 hover:bg-slate-200"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>

        {searchOpen ? (
          <div className="absolute left-0 right-0 top-[48px] z-50 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
            {searching ? (
              <div className="px-4 py-4 text-sm text-slate-500">
                Duke kërkuar...
              </div>
            ) : groupedResults.length >
              0 ? (
              <div className="max-h-80 overflow-y-auto p-2">
                {groupedResults.map(
                  (result) => (
                    <button
                      key={`${result.type}-${result.id}`}
                      type="button"
                      onClick={() =>
                        hapRezultatin(
                          result
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-slate-50"
                    >
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                        <SearchIcon
                          type={
                            result.type
                          }
                        />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-slate-900">
                          {result.title}
                        </p>

                        <p className="text-xs text-slate-500">
                          {
                            result.subtitle
                          }
                        </p>
                      </div>
                    </button>
                  )
                )}
              </div>
            ) : (
              <div className="px-4 py-4 text-sm text-slate-500">
                Nuk u gjet asnjë rezultat.
              </div>
            )}
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Link
          href="/njoftimet"
          className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100"
          aria-label="Njoftimet"
        >
          <Bell size={19} />
        </Link>

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
            className="ml-1 flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50"
            aria-label="Hap profilin"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-xs font-bold text-white">
              {isPending
                ? "..."
                : inicialet(name)}
            </div>

            <div className="hidden text-left sm:block">
              <p className="text-xs font-semibold text-slate-900">
                {isPending
                  ? "Duke ngarkuar..."
                  : name}
              </p>

              <p className="text-[10px] text-slate-400">
                Llogaria ime
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
                  {session?.user?.email ||
                    ""}
                </p>
              </div>

              <Link
                href="/cilesimet"
                onClick={() =>
                  setMenuOpen(false)
                }
                className="mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <UserRound size={16} />
                Cilësimet
              </Link>

              <button
                type="button"
                onClick={dil}
                disabled={dukeDale}
                className="mt-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
              >
                <LogOut size={16} />

                {dukeDale
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