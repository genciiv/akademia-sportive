"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { Logo } from "@/components/logo";

export default function ChangePasswordPage() {
  const router = useRouter();

  const [currentPassword, setCurrentPassword] =
    useState("");

  const [newPassword, setNewPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [forcedChange, setForcedChange] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function check() {
      try {
        const response =
          await fetch(
            "/api/account/password-status",
            {
              cache: "no-store",
            }
          );

        if (response.status === 401) {
          router.replace("/hyrje");
          return;
        }

        const data =
          await response.json();

        if (response.ok) {
          setForcedChange(
            data.mustChangePassword === true
          );
        }
      } finally {
        setChecking(false);
      }
    }

    void check();
  }, [router]);

  async function submit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (newPassword.length < 8) {
      setError(
        "Fjalëkalimi i ri duhet të ketë të paktën 8 karaktere."
      );

      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setError(
        "Fjalëkalimet e reja nuk përputhen."
      );

      return;
    }

    setLoading(true);

    const response =
      await fetch(
        "/api/account/change-password",
        {
          method: "POST",

          headers: {
            "content-type":
              "application/json",
          },

          body: JSON.stringify({
            currentPassword,
            newPassword,
          }),
        }
      );

    const data =
      await response.json();

    setLoading(false);

    if (!response.ok) {
      setError(
        data?.error ||
          "Ndryshimi i fjalëkalimit dështoi."
      );

      return;
    }

    router.replace(
      forcedChange
        ? "/dashboard"
        : "/llogaria"
    );

    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-slate-500">
          Duke kontrolluar llogarinë...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-violet-100 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <div className="inline-flex rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
            Siguria e llogarisë
          </div>

          <h1 className="mt-3 text-2xl font-black text-slate-950">
            Ndrysho fjalëkalimin
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            {forcedChange
              ? "Po përdor një fjalëkalim të përkohshëm. Para se të vazhdosh në platformë, vendos një fjalëkalim personal."
              : "Për sigurinë e llogarisë, vendos fjalëkalimin aktual dhe zgjidh një fjalëkalim të ri."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="mt-7 space-y-4"
        >
          <label className="block text-xs font-semibold text-slate-600">
            {forcedChange
              ? "Fjalëkalimi i përkohshëm"
              : "Fjalëkalimi aktual"}

            <input
              type="password"
              required
              minLength={8}
              value={currentPassword}
              onChange={(event) =>
                setCurrentPassword(
                  event.target.value
                )
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Fjalëkalimi i ri

            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(event) =>
                setNewPassword(
                  event.target.value
                )
              }
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-violet-400 focus:ring-4 focus:ring-violet-50"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Konfirmo fjalëkalimin e ri

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
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Duke ndryshuar..."
              : "Ruaj fjalëkalimin e ri"}
          </button>
        </form>
      </div>
    </div>
  );
}