import Link from "next/link";

import {
  Ban,
  LogOut,
  ShieldAlert,
} from "lucide-react";

export default function SuspendedAcademyPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-white to-amber-50 px-5 py-12">
      <section className="w-full max-w-xl rounded-[32px] border border-amber-200/80 bg-white p-8 shadow-xl shadow-amber-100/40 sm:p-10">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
          <ShieldAlert size={28} />
        </div>

        <div className="mt-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
            <Ban size={13} />
            Akademi e çaktivizuar
          </div>

          <h1 className="mt-4 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
            Aksesi në akademi është pezulluar
          </h1>

          <p className="mt-3 leading-7 text-slate-600">
            Kjo akademi është çaktivizuar përkohësisht nga administratori i platformës.
            Të dhënat e akademisë janë ruajtur dhe do të jenë përsëri të disponueshme
            nëse akademia riaktivizohet.
          </p>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm font-semibold text-slate-700">
              Nëse mendon se ky është një gabim, kontakto administratorin e platformës.
            </p>
          </div>

          <Link
            href="/hyrje"
            className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            <LogOut size={16} />
            Kthehu te hyrja
          </Link>
        </div>
      </section>
    </main>
  );
}