"use client";

import Link from "next/link";
import {
  useEffect,
  useState,
} from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import {
  CheckCircle2,
  LogIn,
  UserPlus,
} from "lucide-react";

import { Logo } from "@/components/logo";

type Invitation = {
  email: string;
  role: string;
  roleLabel: string;
  expiresAt: string;
  academy: {
    id: string;
    name: string;
  };
};

export default function Page() {
  const params = useParams<{
    token: string;
  }>();

  const router = useRouter();

  const token =
    typeof params.token === "string"
      ? params.token
      : "";

  const [invitation, setInvitation] =
    useState<Invitation | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [accepting, setAccepting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  useEffect(() => {
    if (!token) {
      return;
    }

    async function loadInvitation() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          `/api/invitations/${token}`,
          {
            cache: "no-store",
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Ftesa nuk mund të ngarkohej."
          );
        }

        setInvitation(
          data.invitation
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Ndodhi një gabim."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInvitation();
  }, [token]);

  async function acceptInvitation() {
    setAccepting(true);
    setError("");

    try {
      const response = await fetch(
        `/api/invitations/${token}`,
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (response.status === 401) {
        const next =
          `/ftesa/${token}`;

        router.push(
          `/hyrje?next=${encodeURIComponent(
            next
          )}`
        );

        return;
      }

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Ftesa nuk mund të pranohej."
        );
      }

      setSuccess(true);

      window.setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 1200);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim gjatë pranimit të ftesës."
      );
    } finally {
      setAccepting(false);
    }
  }

  const nextPath =
    `/ftesa/${token}`;

  const loginHref =
    `/hyrje?next=${encodeURIComponent(
      nextPath
    )}`;

  const registerHref =
    `/regjistrohu?next=${encodeURIComponent(
      nextPath
    )}`;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        {loading ? (
          <div className="mt-8 text-sm text-slate-500">
            Duke ngarkuar ftesën...
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
              <p className="text-xs font-semibold uppercase tracking-[0.08em] text-blue-700">
                Ftesë për staf
              </p>

              <h1 className="mt-2 text-2xl font-bold text-slate-950">
                Bashkohu me{" "}
                {invitation.academy.name}
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Je ftuar të bëhesh pjesë e stafit të akademisë.
              </p>
            </div>

            <div className="mt-6 space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Adresa elektronike
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {invitation.email}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Roli
                </p>

                <p className="mt-1 text-sm font-semibold text-slate-800">
                  {invitation.roleLabel}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-slate-400">
                  Ftesa skadon më
                </p>

                <p className="mt-1 text-sm text-slate-700">
                  {new Date(
                    invitation.expiresAt
                  ).toLocaleDateString(
                    "sq-AL"
                  )}
                </p>
              </div>
            </div>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            {success ? (
              <div className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                <CheckCircle2
                  size={18}
                />
                Ftesa u pranua. Po hapet paneli...
              </div>
            ) : null}

            {!success ? (
              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={
                    acceptInvitation
                  }
                  disabled={accepting}
                  className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {accepting
                    ? "Duke pranuar..."
                    : "Prano ftesën"}
                </button>

                <div className="grid gap-2 sm:grid-cols-2">
                  <Link
                    href={loginHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <LogIn size={17} />
                    Hyr me llogarinë
                  </Link>

                  <Link
                    href={registerHref}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <UserPlus size={17} />
                    Krijo llogari
                  </Link>
                </div>

                <p className="text-center text-xs leading-5 text-slate-400">
                  Duhet të përdorësh të njëjtën adresë elektronike ku është dërguar ftesa.
                </p>
              </div>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}