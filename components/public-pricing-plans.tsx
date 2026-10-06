import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { ArrowRight, Check } from "lucide-react";

import { prisma } from "@/lib/prisma";

const PLAN_COPY: Record<
  string,
  {
    description: string;
    badge?: string;
    variant: "default" | "primary" | "dark" | "unlimited";
  }
> = {
  STARTER: {
    description:
      "Për akademi të vogla që duan të organizojnë proceset bazë.",
    variant: "default",
  },
  PRO: {
    description:
      "Për akademi që duan menaxhim sportiv dhe administrativ të avancuar.",
    badge: "Më i plotë",
    variant: "primary",
  },
  PRO_PORTAL: {
    description:
      "Për akademi që duan t’u japin sportistëve akses në portalin e tyre.",
    variant: "dark",
  },
  UNLIMITED: {
    description:
      "Për akademi që duan të gjitha funksionet pa kufizime kapaciteti.",
    variant: "unlimited",
  },
};

const FEATURE_LABELS: Record<string, string> = {
  MEDICAL: "Moduli mjekësor",
  PHYSICAL_PROFILE: "Profili fizik",
  PERFORMANCE: "Performanca",
  SCOUTING: "Scouting",
  TACTICS: "Taktikat",
  KNOWLEDGE_BASE: "Baza e njohurive",
  FACILITY_SCHEDULING: "Planifikimi i ambienteve",
  ADVANCED_REPORTS: "Raporte të avancuara",
  ATHLETE_PORTAL: "Portali i sportistit",
};

type PublicPlan = {
  id: string;
  code: string;
  name: string;
  monthlyPrice: string;
  currency: string;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  features: string[];
};

