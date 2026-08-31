"use client";

import { Plus, Search } from "lucide-react";
import { AppShell } from "./app-shell";
import { PageHeader } from "./page-header";

export function ModulePage({ title, description, columns, rows, button = "Shto të re" }: { title: string; description: string; columns: string[]; rows: string[][]; button?: string }) {
  return (
    <AppShell>
      <PageHeader
        title={title}
        description={description}
        action={<button className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-800"><Plus size={17}/>{button}</button>}
      />
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex max-w-sm flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5">
            <Search size={16} className="text-slate-400"/>
            <input placeholder="Kërko..." className="w-full bg-transparent text-sm outline-none"/>
          </div>
          <button className="rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600">Filtro rezultatet</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                {columns.map((col) => <th key={col} className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{col}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60">
                  {row.map((cell, j) => <td key={j} className="px-5 py-4 text-sm text-slate-600 first:font-semibold first:text-slate-900">{cell}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
