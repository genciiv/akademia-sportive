"use client";

import {
  AlertTriangle,
  KeyRound,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { authClient } from "@/lib/auth-client";

export default function AccountPage() {
  const router = useRouter();

  const {
    data: session,
    isPending,
  } = authClient.useSession();

  const [deleteOpen, setDeleteOpen] =
    useState(false);

  const [password, setPassword] =
    useState("");

  const [confirmation, setConfirmation] =
    useState("");

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (
      !isPending &&
      !session?.user
    ) {
      router.replace("/hyrje");
    }
  }, [
    isPending,
    session?.user,
    router,
  ]);

  async function deleteAccount(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      confirmation.trim() !==
      "FSHIJ"
    ) {
      setError(
        'Shkruaj "FSHIJ" për të konfirmuar.'
      );

      return;
    }

    if (!password) {
      setError(
        "Vendos fjalëkalimin aktual."
      );

      return;
    }

    setDeleting(true);

    const result =
      await authClient.deleteUser({
        password,
      });

    if (result.error) {
      setDeleting(false);

      setError(
        result.error.message ||
          "Llogaria nuk mund të fshihej. Kontrollo fjalëkalimin ose të drejtat e llogarisë."
      );

      return;
    }

    router.replace("/hyrje");
    router.refresh();
  }

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb]">
        <p className="text-sm text-slate-500">
          Duke ngarkuar llogarinë...
        </p>
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm sm:p-7">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
            <UserRound size={25} />
          </div>

          <div>
            <div className="mb-2 inline-flex items-center rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
              Llogaria personale
            </div>

            <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
              Llogaria ime
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Menaxho të dhënat dhe sigurinë e llogarisë tënde personale.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[1fr_.8fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-700">
            Profili
          </p>

          <h2 className="mt-2 text-lg font-black text-slate-950">
            Informacioni i llogarisë
          </h2>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Emri
              </p>

              <p className="mt-2 text-sm font-bold text-slate-950">
                {session.user.name}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                Email
              </p>

              <p className="mt-2 break-all text-sm font-bold text-slate-950">
                {session.user.email}
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
              <KeyRound size={18} />
            </div>

            <div>
              <p className="text-sm font-black text-slate-950">
                Siguria
              </p>

              <p className="text-xs text-slate-500">
                Password dhe akses
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/ndrysho-fjalekalimin"
              )
            }
            className="mt-5 w-full rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
          >
            Ndrysho fjalëkalimin
          </button>
        </section>
      </div>

      <section className="mt-5 rounded-[24px] border border-red-200 bg-red-50/40 p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2 text-red-700">
              <AlertTriangle size={18} />

              <p className="text-xs font-black uppercase tracking-[0.12em]">
                Zona e rrezikut
              </p>
            </div>

            <h2 className="mt-2 text-lg font-black text-slate-950">
              Fshi llogarinë
            </h2>

            <p className="mt-1 max-w-xl text-sm leading-6 text-slate-600">
              Fshirja e llogarisë është përfundimtare.
              Pas fshirjes nuk do të mund të identifikohesh më me këtë llogari.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setDeleteOpen(true);
              setPassword("");
              setConfirmation("");
              setError("");
            }}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            <Trash2 size={16} />
            Fshi llogarinë
          </button>
        </div>
      </section>

      {deleteOpen ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/50 p-4">
          <form
            onSubmit={deleteAccount}
            className="w-full max-w-md rounded-[26px] border border-red-100 bg-white p-6 shadow-2xl"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-700">
              <Trash2 size={21} />
            </div>

            <h3 className="mt-4 text-xl font-black text-slate-950">
              Je i sigurt që do ta fshish llogarinë?
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              Po fshin përgjithmonë llogarinë{" "}
              <strong>
                {session.user.email}
              </strong>.
              Ky veprim nuk mund të kthehet.
            </p>

            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">
              <p className="text-xs font-semibold text-red-800">
                Për të konfirmuar shkruaj:
              </p>

              <p className="mt-1 text-sm font-black tracking-widest text-red-700">
                FSHIJ
              </p>
            </div>

            <label className="mt-4 block text-xs font-bold text-slate-600">
              Konfirmimi

              <input
                value={confirmation}
                onChange={(event) =>
                  setConfirmation(
                    event.target.value
                  )
                }
                placeholder="Shkruaj FSHIJ"
                autoComplete="off"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />
            </label>

            <label className="mt-4 block text-xs font-bold text-slate-600">
              Fjalëkalimi aktual

              <input
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                placeholder="Vendos fjalëkalimin"
                autoComplete="current-password"
                className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-50"
              />
            </label>

            {error ? (
              <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setDeleteOpen(false)
                }
                disabled={deleting}
                className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="submit"
                disabled={
                  deleting ||
                  confirmation.trim() !==
                    "FSHIJ" ||
                  !password
                }
                className="rounded-xl bg-red-600 px-4 py-3 text-sm font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {deleting
                  ? "Duke fshirë..."
                  : "Fshi përgjithmonë"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AppShell>
  );
}