"use client";

import { CheckCircle2, LogIn, ShieldCheck, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { Logo } from "@/components/logo";

type InvitationData = {
  valid: true;
  type: "ATHLETE";
  email: string;
  accountExists: boolean;
  athleteName: string;
  academyName: string;
  expiresAt: string;
  nextPath: string;
};

function formatExpiry(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("sq-AL", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Europe/Tirane",
  }).format(date);
}

export default function Page() {
  const params = useParams<{
    token: string;
  }>();

  const router = useRouter();

  const token = typeof params?.token === "string" ? params.token : "";

  const [invitation, setInvitation] = useState<InvitationData | null>(null);

  const [loading, setLoading] = useState(true);

  const [accepting, setAccepting] = useState(false);

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Ftesa nuk është e vlefshme.");

      setLoading(false);

      return;
    }

    let active = true;

    async function loadInvitation() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/athlete-invitations/public/${encodeURIComponent(token)}`,
          {
            method: "GET",
            cache: "no-store",
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data?.error || "Ftesa nuk mund të verifikohej.");
        }

        if (data?.type !== "ATHLETE") {
          throw new Error(
            "Ftesa nuk është e vlefshme për portalin e sportistit.",
          );
        }

        if (active) {
          setInvitation(data as InvitationData);
        }
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Ndodhi një gabim gjatë verifikimit të ftesës.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadInvitation();

    return () => {
      active = false;
    };
  }, [token]);

  const nextPath =
    invitation?.nextPath || `/sportist/ftesa/${encodeURIComponent(token)}`;

  const loginHref = `/hyrje?next=${encodeURIComponent(nextPath)}`;

  const registerHref = `/regjistrohu?invite=${encodeURIComponent(
    token,
  )}&next=${encodeURIComponent(nextPath)}`;

  const expiry = useMemo(
    () => (invitation ? formatExpiry(invitation.expiresAt) : ""),
    [invitation],
  );

  async function acceptInvitation() {
    if (accepting || success) {
      return;
    }

    setAccepting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/athlete-invitations/public/${encodeURIComponent(token)}`,
        {
          method: "POST",
        },
      );

      const data = await response.json();

      if (response.status === 401) {
        router.push(loginHref);

        return;
      }

      if (!response.ok) {
        throw new Error(data?.error || "Ftesa nuk mund të pranohej.");
      }

      setSuccess(true);

      router.push("/sportist/dashboard");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë pranimit të ftesës.",
      );
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        {loading ? (
          <div className="mt-8">
            <p className="text-sm text-slate-500">Duke verifikuar ftesën...</p>
          </div>
        ) : error && !invitation ? (
          <div className="mt-8">
            <h1 className="text-2xl font-bold text-slate-950">
              Ftesa nuk është e vlefshme
            </h1>

            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          </div>
        ) : invitation ? (
          <>
            <div className="mt-8">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <ShieldCheck size={22} />
              </div>

              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-blue-700">
                Ftesë për portalin e sportistit
              </p>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-950">
                Mirë se erdhe, {invitation.athleteName}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {invitation.academyName} të ka ftuar të aktivizosh llogarinë
                tënde të sportistit në AkademiaSportive.
              </p>
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <dl className="space-y-3 text-sm">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Sportisti
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-900">
                    {invitation.athleteName}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Akademia
                  </dt>

                  <dd className="mt-1 font-semibold text-slate-900">
                    {invitation.academyName}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </dt>

                  <dd className="mt-1 break-all font-medium text-slate-700">
                    {invitation.email}
                  </dd>
                </div>

                {expiry ? (
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Ftesa skadon
                    </dt>

                    <dd className="mt-1 font-medium text-slate-700">
                      {expiry}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-4 text-sm text-emerald-800">
                <CheckCircle2 className="mt-0.5 shrink-0" size={19} />

                <div>
                  <p className="font-semibold">Ftesa u pranua me sukses.</p>

                  <p className="mt-1 leading-5">
                    Llogaria jote tani është lidhur me profilin e sportistit.
                  </p>
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={acceptInvitation}
                  disabled={accepting}
                  className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {accepting ? "Duke pranuar..." : "Prano ftesën"}
                </button>

                {invitation.accountExists ? (
                  <Link
                    href={loginHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <LogIn size={17} />
                    Hyr në llogari
                  </Link>
                ) : (
                  <Link
                    href={registerHref}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                  >
                    <UserPlus size={17} />
                    Krijo llogari
                  </Link>
                )}

                <p className="text-center text-xs leading-5 text-slate-400">
                  Duhet të përdorësh të njëjtën adresë emaili ku është dërguar
                  ftesa.
                </p>
              </div>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
