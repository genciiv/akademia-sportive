"use client";

import { useEffect } from "react";
import {
  RefreshCcw,
  TriangleAlert,
} from "lucide-react";

export default function AthletePortalError({
  error,
  reset,
}: {
  error: Error & {
    digest?: string;
  };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      "Athlete portal error:",
      error
    );
  }, [error]);

  return (
    <div className="flex min-h-[55vh] items-center justify-center px-4 py-10">
      <section className="w-full max-w-xl overflow-hidden rounded-[28px] border border-red-100 bg-white shadow-sm">
        <div className="bg-gradient-to-br from-red-50 via-white to-orange-50 p-6 text-center sm:p-8">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-red-100 bg-white text-red-600 shadow-sm">
            <TriangleAlert size={26} />
          </div>

          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-950">
            Nuk mundëm ta ngarkojmë këtë faqe
          </h1>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500">
            Ndodhi një problem i përkohshëm gjatë ngarkimit të portalit.
            Mund të provosh përsëri pa humbur sesionin tënd.
          </p>

          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2"
          >
            <RefreshCcw size={16} />
            Provo përsëri
          </button>

          {error.digest ? (
            <p className="mt-5 text-[11px] font-medium text-slate-400">
              Referenca: {error.digest}
            </p>
          ) : null}
        </div>
      </section>
    </div>
  );
}