"use client";

import Link from "next/link";
import {
  FormEvent,
  useState,
} from "react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [sent, setSent] =
    useState(false);

  const [error, setError] =
    useState("");

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    const { error } =
      await authClient.requestPasswordReset({
        email,

        redirectTo:
          "/rivendos-fjalekalimin",
      });

    setLoading(false);

    if (error) {
      setError(
        "Kërkesa nuk mund të përpunohej. Provo përsëri."
      );

      return;
    }

    setSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">
            Harrova fjalëkalimin
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Shkruaj email-in e llogarisë dhe do të marrësh një
            link për të vendosur një fjalëkalim të ri.
          </p>
        </div>

        {sent ? (
          <div className="mt-7">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
              Nëse ekziston një llogari me këtë email,
              do të marrësh udhëzimet për rivendosjen e fjalëkalimit.
            </div>

            <Link
              href="/hyrje"
              className="mt-5 inline-flex text-sm font-semibold text-violet-700 hover:text-violet-800"
            >
              Kthehu te hyrja
            </Link>
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-7 space-y-4"
          >
            <label className="block text-xs font-semibold text-slate-600">
              Adresa elektronike

              <input
                type="email"
                required
                value={email}
                onChange={(event) =>
                  setEmail(
                    event.target.value
                  )
                }
                placeholder="emri@akademia.al"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              />
            </label>

            {error ? (
              <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading
                ? "Duke dërguar..."
                : "Dërgo linkun"}
            </button>

            <Link
              href="/hyrje"
              className="block text-center text-sm font-semibold text-slate-500 hover:text-violet-700"
            >
              Kthehu te hyrja
            </Link>
          </form>
        )}
      </div>
    </div>
  );
}