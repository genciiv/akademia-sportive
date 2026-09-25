import type { SubscriptionAccessStatus } from "@/lib/subscription";

type PriceValue = {
  toString(): string;
};

export type EffectivePlan = {
  code: string;
  name: string;
  monthlyPrice: PriceValue;
  currency: string;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  features: readonly string[];
};

export type EffectiveSubscriptionTerms = {
  source: "GLOBAL_PLAN";
  planCode: string;
  planName: string;
  monthlyPrice: string;
  currency: string;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  features: string[];
};

export type EffectiveCommercialTerms = {
  source: "GLOBAL_PLAN";
  planCode: string;
  planName: string;
  monthlyPrice: string;
  currency: string;
};

export function resolveEffectiveCommercialTerms(input: {
  plan: EffectivePlan;
  now: Date;
}): EffectiveCommercialTerms {
  const { plan } = input;

  return {
    source: "GLOBAL_PLAN",
    planCode: plan.code,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice.toString(),
    currency: plan.currency,
  };
}

export function resolveEffectiveSubscriptionTerms(input: {
  status: SubscriptionAccessStatus;
  plan: EffectivePlan;
  now: Date;
}): EffectiveSubscriptionTerms {
  const { plan } = input;

  return {
    source: "GLOBAL_PLAN",
    planCode: plan.code,
    planName: plan.name,
    monthlyPrice: plan.monthlyPrice.toString(),
    currency: plan.currency,
    maxPlayers: plan.maxPlayers,
    maxTeams: plan.maxTeams,
    maxStaff: plan.maxStaff,
    maxFacilities: plan.maxFacilities,
    maxAthleteAccounts: plan.maxAthleteAccounts,
    features: [...plan.features],
  };
}