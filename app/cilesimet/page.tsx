import { redirect } from "next/navigation";
import {
  Building2,
  CreditCard,
  Settings2,
  Sparkles,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { AcademySettings } from "@/components/cilesimet/academy-settings";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

export default async function Page() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SETTINGS_VIEW
    );

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect("/hyrje");
    }

    redirect("/");
  }

  return (
    <AppShell>
      <section className="mb-6 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
              <Settings2 size={25} />
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
                <Sparkles size={12} />
                Konfigurimi i akademisë
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Cilësimet
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Menaxho profilin e akademisë,
                abonimin dhe përdorimin e planit
                në një vend të vetëm.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-violet-700">
                <Building2 size={15} />

                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Akademia
                </span>
              </div>

              <p className="mt-1 text-xs font-semibold text-slate-600">
                Profil & kontakt
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-sky-700">
                <CreditCard size={15} />

                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Abonimi
                </span>
              </div>

              <p className="mt-1 text-xs font-semibold text-slate-600">
                Plan & përdorim
              </p>
            </div>
          </div>
        </div>
      </section>

      <AcademySettings />
    </AppShell>
  );
}