"use client";

import { Bell, ChevronDown, Menu, MessageCircle, Search } from "lucide-react";

export function Topbar({ onMenu }: { onMenu: () => void }) {
  return (
    <header className="flex h-[72px] items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button onClick={onMenu} className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 lg:hidden" aria-label="Hap menunë">
          <Menu size={21} />
        </button>
        <button className="hidden items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 sm:flex">
          2026/27 <ChevronDown size={14} />
        </button>
      </div>

      <div className="mx-4 hidden w-full max-w-[340px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 md:flex">
        <Search size={17} className="text-slate-400" />
        <input className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" placeholder="Kërko..." />
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <button className="rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Mesazhet"><MessageCircle size={19} /></button>
        <button className="relative rounded-xl p-2.5 text-slate-500 hover:bg-slate-100" aria-label="Njoftimet">
          <Bell size={19} />
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />
        </button>
        <div className="ml-1 flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-slate-50">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-cyan-400 text-xs font-bold text-white">TG</div>
          <div className="hidden text-left sm:block">
            <p className="text-xs font-semibold text-slate-900">Trajner Genti</p>
            <p className="text-[10px] text-slate-400">Trajner kryesor</p>
          </div>
          <ChevronDown size={15} className="hidden text-slate-400 sm:block" />
        </div>
      </div>
    </header>
  );
}
