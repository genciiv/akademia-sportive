"use client";

import {
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";

type Plan = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: string;
  currency: string;
  maxPlayers: number;
  maxTeams: number;
  maxStaff: number;
  maxFacilities: number;
  maxAthleteAccounts: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;

  _count: {
    subscriptions: number;
  };
};

const FEATURE_LABELS: Record<
  string,
  string
> = {
  MEDICAL: "Moduli mjekësor",
  PHYSICAL_PROFILE:
    "Profili fizik",
  PERFORMANCE:
    "Performanca",
  SCOUTING: "Scouting",
  TACTICS: "Taktikat",
  KNOWLEDGE_BASE:
    "Baza e njohurive",
  FACILITY_SCHEDULING:
    "Planifikimi i ambienteve",
  ADVANCED_REPORTS:
    "Raporte të avancuara",
  ATHLETE_PORTAL: "Portali i sportistit",
};

export function PlatformSettingsClient({
  plans,
  trialDays,
}: {
  plans: Plan[];
  trialDays: number;
}) {
  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Cilësimet
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Konfigurimi aktual i planeve dhe
          politikave të platformës.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
            <CalendarDays size={19} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">
              Trial për akademitë e reja
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Çdo akademi e aprovuar nis me
              planin PRO për {trialDays} ditë.
            </p>

            <div className="mt-4 inline-flex items-center rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-2xl font-bold text-slate-950">
                {trialDays}
              </span>

              <span className="ml-2 text-sm text-slate-500">
                ditë trial
              </span>
            </div>

            <p className="mt-3 text-xs text-amber-700">
              Aktualisht kjo vlerë është pjesë
              e kodit të onboarding-ut dhe nuk
              ndryshohet nga paneli.
            </p>
          </div>
        </div>
      </section>

      <div className="mt-5">
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-950">
            Planet
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Konfigurimi real i planeve të ruajtura në databazë.
          </p>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
            />
          ))}
        </div>
      </div>

      <section className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
            <ShieldCheck size={19} />
          </div>

          <div>
            <p className="text-sm font-bold text-slate-950">
              Menaxhimi i konfigurimit
            </p>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
              Kjo faqe është aktualisht
              read-only. Ndryshimet e çmimeve,
              limiteve ose kohëzgjatjes së
              trial-it nuk kryhen pa backend
              të dedikuar dhe auditim.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

function PlanCard({
  plan,
}: {
  plan: Plan;
}) {
  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                {plan.code}
              </span>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-bold",
                  plan.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {plan.isActive
                  ? "AKTIV"
                  : "JO AKTIV"}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-bold text-slate-950">
              {plan.name}
            </h3>

            {plan.description ? (
              <p className="mt-1 text-sm text-slate-500">
                {plan.description}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="text-2xl font-bold text-slate-950">
              {formatMoney(
                plan.monthlyPrice,
                plan.currency
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              në muaj
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        <Limit
          icon={<UsersRound size={16} />}
          label="Sportistë"
          value={plan.maxPlayers}
        />

        <Limit
          icon={<ShieldCheck size={16} />}
          label="Ekipe"
          value={plan.maxTeams}
        />

        <Limit
          icon={<Building2 size={16} />}
          label="Staf"
          value={plan.maxStaff}
        />

        <Limit
          icon={<CreditCard size={16} />}
          label="Ambiente"
          value={plan.maxFacilities}
        />
      </div>

      <div className="border-t border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Funksionalitetet
          </p>

          <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
            {plan._count.subscriptions} abonime
          </span>
        </div>

        {plan.features.length === 0 ? (
          <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
            Ky plan nuk ka feature premium shtesë.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {plan.features.map(
              (feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-3"
                >
                  <Check
                    size={15}
                    className="text-emerald-600"
                  />

                  <span className="text-xs font-semibold text-slate-700">
                    {FEATURE_LABELS[
                      feature
                    ] ?? feature}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Limit({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs font-semibold">
          {label}
        </span>
      </div>

      <span className="text-sm font-bold text-slate-950">
        {value}
      </span>
    </div>
  );
}

function formatMoney(
  value: string,
  currency: string
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${value} ${currency}`;
  }

  const formatted =
    number.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    );

  return `${formatted} ${currency}`;
}
