"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

type InvitationData = {
  valid: true;
  type: "ACADEMY_OWNER" | "STAFF" | "ATHLETE";
  email: string;
  accountExists: boolean;
  name?: string;
  academyName: string;
  role?: string;
  expiresAt: string;
  nextPath: string;
};

export default function Page() {
  const router = useRouter();

  const [invitationToken, setInvitationToken] = useState("");
  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  const [loadingInvitation, setLoadingInvitation] = useState(true);
  const [invitationError, setInvitationError] = useState("");

  const [emri, setEmri] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [konfirmimi, setKonfirmimi] = useState("");
  const [gabimi, setGabimi] = useState("");
  const [dukeRegjistruar, setDukeRegjistruar] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadInvitation() {
      const params = new URLSearchParams(window.location.search);

      const token = (params.get("invite") ?? "").trim();

      if (!token) {
        if (active) {
          setInvitationError(
            "Regjistrimi bëhet vetëm me një ftesë të vlefshme.",
          );
          setLoadingInvitation(false);
        }

        return;
      }

      setInvitationToken(token);

      try {
        const response = await fetch(
          `/api/registration-invitations/${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok || data?.valid !== true) {
          if (active) {
            setInvitationError(
              data?.error || "Ftesa nuk është e vlefshme ose ka skaduar.",
            );
          }

          return;
        }

        if (active) {
          const validInvitation = data as InvitationData;

          setInvitation(validInvitation);

          if (validInvitation.name) {
            setEmri(validInvitation.name);
          }
        }
      } catch {
        if (active) {
          setInvitationError("Ftesa nuk mund të verifikohej. Provo përsëri.");
        }
      } finally {
        if (active) {
          setLoadingInvitation(false);
        }
      }
    }

    void loadInvitation();

    return () => {
      active = false;
    };
  }, []);

  async function regjistrohu(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setGabimi("");

    if (!invitation || !invitationToken) {
      setGabimi("Regjistrimi bëhet vetëm me një ftesë të vlefshme.");
      return;
    }

    if (emri.trim().length < 2) {
      setGabimi("Shkruaj emrin dhe mbiemrin.");
      return;
    }

    if (fjalekalimi.length < 8) {
      setGabimi("Fjalëkalimi duhet të ketë të paktën 8 karaktere.");
      return;
    }

    if (fjalekalimi !== konfirmimi) {
      setGabimi("Fjalëkalimet nuk përputhen.");
      return;
    }

    setDukeRegjistruar(true);

    const signupPayload = {
      name: emri.trim(),
      email: invitation.email,
      password: fjalekalimi,
      invitationToken,
    };

    const { error } = await authClient.signUp.email(signupPayload);

    if (error) {
      setGabimi(error.message || "Regjistrimi nuk mund të përfundohej.");
      setDukeRegjistruar(false);
      return;
    }

    router.push(invitation.nextPath);
    router.refresh();
  }

  if (loadingInvitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
          <Logo />

          <div className="mt-8">
            <h1 className="text-2xl font-bold text-slate-950">
              Po verifikojmë ftesën
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Prit pak ndërsa kontrollojmë të dhënat e ftesës.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!invitation) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
          <Logo />

          <div className="mt-8">
            <h1 className="text-2xl font-bold text-slate-950">
              Regjistrimi bëhet me ftesë
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              {invitationError ||
                "Për të krijuar një llogari duhet të kesh një ftesë aktive."}
            </p>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <Link
              href="/hyrje"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Hyr
            </Link>

            <Link
              href="/apliko"
              className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
            >
              Apliko
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (invitation.accountExists) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
        <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
          <Logo />

          <div className="mt-8">
            <h1 className="text-2xl font-bold text-slate-950">
              Ke tashmë një llogari
            </h1>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ftesa për{" "}
              <span className="font-semibold text-slate-700">
                {invitation.academyName}
              </span>{" "}
              është lidhur me email-in{" "}
              <span className="font-semibold text-slate-700">
                {invitation.email}
              </span>
              .
            </p>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              Hyr me llogarinë ekzistuese për të vazhduar me ftesën.
            </p>
          </div>

          <Link
            href={`/hyrje?next=${encodeURIComponent(invitation.nextPath)}`}
            className="mt-7 inline-flex w-full items-center justify-center rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800"
          >
            Hyr
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">Krijo llogarinë</h1>

          <p className="mt-1 text-sm leading-6 text-slate-500">
            Ftesa është për{" "}
            <span className="font-semibold text-slate-700">
              {invitation.academyName}
            </span>
            .
          </p>
        </div>

        <form onSubmit={regjistrohu} className="mt-7 space-y-4">
          <label className="block text-xs font-semibold text-slate-600">
            Emri dhe mbiemri
            <input
              type="text"
              required
              value={emri}
              onChange={(e) => setEmri(e.target.value)}
              placeholder="Ardit Hoxha"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Adresa elektronike
            <input
              type="email"
              required
              readOnly
              value={invitation.email}
              className="mt-1.5 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 outline-none"
            />
            <span className="mt-1.5 block text-[11px] font-normal leading-4 text-slate-400">
              Email-i është përcaktuar nga ftesa dhe nuk mund të ndryshohet.
            </span>
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Fjalëkalimi
            <input
              type="password"
              required
              value={fjalekalimi}
              onChange={(e) => setFjalekalimi(e.target.value)}
              placeholder="Të paktën 8 karaktere"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Konfirmo fjalëkalimin
            <input
              type="password"
              required
              value={konfirmimi}
              onChange={(e) => setKonfirmimi(e.target.value)}
              placeholder="Përsërit fjalëkalimin"
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
            disabled={dukeRegjistruar}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dukeRegjistruar ? "Duke u regjistruar..." : "Krijo llogarinë"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ke tashmë llogari?{" "}
          <Link
            href={`/hyrje?next=${encodeURIComponent(invitation.nextPath)}`}
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            Hyr
          </Link>
        </p>
      </div>
    </div>
  );
}
