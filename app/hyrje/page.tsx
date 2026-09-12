"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

function safeNextPath(
  value: string | null
) {
  if (
    !value ||
    !value.startsWith("/") ||
    value.startsWith("//")
  ) {
    return "/";
  }

  return value;
}

export default function Page() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [
    fjalekalimi,
    setFjalekalimi,
  ] = useState("");

  const [gabimi, setGabimi] =
    useState("");

  const [
    dukeHyre,
    setDukeHyre,
  ] = useState(false);

  const [nextPath, setNextPath] =
    useState("/");

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setNextPath(
      safeNextPath(
        params.get("next")
      )
    );
  }, []);

  async function hyr(
    e: FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setGabimi("");
    setDukeHyre(true);

    const { error } =
      await authClient.signIn.email({
        email,
        password:
          fjalekalimi,
      });

    if (error) {
      setGabimi(
        "Email-i ose fjalëkalimi nuk është i saktë."
      );

      setDukeHyre(false);
      return;
    }

    router.push(nextPath);
    router.refresh();
  }

  const registerHref =
    nextPath !== "/"
      ? `/regjistrohu?next=${encodeURIComponent(
          nextPath
        )}`
      : "/regjistrohu";

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">
            Hyr në platformë
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Menaxho akademinë, ekipet dhe sportistët nga një vend i vetëm.
          </p>
        </div>

        <form
          onSubmit={hyr}
          className="mt-7 space-y-4"
        >
          <label className="block text-xs font-semibold text-slate-600">
            Adresa elektronike

            <input
              type="email"
              required
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="emri@akademia.al"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Fjalëkalimi

            <input
              type="password"
              required
              value={fjalekalimi}
              onChange={(e) =>
                setFjalekalimi(
                  e.target.value
                )
              }
              placeholder="••••••••"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          {gabimi ? (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {gabimi}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={dukeHyre}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dukeHyre
              ? "Duke hyrë..."
              : "Hyr"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Nuk ke ende llogari?{" "}

          <Link
            href={registerHref}
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            Regjistrohu
          </Link>
        </p>
      </div>
    </div>
  );
}