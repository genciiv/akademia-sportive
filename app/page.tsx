import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  Dumbbell,
  HeartPulse,
  Target,
  UsersRound,
} from "lucide-react";

import { PublicFinalCta } from "@/components/public-final-cta";
import { PublicHome3DScene } from "@/components/public-home-3d-scene";
import { PublicHomeMotion } from "@/components/public-home-motion";
import { PublicHomeNav } from "@/components/public-home-nav";
import { PublicPricingPlans } from "@/components/public-pricing-plans";

const features = [
  {
    icon: UsersRound,
    title: "Sportistët & ekipet",
    description:
      "Menaxho sportistët, ekipet dhe strukturën sportive nga një vend.",
    tone: "bg-[#bdf1de] text-[#187b55]",
  },
  {
    icon: CalendarDays,
    title: "Kalendari & stërvitjet",
    description:
      "Planifiko seanca, ndeshje, ambiente dhe aktivitetet e akademisë.",
    tone: "bg-[#dce9ff] text-[#3552ff]",
  },
  {
    icon: BarChart3,
    title: "Performanca",
    description:
      "Ndiq progresin dhe të dhënat sportive me një pamje të qartë.",
    tone: "bg-[#dccfff] text-[#6354bd]",
  },
  {
    icon: HeartPulse,
    title: "Profili fizik & mjekësor",
    description:
      "Mbaj informacionin fizik dhe mjekësor të lidhur me sportistin.",
    tone: "bg-[#ffd5c0] text-[#a45e3d]",
  },
  {
    icon: Target,
    title: "Taktika & skautim",
    description:
      "Organizo vlerësimet, kandidatët dhe punën taktike të stafit.",
    tone: "bg-[#dce9ff] text-[#3552ff]",
  },
  {
    icon: Building2,
    title: "Administrimi",
    description:
      "Menaxho ambientet, stafin, financat dhe proceset e përditshme.",
    tone: "bg-[#bdf1de] text-[#187b55]",
  },
];

