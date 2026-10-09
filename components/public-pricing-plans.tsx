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
    <section id="planet" className="sec">
      <div className="c">
        <div data-r className="ctr">
          <span className="ey">Planet</span>

          <h2 className="h2">Një plan për çdo fazë.</h2>

          <p className="lead">
            Fillo me 7 ditë PRO falas dhe zgjidh planin që i përshtatet
            strukturës dhe mënyrës së punës së akademisë.
          </p>
        </div>

        {plans.length === 0 ? (
          <div data-r className="plan" style={{ marginTop: 60, textAlign: "center" }}>
            Aktualisht nuk ka plane aktive për aplikim.
          </div>
        ) : (
          <div className="plans">
            {plans.map((plan, index) => (
              <PlanCard key={plan.id} plan={plan} delay={Math.min(index, 4)} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function PlanCard({ plan, delay }: { plan: PublicPlan; delay: number }) {
  const copy = PLAN_COPY[plan.code] ?? {
    description: "Plan i konfigurueshëm për nevojat e akademisë.",
    variant: "default" as const,
  };

  const isPopular = copy.variant === "primary";

  const limits = [
    limitText(plan.maxPlayers, "sportistë"),
    limitText(plan.maxTeams, "ekipe"),
    limitText(plan.maxStaff, "anëtarë stafi"),
    limitText(plan.maxFacilities, "ambiente"),
  ];

  if (plan.maxAthleteAccounts !== 0 || plan.features.includes("ATHLETE_PORTAL")) {
    limits.push(limitText(plan.maxAthleteAccounts, "llogari sportistësh"));
  }

  const featureLabels = plan.features
    .map((feature) => FEATURE_LABELS[feature] ?? feature)
    .filter(Boolean);

  return (
    <div
      data-r
      data-d={delay > 0 ? String(delay) : undefined}
      className={isPopular ? "plan pop" : "plan"}
    >
      {copy.badge ? <span className="badge">{copy.badge}</span> : null}

      <p className="pn">{plan.name}</p>

      <p className="pd">{copy.description}</p>

      <div className="pp">
        <b>{formatMoney(plan.monthlyPrice)}</b>
        <small>{plan.currency} / muaj</small>
      </div>

      <ul>
        {[...limits, ...featureLabels].map((item) => (
          <li key={item}>
            <Check size={16} />
            <span>{item}</span>
          </li>
        ))}
      </ul>

      <Link
        href={`/apliko?plan=${encodeURIComponent(plan.code)}`}
        className={isPopular ? "btn p" : "btn g"}
      >
        Apliko
        {isPopular ? <ArrowRight size={16} /> : null}
      </Link>
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