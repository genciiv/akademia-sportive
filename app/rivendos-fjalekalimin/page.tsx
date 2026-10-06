"use client";

import Link from "next/link";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [token, setToken] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    const params =
      new URLSearchParams(
        window.location.search
      );

    setToken(
      params.get("token") ?? ""
    );
  }, []);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (!token) {
      setError(
        "Linku për rivendosjen e fjalëkalimit nuk është i vlefshëm."
      );

      return;
    }

    if (password.length < 8) {
      setError(
        "Fjalëkalimi duhet të ketë të paktën 8 karaktere."
      );

      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Fjalëkalimet nuk përputhen."
      );

      return;
    }

    setLoading(true);

    const { error } =
      await authClient.resetPassword({
        newPassword: password,
        token,
      });

    setLoading(false);

    if (error) {
      setError(
        "Linku është i pavlefshëm ose ka skaduar."
      );

      return;
    }

    setSuccess(true);

    setTimeout(() => {
      router.push("/hyrje");
    }, 1500);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">
            Vendos fjalëkalimin e ri
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Zgjidh një fjalëkalim të ri për llogarinë tënde.
          </p>
        </div>

        {success ? (
          <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
            Fjalëkalimi u ndryshua me sukses.
            Po të ridrejtojmë te hyrja...
          </div>
        ) : (
          <form
            onSubmit={submit}
            className="mt-7 space-y-4"
          >
            <label className="block text-xs font-semibold text-slate-600">
              Fjalëkalimi i ri

              <input
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
              />
            </label>

            <label className="block text-xs font-semibold text-slate-600">
              Konfirmo fjalëkalimin

              <input
                type="password"
                required
                minLength={8}
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
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
                ? "Duke ruajtur..."
                : "Ndrysho fjalëkalimin"}
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