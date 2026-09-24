import Image from "next/image";
import Link from "next/link";
import { PublicHomeNav } from "@/components/public-home-nav";
import { PublicHomeMotion } from "@/components/public-home-motion";
import {
  ArrowRight,
  BarChart3,
  Building2,
  CalendarDays,
  Check,
  Dumbbell,
  HeartPulse,
  Menu,
  ShieldCheck,
  Target,
  UsersRound,
} from "lucide-react";

const features = [
  {
    icon: UsersRound,
    title: "Sportistët & ekipet",
    description:
      "Menaxho sportistët, ekipet dhe strukturën sportive nga një vend.",
  },
  {
    icon: CalendarDays,
    title: "Kalendari & stërvitjet",
    description:
      "Planifiko seanca, ndeshje, ambiente dhe aktivitetet e akademisë.",
  },
  {
    icon: BarChart3,
    title: "Performanca",
    description: "Ndiq progresin dhe të dhënat sportive me një pamje të qartë.",
  },
  {
    icon: HeartPulse,
    title: "Profili fizik & mjekësor",
    description:
      "Mbaj informacionin fizik dhe mjekësor të lidhur me sportistin.",
  },
  {
    icon: Target,
    title: "Taktika & skautim",
    description: "Organizo vlerësimet, kandidatët dhe punën taktike të stafit.",
  },
  {
    icon: Building2,
    title: "Administrimi",
    description:
      "Menaxho ambientet, stafin, financat dhe proceset e përditshme.",
  },
];

const starterFeatures = [
  "Deri në 35 sportistë",
  "Deri në 5 ekipe",
  "Deri në 5 anëtarë stafi",
  "Deri në 5 ambiente",
];

