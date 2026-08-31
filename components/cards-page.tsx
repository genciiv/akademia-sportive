"use client";
import { Plus } from "lucide-react";
import { AppShell } from "./app-shell";
import { PageHeader } from "./page-header";

export function CardsPage({ title, description, items, button = "Shto" }: { title: string; description: string; items: {title:string;meta:string;stat:string;note:string}[]; button?:string }) {
  return <AppShell>
    <PageHeader title={title} description={description} action={<button className="inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white"><Plus size={17}/>{button}</button>} />
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {items.map((item, i) => <article key={i} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-sm font-bold text-blue-700">{i+1}</div>
        <h2 className="mt-4 text-lg font-bold text-slate-950">{item.title}</h2>
        <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
        <div className="mt-5 flex items-end justify-between border-t border-slate-100 pt-4"><div><p className="text-2xl font-bold text-slate-950">{item.stat}</p><p className="text-[11px] text-slate-400">{item.note}</p></div><button className="text-xs font-semibold text-blue-700">Hap detajet</button></div>
      </article>)}
    </div>
  </AppShell>
}