export async function PublicPricingPlans() {
  noStore();

  const plansRaw = await prisma.plan.findMany({
    where: {
      isActive: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
    select: {
      id: true,
      code: true,
      name: true,
      monthlyPrice: true,
      currency: true,
      maxPlayers: true,
      maxTeams: true,
      maxStaff: true,
      maxFacilities: true,
      maxAthleteAccounts: true,
      features: true,
    },
  });

  const plans: PublicPlan[] = plansRaw.map((plan) => ({
    ...plan,
    monthlyPrice: plan.monthlyPrice.toString(),
    features: plan.features,
  }));

  return (
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

        {plans.length === 0 ? (
          <div className="mt-12 rounded-3xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Aktualisht nuk ka plane aktive për aplikim.
          </div>
        ) : (
          <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PlanCard({
  plan,
}: {
  plan: PublicPlan;
}) {
  const copy =
    PLAN_COPY[plan.code] ??
    {
      description:
        "Plan i konfigurueshëm për nevojat e akademisë.",
      variant: "default" as const,
    };

  const isDark =
    copy.variant === "dark";

  const limits = [
    limitText(
      plan.maxPlayers,
      "sportistë"
    ),
    limitText(
      plan.maxTeams,
      "ekipe"
    ),
    limitText(
      plan.maxStaff,
      "anëtarë stafi"
    ),
    limitText(
      plan.maxFacilities,
      "ambiente"
    ),
  ];

  if (
    plan.maxAthleteAccounts !== 0 ||
    plan.features.includes(
      "ATHLETE_PORTAL"
    )
  ) {
    limits.push(
      limitText(
        plan.maxAthleteAccounts,
        "llogari sportistësh"
      )
    );
  }

  const featureLabels =
    plan.features
      .map(
        (feature) =>
          FEATURE_LABELS[feature] ??
          feature
      )
      .filter(Boolean);

  const cardClass =
    copy.variant === "dark"
      ? "relative flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-800 bg-slate-950 p-7 text-white shadow-[0_22px_65px_rgba(15,23,42,0.18)]"
      : copy.variant === "primary"
        ? "relative flex h-full flex-col rounded-[26px] border border-blue-300 bg-white p-7 shadow-[0_20px_60px_rgba(37,99,235,0.12)]"
        : copy.variant ===
            "unlimited"
          ? "relative flex h-full flex-col overflow-hidden rounded-[26px] border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-7 shadow-sm"
          : "flex h-full flex-col rounded-[26px] border border-slate-200 bg-white p-7 shadow-sm";

  const titleClass = isDark
    ? "text-blue-300"
    : copy.variant ===
        "primary"
      ? "text-blue-600"
      : copy.variant ===
          "unlimited"
        ? "text-blue-700"
        : "text-slate-400";

  const descriptionClass =
    isDark
      ? "text-slate-300"
      : "text-slate-500";

  const itemClass = isDark
    ? "text-slate-300"
    : "text-slate-600";

  const checkClass = isDark
    ? "text-blue-300"
    : "text-blue-600";

  const buttonClass =
    copy.variant === "dark"
      ? "mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-blue-50"
      : copy.variant === "primary"
        ? "mt-auto flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700"
        : copy.variant ===
            "unlimited"
          ? "mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-blue-200 bg-white px-5 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
          : "mt-auto flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50";

  return (
    <div className={cardClass}>
      {copy.variant ===
      "dark" ? (
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-500/20 blur-3xl" />
      ) : null}

      {copy.variant ===
      "unlimited" ? (
        <div className="absolute -right-16 -top-16 h-44 w-44 rounded-full bg-blue-200/50 blur-3xl" />
      ) : null}

      <div className="relative flex h-full flex-col">
        {copy.badge ? (
          <span className="absolute right-0 top-0 rounded-full bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white">
            {copy.badge}
          </span>
        ) : null}

        <p
          className={[
            "text-xs font-semibold uppercase tracking-[0.15em]",
            titleClass,
          ].join(" ")}
        >
          {plan.name}
        </p>

        <p
          className={[
            "mt-3 min-h-[60px] text-sm leading-6",
            descriptionClass,
          ].join(" ")}
        >
          {copy.description}
        </p>

        <div className="mt-6 flex items-end gap-2">
          <span
            className={[
              "text-3xl font-bold",
              isDark
                ? "text-white"
                : "text-slate-950",
            ].join(" ")}
          >
            {formatMoney(
              plan.monthlyPrice
            )}
          </span>

          <span
            className={[
              "pb-1 text-xs",
              isDark
                ? "text-slate-400"
                : "text-slate-500",
            ].join(" ")}
          >
            {plan.currency} / muaj
          </span>
        </div>

        <div className="mt-7 space-y-3">
          {limits.map((item) => (
            <FeatureLine
              key={item}
              text={item}
              textClass={itemClass}
              checkClass={checkClass}
            />
          ))}

          {featureLabels.map(
            (feature) => (
              <FeatureLine
                key={feature}
                text={feature}
                textClass={
                  itemClass
                }
                checkClass={
                  checkClass
                }
              />
            )
          )}
        </div>

        <Link
          href={`/apliko?plan=${encodeURIComponent(
            plan.code
          )}`}
          className={buttonClass}
        >
          Apliko

          {copy.variant !==
          "default" ? (
            <ArrowRight size={15} />
          ) : null}
        </Link>
      </div>
    </div>
  );
}

function FeatureLine({
  text,
  textClass,
  checkClass,
}: {
  text: string;
  textClass: string;
  checkClass: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <Check
        size={15}
        className={[
          "mt-0.5 shrink-0",
          checkClass,
        ].join(" ")}
      />

      <span
        className={[
          "text-sm leading-5",
          textClass,
        ].join(" ")}
      >
        {text}
      </span>
    </div>
  );
}

function limitText(
  value: number | null,
  label: string
) {
  if (value === null) {
    return `${capitalize(
      label
    )} pa limit`;
  }

  return `Deri në ${value.toLocaleString(
    "en-US"
  )} ${label}`;
}

function capitalize(
  value: string
) {
  if (!value) {
    return value;
  }

  return (
    value.charAt(0).toUpperCase() +
    value.slice(1)
  );
}

function formatMoney(
  value: string
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return value;
  }

  return number.toLocaleString(
    "en-US",
    {
      maximumFractionDigits: 2,
    }
  );
}