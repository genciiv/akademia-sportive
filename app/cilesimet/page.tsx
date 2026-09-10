import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { SeasonsSettings } from "@/components/cilesimet/seasons-settings";

export default function Page() {
  return (
    <AppShell>
      <PageHeader
        title="Cilësimet"
        description="Konfigurimi i akademisë dhe sezonit aktiv."
      />

      <div className="grid gap-5 xl:grid-cols-2">
        <SeasonsSettings />

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="font-bold text-slate-900">
            Preferencat
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Preferencat e tjera të akademisë do të menaxhohen këtu.
          </p>
        </section>
      </div>
    </AppShell>
  );
}