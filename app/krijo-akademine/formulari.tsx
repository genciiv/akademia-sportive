"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";

export default function Page() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("Shqipëri");
  const [gabimi, setGabimi] = useState("");
  const [dukeRuajtur, setDukeRuajtur] = useState(false);

  async function krijo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setGabimi("");
    setDukeRuajtur(true);

    try {
      const response = await fetch("/api/academy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          city,
          country,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGabimi(data.error || "Akademia nuk mund të krijohej.");
        setDukeRuajtur(false);
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setGabimi("Ndodhi një problem gjatë krijimit të akademisë.");
      setDukeRuajtur(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f5f7fb] p-4">
      <div className="w-full max-w-lg rounded-[28px] border border-slate-200 bg-white p-7 shadow-soft sm:p-9">
        <Logo />

        <div className="mt-8">
          <h1 className="text-2xl font-bold text-slate-950">
            Krijo akademinë
          </h1>

          <p className="mt-2 text-sm leading-6 text-slate-500">
            Vendos informacionin bazë të akademisë sportive. Mund ta plotësosh
            dhe ndryshosh më vonë nga cilësimet.
          </p>
        </div>

        <form onSubmit={krijo} className="mt-7 space-y-5">
          <label className="block text-xs font-semibold text-slate-600">
            Emri i akademisë
            <input
              type="text"
              required
              minLength={2}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Akademia Sportive Tirana"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Qyteti
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Tiranë"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          <label className="block text-xs font-semibold text-slate-600">
            Shteti
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              placeholder="Shqipëri"
              className="mt-1.5 w-full rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-blue-400"
            />
          </label>

          {gabimi && (
            <div className="rounded-xl bg-red-50 px-3 py-3 text-sm text-red-700">
              {gabimi}
            </div>
          )}

          <button
            type="submit"
            disabled={dukeRuajtur}
            className="w-full rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {dukeRuajtur ? "Duke krijuar..." : "Krijo akademinë"}
          </button>
        </form>
      </div>
    </div>
  );
}