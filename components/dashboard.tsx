"use client";

import { CalendarDays, ChevronRight, MapPin, ThumbsDown, ThumbsUp, CircleHelp } from "lucide-react";
import { AppShell } from "./app-shell";
import { AttendanceChart, PerformanceChart } from "./dashboard-charts";
import { Panel, StatCard } from "./ui";

const events = [
  { type: "Seancë stërvitore", team: "U19", date: "Mër, 17 Pri, 18:40", time: "19:00–20:00", place: "Fusha stërvitore 2", badge: "blue", stats: [14,1,2,3] },
  { type: "Seancë stërvitore", team: "U19", date: "Pre, 19 Pri, 18:40", time: "19:00–20:00", place: "Fusha stërvitore 2", badge: "blue", stats: [17,0,0,1] },
  { type: "Ndeshje", team: "U19 kundër Akademisë Tirana", date: "Die, 21 Pri, 14:00", time: "15:00–17:00", place: "Stadiumi i Akademisë", badge: "green", stats: [12,3,2,1] },
  { type: "Seancë stërvitore", team: "U19", date: "Mër, 24 Pri, 18:40", time: "19:00–20:00", place: "Fusha stërvitore 2", badge: "blue", stats: [18,0,0,0] },
  { type: "Ndeshje", team: "U19 kundër Yjeve të Fierit", date: "Die, 28 Pri, 14:00", time: "15:00–17:00", place: "Arena Sportive", badge: "green", stats: [18,0,0,0] }
];

export function Dashboard() {
  return (
    <AppShell>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">Përshëndetje, Trajner! 💪</h1>
        <p className="mt-1.5 text-sm text-slate-500">Ja një përmbledhje e aktiviteteve të ardhshme dhe ecurisë së fundit të ekipeve tuaja.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Ushtrimet e akademisë" value="37" hint="+3 gjatë javës së fundit" accent />
        <StatCard title="Seancat" value="51" hint="+6 gjatë javës së fundit" accent />
        <StatCard title="Sportistët" value="214" hint="+12 gjatë javës së fundit" accent />
        <StatCard title="Anëtarët aktivë" value="314" hint="+29 gjatë javës së fundit" accent />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.08fr_.92fr]">
        <Panel title="Aktivitetet e ardhshme">
          <div className="divide-y divide-slate-100">
            {events.map((event, index) => (
              <div key={index} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
                  <div className="min-w-0">
                    <div className={event.badge === "green" ? "inline-flex rounded-md bg-lime-100 px-2 py-1 text-[10px] font-bold text-lime-700" : "inline-flex rounded-md bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-700"}>
                      {event.type} · {event.team}
                    </div>
                    <p className="mt-2 text-[15px] font-bold text-slate-950">{event.date}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span>{event.time}</span><span>•</span><span className="flex items-center gap-1"><MapPin size={11} />{event.place}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex flex-col items-center gap-1"><ThumbsUp size={15}/>{event.stats[0]}</span>
                    <span className="flex flex-col items-center gap-1"><CircleHelp size={15}/>{event.stats[1]}</span>
                    <span className="flex flex-col items-center gap-1"><ThumbsDown size={15}/>{event.stats[2]}</span>
                    <span className="flex flex-col items-center gap-1"><CalendarDays size={15}/>{event.stats[3]}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-5 flex items-center gap-1 text-xs font-semibold text-blue-700">Shiko të gjitha <ChevronRight size={14}/></button>
        </Panel>

        <div className="space-y-5">
          <Panel title="Performanca e ekipit" subtitle="10 seancat e fundit · U17"><PerformanceChart /></Panel>
          <Panel title="Pjesëmarrja e ekipit" subtitle="10 seancat e fundit · U17"><AttendanceChart /></Panel>
        </div>
      </div>
    </AppShell>
  );
}
