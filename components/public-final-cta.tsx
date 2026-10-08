import Link from "next/link";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Users2,
} from "lucide-react";

const highlights = [
  {
    icon: CalendarDays,
    title: "7 ditë PRO falas",
    description: "Provoje platformën pa pagesë në fillim.",
  },
  {
    icon: ShieldCheck,
    title: "Pa kartë pagese",
    description: "Fillim i thjeshtë dhe pa pengesa.",
  },
  {
    icon: Users2,
    title: "Për akademi dhe ekipe",
    description: "I përshtatshëm për trajnerë, staf dhe sportistë.",
  },
];

export function PublicFinalCta() {
  return (
    <section className="relative z-10 py-14 sm:py-16">
      <div className="mx-auto max-w-[1140px] px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-white shadow-[0_30px_80px_-40px_rgba(23,29,58,.28)]">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -left-10 top-10 h-32 w-32 rounded-full bg-[#dce7ff] blur-3xl opacity-70" />
            <div className="absolute right-0 top-0 h-40 w-40 rounded-full bg-[#dff4ea] blur-3xl opacity-70" />
            <div className="absolute bottom-0 left-1/3 h-28 w-28 rounded-full bg-[#f1e2ff] blur-3xl opacity-60" />
          </div>

          <div className="relative grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1.25fr_.75fr] lg:gap-10 lg:px-10 lg:py-12">
            <div className="flex flex-col justify-between">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full border border-[#d6e1ff] bg-[#f4f7ff] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#3552ff]">
                  <Sparkles size={14} />
                  Apliko sot
                </span>

                <h2 className="mt-5 max-w-[760px] text-[34px] font-extrabold leading-[1.04] tracking-[-0.03em] text-[#171d3a] sm:text-[40px] lg:text-[48px]">
                  Organizimi i akademisë mund të jetë shumë më i thjeshtë.
                </h2>

                <p className="mt-4 max-w-[680px] text-[15px] leading-7 text-[#5a6285] sm:text-[16px]">
                  Krijo llogarinë, provo funksionet PRO për 7 ditë dhe
                  menaxho sportistët, ekipet, stërvitjet, pagesat dhe
                  komunikimin në një sistem të vetëm.
                </p>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/apliko"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3552ff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_14px_34px_-12px_rgba(53,82,255,.55)] transition hover:-translate-y-0.5 hover:bg-[#2443f0] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3552ff]/25"
                >
                  Apliko tani
                  <ArrowRight size={16} />
                </Link>

                <Link
                  href="#planet"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-[#171d3a] transition hover:-translate-y-0.5 hover:bg-[#f7f9fe] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3552ff]/20"
                >
                  Shiko planet
                </Link>
              </div>
            </div>

            <div className="rounded-[28px] border border-slate-200 bg-[#f8fbff] p-5 shadow-[0_16px_40px_-30px_rgba(23,29,58,.18)] sm:p-6">
              <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#7b82a2]">
                  Çfarë fiton
                </p>
                <p className="mt-2 text-lg font-bold text-[#171d3a]">
                  Fillim i shpejtë për akademinë tënde
                </p>
              </div>

              <div className="space-y-3">
                {highlights.map((item) => {
                  const Icon = item.icon;

                  return (
                    <div
                      key={item.title}
                      className="flex gap-3 rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#eef3ff] text-[#3552ff]">
                        <Icon size={18} />
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#171d3a]">
                          {item.title}
                        </p>
                        <p className="mt-1 text-sm leading-6 text-[#5a6285]">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 rounded-2xl bg-[#171d3a] px-4 py-4 text-white">
                <div className="flex items-start gap-3">
                  <CheckCircle2
                    size={18}
                    className="mt-0.5 shrink-0 text-[#8fe3b3]"
                  />
                  <p className="text-sm leading-6 text-white/90">
                    Aktivizim i thjeshtë dhe ndërfaqe e qartë për përdorim
                    të përditshëm nga telefoni dhe kompjuteri.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}