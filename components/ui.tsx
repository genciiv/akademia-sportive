import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({ title, value, hint, accent = false }: { title: string; value: string | number; hint: string; accent?: boolean }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-slate-500">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{value}</p>
          <p className={cn("mt-1 text-[11px]", accent ? "text-emerald-600" : "text-slate-400")}>{hint}</p>
        </div>
        <ChevronRight size={17} className="text-blue-600" />
      </div>
    </div>
  );
}

export function Panel({ title, subtitle, children, className }: { title: string; subtitle?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]", className)}>
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 text-xs text-slate-400">{subtitle}</p>}
      </div>
      {children}
    </section>
  );
}