const proFeatures = [
  "Deri në 300 sportistë",
  "Deri në 25 ekipe",
  "Deri në 50 anëtarë stafi",
  "Deri në 15 ambiente",
  "Profil mjekësor & fizik",
  "Performancë, skautim dhe taktika",
  "Raporte të avancuara",
];
const proPortalFeatures = [
  "Gjithçka nga plani Pro",
  "Deri në 50 llogari sportistësh",
  "Dashboard personal për sportistin",
  "Orari personal i stërvitjeve dhe ndeshjeve",
  "Historia dhe statistikat e prezencës",
  "Ftesa dhe hyrje e dedikuar për sportistët",
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-slate-950">
      <PublicHomeMotion />
      <PublicHomeNav />

      <section className="relative overflow-hidden bg-[#f7fbff]">
        <div className="absolute right-[-120px] top-[-120px] h-[420px] w-[420px] rounded-full bg-blue-100/70 blur-3xl" />

        <div className="relative mx-auto grid min-h-[720px] max-w-7xl items-center gap-12 px-5 py-16 sm:py-20 lg:grid-cols-[1.02fr_.98fr] lg:gap-14 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-4 py-2 text-xs font-semibold text-blue-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-blue-500" />7 ditë PRO
              falas për çdo akademi të re
            </div>

            <h1 className="mt-7 text-4xl font-bold leading-[1.05] tracking-[-0.04em] text-slate-950 sm:text-5xl lg:text-[64px]">
              Drejto akademinë.
              <span className="block text-blue-600">Zhvillo sportistët.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-7 text-slate-600 sm:text-lg">
              Një platformë e vetme për sportistët, ekipet, trajnerët,
              stërvitjet, performancën, financat dhe punën e përditshme të
              akademisë.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/apliko?plan=STARTER"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-blue-700"
              >
                Fillo me 7 ditë falas
                <ArrowRight size={16} />
              </Link>

              <a
                href="#platforma"
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Shiko si funksionon
              </a>
            </div>

            <div className="mt-9 grid max-w-xl gap-3 text-sm text-slate-500 sm:grid-cols-3">
              {[
                "Pa kartë pagese",
                "Role & akses të kontrolluar",
                "Multi-sport",
              ].map((item) => (
                <div key={item} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Check size={13} />
                  </span>

                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -left-8 top-12 z-10 hidden w-52 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl lg:block">
              <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-blue-600">
                Sot
              </p>

              <p className="mt-2 text-3xl font-bold text-slate-950">6</p>

              <p className="mt-1 text-sm text-slate-500">
                aktivitete të planifikuara
              </p>
            </div>

            <div className="ml-auto max-w-[520px] overflow-hidden rounded-[30px] border border-blue-100 bg-white p-3 shadow-[0_24px_70px_rgba(30,64,175,0.12)]">
              <div className="rounded-[24px] bg-[#f7f9fc] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-slate-400">
                      Akademia Sportive
                    </p>

                    <p className="mt-1 text-base font-bold text-slate-950">
                      Paneli i sotëm
                    </p>
                  </div>

                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white">
                    <BarChart3 size={18} />
                  </span>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  {[
                    ["Sportistë", "128"],
                    ["Ekipe", "12"],
                    ["Trajnerë", "14"],
                    ["Seanca", "36"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="rounded-2xl border border-slate-200 bg-white p-4"
                    >
                      <p className="text-[11px] font-medium text-slate-400">
                        {label}
                      </p>

                      <p className="mt-2 text-2xl font-bold text-slate-950">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400">
                        Aktiviteti i javës
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-900">
                        Ecuria e akademisë
                      </p>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-600">
                      +18%
                    </span>
                  </div>

                  <div className="mt-6 flex h-28 items-end gap-2">
                    {[46, 72, 58, 88, 66, 94, 82].map((height, index) => (
                      <div
                        key={index}
                        className="flex-1 rounded-t-md bg-blue-500"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="absolute -bottom-8 right-6 hidden w-64 rounded-2xl border border-slate-200 bg-white p-4 shadow-xl lg:block">
              <p className="text-xs font-semibold text-blue-600">
                Nga zyra te fusha
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-600">
                Të dhënat sportive dhe administrative në të njëjtin sistem.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-slate-100 bg-white">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-6 px-5 py-7 text-center sm:grid-cols-4 lg:px-8">
          {[
            ["1 platformë", "Për gjithë akademinë"],
            ["Çdo ekip", "Në të njëjtin sistem"],
            ["Çdo trajner", "Me akses të kontrolluar"],
            ["Çdo të dhënë", "Kur të duhet"],
          ].map(([title, subtitle]) => (
            <div key={title}>
              <p className="text-sm font-semibold text-slate-900">{title}</p>
              <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
            </div>
          ))}
        </div>
      </section>

      <section
        id="platforma"
        className="bg-white px-5 py-16 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Platforma
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Gjithçka që i duhet akademisë.
            </h2>

            <p className="mt-4 text-base leading-7 text-slate-500">
              Një sistem i organizuar për punën sportive dhe administrative.
            </p>
          </div>

          <div
            id="funksionet"
            className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3"
          >
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg hover:shadow-blue-100/40"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                    <Icon size={18} />
                  </span>

                  <h3 className="mt-5 text-base font-semibold text-slate-950">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="bg-[#f7fbff] px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="relative min-h-[420px] overflow-hidden rounded-[28px] shadow-sm sm:min-h-[500px]">
            <Image
              src="/home/football.webp"
              alt="Stërvitje sportive në akademi"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out hover:scale-[1.025]"
            />
          </div>

          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Puna e përditshme
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Më pak kohë me administrimin.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Organizimi i akademisë nuk duhet të varet nga tabela, mesazhe dhe
              dokumente të shpërndara. Mbaji proceset në një vend të vetëm dhe
              jepi stafit qartësi.
            </p>

            <div className="mt-7 space-y-4">
              {[
                "Role dhe akses sipas stafit",
                "Planifikim i stërvitjeve dhe ambienteve",
                "Të dhënat e sportistit në një profil",
              ].map((item) => (
                <div key={item} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                    <Check size={14} />
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {item}
                  </span>
                </div>
              ))}
            </div>

            <Link
              href="/apliko"
              className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-600"
            >
              Apliko
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div className="max-w-xl lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Multi-sport
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Një platformë për akademi sportive.
            </h2>

            <p className="mt-5 text-base leading-7 text-slate-600">
              Struktura e platformës është ndërtuar për ekipe, akademi dhe
              programe sportive me nevoja të ndryshme.
            </p>

            <div className="mt-8 grid grid-cols-2 gap-3">
              {["Performancë", "Mjekësore", "Skautim", "Taktika"].map(
                (item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700"
                  >
                    {item}
                  </div>
                ),
              )}
            </div>
          </div>

          <div className="relative min-h-[420px] overflow-hidden rounded-[28px] shadow-sm sm:min-h-[500px] lg:order-2">
            <Image
              src="/home/basketball.webp"
              alt="Basketboll në akademi sportive"
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 ease-out hover:scale-[1.025]"
            />
          </div>
        </div>
      </section>

      <section
        id="planet"
        className="bg-[#f7fbff] px-5 py-16 sm:py-20 lg:px-8 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Planet
            </p>

            <h2 className="mt-4 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Një plan për çdo fazë të akademisë.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-500">
              Fillo me 7 ditë PRO falas dhe zgjidh planin që i përshtatet
              strukturës dhe mënyrës së punës së akademisë.
            </p>
          </div>

          <div className="mt-12 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[26px] border border-slate-200 bg-white p-7 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-400">
                Starter
              </p>

              <p className="mt-3 text-sm text-slate-500">
                Për akademi të vogla që duan të organizojnë proceset bazë.
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-950">
                  12,000
                </span>

                <span className="pb-1 text-xs text-slate-500">ALL / muaj</span>
              </div>

              <div className="mt-7 space-y-3">
                {starterFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <span className="text-sm leading-5 text-slate-600">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/apliko?plan=STARTER"
                className="mt-8 flex w-full justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Apliko
              </Link>
            </div>

            <div className="relative rounded-[26px] border border-blue-300 bg-white p-7 shadow-[0_20px_60px_rgba(37,99,235,0.12)]">
              <span className="absolute right-5 top-5 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white">
                Më i plotë
              </span>

              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-600">
                Pro
              </p>

              <p className="mt-3 pr-24 text-sm text-slate-500">
                Për akademi që duan menaxhim sportiv dhe administrativ të
                avancuar.
              </p>

              <div className="mt-6 flex items-end gap-2">
                <span className="text-3xl font-bold text-slate-950">
                  20,000
                </span>

                <span className="pb-1 text-xs text-slate-500">ALL / muaj</span>
              </div>

              <div className="mt-7 space-y-3">
                {proFeatures.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <Check
                      size={15}
                      className="mt-0.5 shrink-0 text-blue-600"
                    />
                    <span className="text-sm leading-5 text-slate-600">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>

              <Link
                href="/apliko?plan=PRO"
                className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                Apliko
                <ArrowRight size={15} />
              </Link>
            </div>

            <div className="relative overflow-hidden rounded-[26px] border border-slate-800 bg-slate-950 p-7 text-white shadow-[0_22px_65px_rgba(15,23,42,0.18)]">
              <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />

              <div className="relative">
                <p className="text-xs font-semibold uppercase tracking-[0.15em] text-blue-300">
                  Pro + Athlete Portal
                </p>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  Për akademi që duan t’u japin sportistëve akses në portalin e
                  tyre.
                </p>

                <div className="mt-6 flex items-end gap-2">
                  <span className="text-3xl font-bold">25,000</span>

                  <span className="pb-1 text-xs text-slate-400">
                    ALL / muaj
                  </span>
                </div>

                <div className="mt-7 space-y-3">
                  {proPortalFeatures.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <Check
                        size={15}
                        className="mt-0.5 shrink-0 text-blue-300"
                      />
                      <span className="text-sm leading-5 text-slate-300">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>

                <Link
                  href="/apliko?plan=PRO_PORTAL"
                  className="mt-8 flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
                >
                  Apliko
                  <ArrowRight size={15} />
                </Link>
              </div>
            </div>
          </div>

          <p className="mt-7 text-center text-xs leading-5 text-slate-400">
            Ke nevoja të veçanta? Mund të konfigurohet edhe një ofertë e
            personalizuar për akademinë.
          </p>
        </div>
      </section>

      <section className="bg-white px-5 py-16 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-50 to-sky-100 px-6 py-12 sm:px-10 lg:flex lg:items-center lg:justify-between lg:px-14">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue-600">
              Apliko sot
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
              Organizimi i akademisë mund të jetë më i thjeshtë.
            </h2>

            <p className="mt-4 text-sm leading-6 text-slate-600">
              Krijo llogarinë dhe provo funksionet PRO për 7 ditë.
            </p>
          </div>

          <Link
            href="/apliko"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 lg:mt-0"
          >
            Apliko
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-10 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white">
              <Dumbbell size={16} />
            </span>

            <div>
              <p className="text-sm font-bold">Akademia Sportive</p>
              <p className="text-xs text-slate-400">Platforma e menaxhimit</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-5 text-sm text-slate-500">
            <a href="#platforma" className="hover:text-blue-600">
              Platforma
            </a>
            <a href="#funksionet" className="hover:text-blue-600">
              Funksionet
            </a>
            <a href="#planet" className="hover:text-blue-600">
              Planet
            </a>
            <Link href="/hyrje" className="hover:text-blue-600">
              Hyr
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-8 max-w-7xl border-t border-slate-100 pt-6 text-xs text-slate-400">
          © {new Date().getFullYear()} Akademia Sportive. Të gjitha të drejtat e
          rezervuara.
        </div>
      </footer>
    </main>
  );
}
