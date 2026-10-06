"use client";

import {
  CheckCircle2,
  KeyRound,
  Laptop,
  LockKeyhole,
  Mail,
  Save,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  FormEvent,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

import { authClient } from "@/lib/auth-client";

type SessionItem = {
  id: string;
  createdAt: string;
  updatedAtLabel: string;
  expiresAtLabel: string;
  ipAddress: string | null;
  userAgent: string | null;
};

type Props = {
  initialName: string;
  email: string;
  role: string;
  providers: string[];
  sessions: SessionItem[];
};

function providerLabel(
  provider: string
) {
  const normalized =
    provider.toLowerCase();

  if (
    normalized === "credential" ||
    normalized === "email-password"
  ) {
    return "Email & fjalëkalim";
  }

  if (normalized === "google") {
    return "Google";
  }

  return provider;
}

function deviceLabel(
  userAgent: string | null
) {
  if (!userAgent) {
    return "Pajisje e panjohur";
  }

  const browser =
    userAgent.includes("Edg/")
      ? "Microsoft Edge"
      : userAgent.includes("Chrome/")
        ? "Google Chrome"
        : userAgent.includes("Firefox/")
          ? "Mozilla Firefox"
          : userAgent.includes("Safari/")
            ? "Safari"
            : "Browser";

  const os =
    userAgent.includes("Windows")
      ? "Windows"
      : userAgent.includes("Mac OS")
        ? "macOS"
        : userAgent.includes("Android")
          ? "Android"
          : userAgent.includes("iPhone") ||
              userAgent.includes("iPad")
            ? "iOS"
            : "";

  return os
    ? `${browser} · ${os}`
    : browser;
}

export function PlatformAccountClient({
  initialName,
  email,
  role,
  providers,
  sessions,
}: Props) {
  const router = useRouter();

  const [name, setName] =
    useState(initialName);

  const [
    profileLoading,
    setProfileLoading,
  ] = useState(false);

  const [
    profileMessage,
    setProfileMessage,
  ] = useState<string | null>(null);

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("");

  const [
    newPassword,
    setNewPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [
    passwordLoading,
    setPasswordLoading,
  ] = useState(false);

  const [
    passwordMessage,
    setPasswordMessage,
  ] = useState<string | null>(null);

  const [
    sessionLoading,
    setSessionLoading,
  ] = useState(false);

  const [
    sessionMessage,
    setSessionMessage,
  ] = useState<string | null>(null);

  const hasCredential =
    providers.some((provider) =>
      [
        "credential",
        "email-password",
      ].includes(
        provider.toLowerCase()
      )
    );

  async function saveProfile(
    event: FormEvent
  ) {
    event.preventDefault();

    const normalized =
      name.trim();

    if (
      normalized.length < 2 ||
      normalized.length > 100
    ) {
      setProfileMessage(
        "Emri duhet të ketë nga 2 deri në 100 karaktere."
      );
      return;
    }

    setProfileLoading(true);
    setProfileMessage(null);

    try {
      const result =
        await authClient.updateUser({
          name: normalized,
        });

      if (result.error) {
        setProfileMessage(
          result.error.message ||
            "Profili nuk u përditësua."
        );
        return;
      }

      setProfileMessage(
        "Profili u përditësua me sukses."
      );

      router.refresh();
    } catch {
      setProfileMessage(
        "Ndodhi një gabim gjatë përditësimit të profilit."
      );
    } finally {
      setProfileLoading(false);
    }
  }

  async function changePassword(
    event: FormEvent
  ) {
    event.preventDefault();

    if (
      newPassword.length < 8
    ) {
      setPasswordMessage(
        "Fjalëkalimi i ri duhet të ketë të paktën 8 karaktere."
      );
      return;
    }

    if (
      newPassword !==
      confirmPassword
    ) {
      setPasswordMessage(
        "Konfirmimi i fjalëkalimit nuk përputhet."
      );
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const result =
        await authClient.changePassword({
          currentPassword,
          newPassword,
          revokeOtherSessions: true,
        });

      if (result.error) {
        setPasswordMessage(
          result.error.message ||
            "Fjalëkalimi nuk u ndryshua."
        );
        return;
      }

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      setPasswordMessage(
        "Fjalëkalimi u ndryshua me sukses. Sesionet e tjera u mbyllën."
      );

      router.refresh();
    } catch {
      setPasswordMessage(
        "Ndodhi një gabim gjatë ndryshimit të fjalëkalimit."
      );
    } finally {
      setPasswordLoading(false);
    }
  }

  async function revokeOtherSessions() {
    setSessionLoading(true);
    setSessionMessage(null);

    try {
      const result =
        await authClient.revokeOtherSessions();

      if (result.error) {
        setSessionMessage(
          result.error.message ||
            "Sesionet e tjera nuk u mbyllën."
        );
        return;
      }

      setSessionMessage(
        "Sesionet e tjera u mbyllën me sukses."
      );

      router.refresh();
    } catch {
      setSessionMessage(
        "Ndodhi një gabim gjatë mbylljes së sesioneve."
      );
    } finally {
      setSessionLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50/80 to-white px-6 py-6 sm:px-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 text-xl font-bold text-white shadow-sm">
              {initialName
                .trim()
                .split(/\s+/)
                .map((part) => part[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>

            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
                <ShieldCheck size={13} />
                Platform Admin
              </div>

              <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
                Llogaria ime
              </h1>

              <p className="mt-1 text-sm text-slate-500">
                Menaxho profilin, sigurinë dhe sesionet e llogarisë tënde.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_.95fr]">
        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <UserRound size={19} />
            </span>

            <div>
              <h2 className="text-base font-bold text-slate-950">
                Profili
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Informacioni bazë i llogarisë së administratorit të platformës.
              </p>
            </div>
          </div>

          <form
            onSubmit={saveProfile}
            className="mt-7 space-y-5"
          >
            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Emri dhe mbiemri
              </label>

              <input
                value={name}
                onChange={(event) =>
                  setName(
                    event.target.value
                  )
                }
                maxLength={100}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Email
              </label>

              <div className="relative">
                <Mail
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  value={email}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm text-slate-500"
                />
              </div>

              <p className="mt-2 text-[11px] text-slate-400">
                Email-i i autentikimit nuk ndryshohet nga kjo faqe.
              </p>
            </div>

            <div>
              <label className="mb-2 block text-xs font-semibold text-slate-700">
                Roli
              </label>

              <input
                value={
                  role ===
                  "PLATFORM_ADMIN"
                    ? "Platform Admin"
                    : role
                }
                readOnly
                className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-500"
              />
            </div>

            {profileMessage ? (
              <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                {profileMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={profileLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={16} />

              {profileLoading
                ? "Duke ruajtur..."
                : "Ruaj ndryshimet"}
            </button>
          </form>
        </section>

        <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
              <LockKeyhole size={19} />
            </span>

            <div>
              <h2 className="text-base font-bold text-slate-950">
                Siguria
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Metodat e hyrjes dhe mbrojtja e llogarisë.
              </p>
            </div>
          </div>

          <div className="mt-7">
            <p className="text-xs font-semibold text-slate-700">
              Metodat e hyrjes
            </p>

            <div className="mt-3 flex flex-wrap gap-2">
              {providers.map(
                (provider) => (
                  <span
                    key={provider}
                    className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700"
                  >
                    <CheckCircle2
                      size={14}
                    />
                    {providerLabel(
                      provider
                    )}
                  </span>
                )
              )}
            </div>
          </div>

          {hasCredential ? (
            <form
              onSubmit={
                changePassword
              }
              className="mt-7 space-y-4 border-t border-slate-100 pt-6"
            >
              <div className="flex items-center gap-2">
                <KeyRound
                  size={16}
                  className="text-slate-500"
                />

                <p className="text-sm font-bold text-slate-900">
                  Ndrysho fjalëkalimin
                </p>
              </div>

              <input
                type="password"
                value={
                  currentPassword
                }
                onChange={(event) =>
                  setCurrentPassword(
                    event.target.value
                  )
                }
                placeholder="Fjalëkalimi aktual"
                autoComplete="current-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              <input
                type="password"
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(
                    event.target.value
                  )
                }
                placeholder="Fjalëkalimi i ri"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              <input
                type="password"
                value={
                  confirmPassword
                }
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Konfirmo fjalëkalimin e ri"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
              />

              {passwordMessage ? (
                <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
                  {passwordMessage}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={
                  passwordLoading
                }
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
              >
                {passwordLoading
                  ? "Duke ndryshuar..."
                  : "Ndrysho fjalëkalimin"}
              </button>
            </form>
          ) : (
            <div className="mt-7 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              Kjo llogari nuk përdor fjalëkalim lokal. Hyrja menaxhohet përmes ofruesit të lidhur.
            </div>
          )}
        </section>
      </div>

      <section className="rounded-[22px] border border-slate-200 bg-white p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <Laptop size={19} />
            </span>

            <div>
              <h2 className="text-base font-bold text-slate-950">
                Sesionet aktive
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pajisjet që kanë ende një sesion aktiv në këtë llogari.
              </p>
            </div>
          </div>

          {sessions.length > 1 ? (
            <button
              type="button"
              onClick={
                revokeOtherSessions
              }
              disabled={
                sessionLoading
              }
              className="rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:opacity-60"
            >
              {sessionLoading
                ? "Duke mbyllur..."
                : "Dil nga pajisjet e tjera"}
            </button>
          ) : null}
        </div>

        {sessionMessage ? (
          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-800">
            {sessionMessage}
          </div>
        ) : null}

        <div className="mt-6 space-y-3">
          {sessions.map(
            (session) => (
              <div
                key={session.id}
                className="grid gap-4 rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-sm font-semibold text-slate-900">
                    {deviceLabel(
                      session.userAgent
                    )}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-500">
                    <span>
                      IP:{" "}
                      {session.ipAddress &&
                      !/^0{4}(?::0{4}){7}$/.test(
                        session.ipAddress
                      )
                        ? session.ipAddress
                        : "E panjohur"}
                    </span>

                    <span>
                      Aktiviteti:{" "}
                      {session.updatedAtLabel}
                    </span>
                  </div>
                </div>

                <div className="text-left sm:text-right">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    Skadon
                  </p>

                  <p className="mt-1 text-xs font-medium text-slate-600">
                    {session.expiresAtLabel}
                  </p>
                </div>
              </div>
            )
          )}
        </div>
      </section>
    </div>
  );
}