const footballModules = [
  {
    title: "Stërvitje të planifikuara",
    description:
      "Organizo seanca, ambiente dhe grupet pa rrëmujë.",
    accent: "bg-[#bdf1de]",
  },
  {
    title: "Ndeshje dhe rezultate",
    description:
      "Mbaj historikun e ndeshjeve dhe informacionin e ekipit.",
    accent: "bg-[#dce9ff]",
  },
  {
    title: "Zhvillimi i sportistit",
    description:
      "Shiko prezencën, performancën dhe progresin fizik në kohë.",
    accent: "bg-[#dccfff]",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-x-clip bg-[#eef3fb] text-[#171d3a]">
      <PublicHomeMotion />
      <PublicHomeNav />

      <PublicHome3DScene />

      {/* ======================================================
          HERO
      ====================================================== */}

      <section className="relative z-10 overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute -left-52 bottom-[-160px] h-[520px] w-[520px] rounded-full bg-[#bdf1de]/45 blur-[110px]" />
          <div className="absolute -right-44 top-[-180px] h-[520px] w-[520px] rounded-full bg-[#dccfff]/40 blur-[110px]" />
          <div className="absolute bottom-[-160px] right-[-80px] h-[400px] w-[400px] rounded-full bg-[#ffd5c0]/38 blur-[110px]" />
        </div>

        <div className="mx-auto grid min-h-[720px] max-w-[1140px] items-center gap-14 px-5 py-16 sm:px-6 sm:py-20 lg:grid-cols-[1.04fr_.96fr] lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-[#3552ff] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#3552ff]" />
              7 ditë PRO falas për çdo akademi të re
            </div>

            <h1 className="mt-7 text-[clamp(2.8rem,6vw,5rem)] font-extrabold leading-[1.02] tracking-[-0.045em] text-[#171d3a]">
              Drejto akademinë.
              <span className="block text-[#3552ff]">
                Zhvillo sportistët.
              </span>
            </h1>

            <p className="mt-6 max-w-[620px] text-base leading-7 text-[#5a6285] sm:text-lg sm:leading-8">
              Një platformë e vetme për sportistët, ekipet, trajnerët,
              stërvitjet, performancën, financat dhe punën e përditshme të
              akademisë.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apliko?plan=STARTER"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#3552ff] px-7 py-4 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(53,82,255,.58)] transition hover:-translate-y-0.5 hover:bg-[#2945ef] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#3552ff]/25"
              >
                Fillo me 7 ditë falas
                <ArrowRight size={16} />
              </Link>

              <a
                href="#platforma"
                className="inline-flex items-center justify-center rounded-full border-[1.5px] border-[#171d3a]/65 bg-white px-7 py-4 text-sm font-semibold text-[#171d3a] transition hover:-translate-y-0.5 hover:bg-[#f7f9fe]"
              >
                Shiko si funksionon
              </a>
            </div>

            <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-sm text-[#687095]">
              {[
                "Pa kartë pagese",
                "Role & akses të kontrolluar",
                "Multi-sport",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#dce9ff] text-[#3552ff]">
                    <Check size={13} strokeWidth={2.5} />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* HERO DASHBOARD */}

          <div className="relative mx-auto w-full max-w-[520px]">
            <div className="absolute -left-8 top-14 z-20 hidden w-48 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_55px_-28px_rgba(23,29,58,.35)] lg:block">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#3552ff]">
                Sot
              </p>

              <p className="mt-2 text-3xl font-extrabold tracking-[-0.04em] text-[#171d3a]">
                6
              </p>

              <p className="mt-1 text-xs leading-5 text-[#687095]">
                aktivitete të planifikuara
              </p>
            </div>

            <div className="relative overflow-hidden rounded-[30px_30px_86px_30px] border border-slate-200 bg-white p-3 shadow-[0_32px_80px_-38px_rgba(23,29,58,.4)]">
              <div className="rounded-[24px_24px_76px_24px] bg-[#f7f9fe] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-[#8b91ad]">
                      Akademia Sportive
                    </p>

                    <p className="mt-1 text-base font-bold text-[#171d3a]">
                      Paneli i sotëm
                    </p>
                  </div>

                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3552ff] text-white shadow-[0_12px_24px_-12px_rgba(53,82,255,.55)]">
                    <BarChart3 size={19} />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Sportistë", "128", "bg-[#bdf1de]"],
                    ["Ekipe", "12", "bg-[#dce9ff]"],
                    ["Trajnerë", "14", "bg-[#dccfff]"],
                    ["Seanca", "36", "bg-[#ffd5c0]"],
                  ].map(([label, value, tone]) => (
                    <div
                      key={label}
                      className="rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm"
                    >
                      <div
                        className={`mb-3 h-2.5 w-8 rounded-full ${tone}`}
                      />

                      <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#8b91ad]">
                        {label}
                      </p>

                      <p className="mt-1 text-2xl font-extrabold tracking-[-0.035em] text-[#171d3a]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-[#8b91ad]">
                        Aktiviteti i javës
                      </p>

                      <p className="mt-1 text-sm font-semibold text-[#171d3a]">
                        Ecuria e akademisë
                      </p>
                    </div>

                    <span className="rounded-full bg-[#dce9ff] px-3 py-1 text-[11px] font-semibold text-[#3552ff]">
                      +18%
                    </span>
                  </div>

                  <div className="mt-6 flex h-28 items-end gap-2">
                    {[46, 72, 58, 88, 66, 94, 82].map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-full bg-gradient-to-t from-[#3552ff] to-[#93a5ff]"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 right-6 hidden w-60 rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_20px_55px_-28px_rgba(23,29,58,.35)] lg:block">
              <p className="text-xs font-semibold text-[#3552ff]">
                Nga zyra te fusha
              </p>

              <p className="mt-1 text-xs leading-5 text-[#687095]">
                Të dhënat sportive dhe administrative në të njëjtin sistem.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ======================================================
          QUICK BENEFITS
      ====================================================== */}

      <section className="relative z-10 px-5 py-8 sm:px-6">
        <div className="mx-auto grid max-w-[1140px] grid-cols-2 gap-3 rounded-[30px] border border-slate-200 bg-white p-4 shadow-[0_20px_45px_-34px_rgba(23,29,58,.2)] sm:grid-cols-4 sm:gap-4 sm:p-5">
          {[
            ["1 platformë", "Për gjithë akademinë", "bg-[#bdf1de]"],
            ["Çdo ekip", "Në të njëjtin sistem", "bg-[#dccfff]"],
            ["Çdo trajner", "Me akses të kontrolluar", "bg-[#dce9ff]"],
            ["Çdo të dhënë", "Kur të duhet", "bg-[#ffd5c0]"],
          ].map(([title, subtitle, tone]) => (
            <div
              key={title}
              className="rounded-[22px] border border-slate-200 bg-white px-4 py-5 text-center"
            >
              <span
                className={`mx-auto mb-3 block h-2.5 w-8 rounded-full ${tone}`}
              />

              <p className="text-sm font-bold text-[#171d3a]">
                {title}
              </p>

              <p className="mt-1 text-xs text-[#707897]">
                {subtitle}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ======================================================
          PLATFORM / FEATURES
      ====================================================== */}

      <section
        id="platforma"
        className="relative z-10 px-5 py-20 sm:px-6 sm:py-24 lg:py-28"
      >
        <div className="mx-auto max-w-[1140px]">
          <div className="mx-auto max-w-2xl text-center" data-reveal>
            <span className="inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] text-[#3552ff]">
              Platforma
            </span>

            <h2 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#171d3a] sm:text-4xl lg:text-5xl">
              Gjithçka që i duhet akademisë.
            </h2>

            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#5a6285]">
              Një sistem i organizuar për punën sportive dhe administrative,
              nga fusha deri te zyra.
            </p>
          </div>

          <div
            id="funksionet"
            className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature, index) => {
              const Icon = feature.icon;

              const radiusClasses = [
                "rounded-[28px_28px_78px_28px]",
                "rounded-[28px_78px_28px_28px]",
                "rounded-[78px_28px_28px_28px]",
                "rounded-[28px_28px_28px_78px]",
                "rounded-[28px_78px_28px_28px]",
                "rounded-[78px_28px_28px_28px]",
              ];

              return (
                <article
                  key={feature.title}
                  data-reveal
                  data-tilt-card
                  className={[
                    "min-h-[230px] border border-slate-200 bg-white p-7 shadow-[0_20px_45px_-34px_rgba(23,29,58,.24)] transition hover:-translate-y-1 hover:shadow-[0_28px_55px_-34px_rgba(23,29,58,.28)]",
                    radiusClasses[index % radiusClasses.length],
                  ].join(" ")}
                >
                  <span
                    className={[
                      "flex h-[52px] w-[52px] items-center justify-center rounded-[18px]",
                      feature.tone,
                    ].join(" ")}
                  >
                    <Icon size={20} strokeWidth={1.9} />
                  </span>

                  <h3 className="mt-6 text-xl font-bold tracking-[-0.025em] text-[#171d3a]">
                    {feature.title}
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-[#5a6285]">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ======================================================
          FOOTBALL ACADEMY GRAPHIC
      ====================================================== */}

      <section className="relative z-10 px-5 py-20 sm:px-6 sm:py-24 lg:py-28">
        <div className="mx-auto max-w-[1140px]">
          <div className="grid gap-10 lg:grid-cols-[1.02fr_.98fr] lg:items-center">
            <div data-reveal>
              <span className="inline-flex rounded-full bg-[#bdf1de] px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#187b55]">
                Akademi futbolli
              </span>

              <h2 className="mt-5 text-3xl font-extrabold leading-[1.08] tracking-[-0.035em] text-[#171d3a] sm:text-4xl lg:text-5xl">
                Gjithçka e organizuar për zhvillimin e ekipit.
              </h2>

              <p className="mt-5 max-w-xl text-base leading-7 text-[#5a6285]">
                Ndërto një rrjedhë pune të qartë për stërvitjet, ndeshjet,
                sportistët dhe stafin. Platforma i jep akademisë kontroll dhe
                qartësi në punën e përditshme.
              </p>

              <div className="mt-8 space-y-3">
                {[
                  "Planifikim i stërvitjeve dhe seancave",
                  "Profili i sportistit me progres dhe prezencë",
                  "Menaxhim i ekipeve, ndeshjeve dhe roleve",
                  "Komunikim më i qartë me stafin",
                ].map((item, index) => (
                  <div
                    key={item}
                    className="flex items-center gap-3 rounded-[20px] border border-slate-200 bg-white px-4 py-3 shadow-sm"
                  >
                    <span
                      className={[
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                        index % 2 === 0
                          ? "bg-[#bdf1de] text-[#187b55]"
                          : "bg-[#dce9ff] text-[#3552ff]",
                      ].join(" ")}
                    >
                      <Check size={14} strokeWidth={2.5} />
                    </span>

                    <span className="text-sm font-semibold text-[#39405f]">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/apliko"
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#3552ff] px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_-10px_rgba(53,82,255,.55)] transition hover:-translate-y-0.5 hover:bg-[#2945ef]"
              >
                Apliko
                <ArrowRight size={15} />
              </Link>
            </div>

            {/* FOOTBALL FIELD GRAPHIC */}

            <div
              data-reveal
              data-tilt-card
              className="overflow-hidden rounded-[34px_34px_92px_34px] border border-slate-200 bg-white p-4 shadow-[0_28px_70px_-38px_rgba(23,29,58,.32)]"
            >
              <div className="rounded-[28px] border border-slate-200 bg-[#f7f9fe] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#3552ff]">
                      Pamje sportive
                    </p>

                    <h3 className="mt-1 text-xl font-bold tracking-[-0.03em] text-[#171d3a]">
                      Qendra e aktivitetit
                    </h3>
                  </div>

                  <span className="rounded-full bg-[#bdf1de] px-3 py-1 text-xs font-semibold text-[#187b55]">
                    Live
                  </span>
                </div>

                <div className="relative h-[380px] overflow-hidden rounded-[26px] bg-[linear-gradient(180deg,#73ce91_0%,#269d61_100%)]">
                  <div className="absolute inset-[18px] rounded-[22px] border-2 border-white/65" />

                  <div className="absolute left-1/2 top-[18px] h-[344px] -translate-x-1/2 border-l-2 border-white/55" />

                  <div className="absolute left-1/2 top-1/2 h-[86px] w-[86px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/65" />

                  <div className="absolute left-1/2 top-[18px] h-[92px] w-[180px] -translate-x-1/2 border-x-2 border-b-2 border-white/60" />

                  <div className="absolute bottom-[18px] left-1/2 h-[92px] w-[180px] -translate-x-1/2 border-x-2 border-t-2 border-white/60" />

                  {[
                    ["GK", "left-[47%] top-[9%]", "bg-white"],
                    ["LB", "left-[19%] top-[30%]", "bg-[#dce9ff]"],
                    ["CB", "left-[43%] top-[31%]", "bg-[#dce9ff]"],
                    ["RB", "right-[19%] top-[30%]", "bg-[#dce9ff]"],
                    ["CM", "left-[38%] top-[50%]", "bg-[#dccfff]"],
                    ["AM", "right-[30%] top-[51%]", "bg-[#ffd5c0]"],
                    ["ST", "left-[47%] top-[70%]", "bg-white"],
                  ].map(([label, position, tone]) => (
                    <span
                      key={label}
                      className={[
                        "absolute flex h-10 w-10 items-center justify-center rounded-full text-[10px] font-extrabold text-[#171d3a] shadow-lg",
                        position,
                        tone,
                      ].join(" ")}
                    >
                      {label}
                    </span>
                  ))}

                  <div className="absolute bottom-4 left-4 right-4 grid grid-cols-3 gap-3">
                    {[
                      ["Seanca", "36"],
                      ["Ndeshje", "12"],
                      ["Sportistë", "128"],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="rounded-[18px] border border-white bg-white p-3 shadow-sm"
                      >
                        <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-[#7b82a2]">
                          {label}
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-[#171d3a]">
                          {value}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* MODULE CARDS */}

          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {footballModules.map((module, index) => (
              <article
                key={module.title}
                data-reveal
                data-tilt-card
                className={[
                  "border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-34px_rgba(23,29,58,.24)]",
                  index === 0
                    ? "rounded-[28px_28px_78px_28px]"
                    : index === 1
                      ? "rounded-[78px_28px_28px_28px]"
                      : "rounded-[28px_78px_28px_28px]",
                ].join(" ")}
              >
                <span
                  className={[
                    "block h-2.5 w-10 rounded-full",
                    module.accent,
                  ].join(" ")}
                />

                <span className="mt-5 inline-flex rounded-full bg-[#f3f5fb] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#3552ff]">
                  Modul
                </span>

                <h3 className="mt-5 text-xl font-bold tracking-[-0.03em] text-[#171d3a]">
                  {module.title}
                </h3>

                <p className="mt-3 text-sm leading-6 text-[#5a6285]">
                  {module.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================================
          PRICING - REAL DATABASE DATA
      ====================================================== */}

      <PublicPricingPlans />

      {/* ======================================================
          FINAL CTA
      ====================================================== */}

      <PublicFinalCta />

      {/* ======================================================
          FOOTER
      ====================================================== */}

      <footer className="relative z-10 px-5 pb-10 pt-4 sm:px-6">
        <div className="mx-auto max-w-[1140px] rounded-[30px] border border-slate-200 bg-white px-6 py-8 shadow-[0_18px_45px_-34px_rgba(23,29,58,.18)]">
          <div className="flex flex-col justify-between gap-7 sm:flex-row sm:items-center">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#3552ff] text-white shadow-[0_10px_25px_-12px_rgba(53,82,255,.6)]">
                <Dumbbell size={17} />
              </span>

              <div>
                <p className="text-sm font-extrabold tracking-[-0.02em] text-[#171d3a]">
                  Akademia Sportive
                </p>

                <p className="text-xs text-[#7b82a2]">
                  Platforma e menaxhimit
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-5 text-sm font-medium text-[#5a6285]">
              <a
                href="#platforma"
                className="transition hover:text-[#3552ff]"
              >
                Platforma
              </a>

              <a
                href="#funksionet"
                className="transition hover:text-[#3552ff]"
              >
                Funksionet
              </a>

              <a
                href="#planet"
                className="transition hover:text-[#3552ff]"
              >
                Planet
              </a>

              <Link
                href="/hyrje"
                className="transition hover:text-[#3552ff]"
              >
                Hyr
              </Link>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6 text-xs text-[#8b91ad]">
            © {new Date().getFullYear()} Akademia Sportive. Të gjitha të
            drejtat e rezervuara.
          </div>
        </div>
      </footer>
    </main>
  );
}