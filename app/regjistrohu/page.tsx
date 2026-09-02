"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { Logo } from "@/components/logo";
import { authClient } from "@/lib/auth-client";

export default function Page() {
  const router = useRouter();

  const [emri, setEmri] = useState("");
  const [email, setEmail] = useState("");
  const [fjalekalimi, setFjalekalimi] = useState("");
  const [konfirmimi, setKonfirmimi] = useState("");
  const [gabimi, setGabimi] = useState("");
  const [dukeRegjistruar, setDukeRegjistruar] = useState(false);

  async function regjistrohu(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setGabimi("");

    if (fjalekalimi.length < 8) {
      setGabimi("Fjalëkalimi duhet të ketë të paktën 8 karaktere.");
      return;
    }

    if (fjalekalimi !== konfirmimi) {
      setGabimi("Fjalëkalimet nuk përputhen.");
      return;
    }

    setDukeRegjistruar(true);

    const { error } = await authClient.signUp.email({
      name: emri.trim(),
      email,
      password: fjalekalimi,
    });

    if (error) {
      setGabimi(
        error.message || "Regjistrimi nuk mund të përfundohej."
      );
      setDukeRegjistruar(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-md rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">
            Krijo llogarinë
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Regjistrohu për të nisur menaxhimin e akademisë sportive.
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
            Email
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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

          {gabimi && (
            <div className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700">
              {gabimi}
            </div>
          )}

          <button
            type="submit"
            disabled={dukeRegjistruar}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dukeRegjistruar ? "Duke u regjistruar..." : "Regjistrohu"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Ke tashmë llogari?{" "}
          <Link
            href="/hyrje"
            className="font-semibold text-blue-700 hover:text-blue-800"
          >
            Hyr
          </Link>
        </p>
      </div>
    </div>
  );
}