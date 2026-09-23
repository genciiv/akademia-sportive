import type { SubscriptionAccessStatus } from "@/lib/subscription";

type PriceValue = {
  toString(): string;
};

export type EffectivePlan = {
  code: string;
  name: string;
  monthlyPrice: PriceValue;
  currency: string;
  maxPlayers: number;
  maxTeams: number;
  maxStaff: number;
  maxFacilities: number;
  maxAthleteAccounts: number;
  features: readonly string[];
};

export type EffectiveCustomOffer = {
  monthlyPrice: PriceValue | null;
  currency: string | null;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  overrideFeatures: boolean;
  features: readonly string[];
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
};

export type EffectiveSubscriptionTerms = {
  source: "GLOBAL_PLAN" | "CUSTOM_OFFER";
  customOfferActive: boolean;
  planCode: string;
  planName: string;
  monthlyPrice: string;
  currency: string;
  maxPlayers: number;
  maxTeams: number;
  maxStaff: number;
  maxFacilities: number;
  maxAthleteAccounts: number;
  features: string[];
};

export function isCustomOfferActive(
  customOffer: EffectiveCustomOffer | null | undefined,
  now: Date
) {
  if (!customOffer?.isActive) {
    return false;
  }

  if (customOffer.validFrom.getTime() > now.getTime()) {
    return false;
  }

  if (
    customOffer.validUntil &&
    customOffer.validUntil.getTime() <= now.getTime()
  ) {
    return false;
  }

  return true;
}

export type EffectiveCommercialTerms = {
  source: "GLOBAL_PLAN" | "CUSTOM_OFFER";
  customOfferActive: boolean;
  planCode: string;
  planName: string;
  monthlyPrice: string;
  currency: string;
};

export function resolveEffectiveCommercialTerms(input: {
  plan: EffectivePlan;
  customOffer?: EffectiveCustomOffer | null;
  now: Date;
}): EffectiveCommercialTerms {
  const { plan, customOffer, now } = input;

  const customOfferActive =
    isCustomOfferActive(customOffer, now);

  if (!customOfferActive || !customOffer) {
    return {
      source: "GLOBAL_PLAN",
      customOfferActive: false,
      planCode: plan.code,
      planName: plan.name,
      monthlyPrice: plan.monthlyPrice.toString(),
      currency: plan.currency,
    };
  }

  return {
    source: "CUSTOM_OFFER",
    customOfferActive: true,
    planCode: plan.code,
    planName: plan.name,
    monthlyPrice:
      customOffer.monthlyPrice?.toString() ??
      plan.monthlyPrice.toString(),
    currency:
      customOffer.currency ??
      plan.currency,
  };
}

export function resolveEffectiveSubscriptionTerms(input: {
  status: SubscriptionAccessStatus;
  plan: EffectivePlan;
  customOffer?: EffectiveCustomOffer | null;
  now: Date;
}): EffectiveSubscriptionTerms {
  const { status, plan, customOffer, now } = input;

  // Trial-i 7-ditor ruan gjithmone planin global PRO.
  // Oferta custom mund te pergatitet gjate trial-it, por hyn ne fuqi
  // per termat efektive vetem pasi abonimi nuk eshte me TRIALING.
  const customOfferActive =
    status !== "TRIALING" &&
    isCustomOfferActive(customOffer, now);

  if (!customOfferActive || !customOffer) {
    return {
      source: "GLOBAL_PLAN",
      customOfferActive: false,
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

  return {
    source: "CUSTOM_OFFER",
    customOfferActive: true,
    planCode: plan.code,
    planName: plan.name,
    monthlyPrice:
      customOffer.monthlyPrice?.toString() ??
      plan.monthlyPrice.toString(),
    currency:
      customOffer.currency ??
      plan.currency,
    maxPlayers:
      customOffer.maxPlayers ??
      plan.maxPlayers,
    maxTeams:
      customOffer.maxTeams ??
      plan.maxTeams,
    maxStaff:
      customOffer.maxStaff ??
      plan.maxStaff,
    maxFacilities:
      customOffer.maxFacilities ??
      plan.maxFacilities,
    maxAthleteAccounts:
      customOffer.maxAthleteAccounts ??
      plan.maxAthleteAccounts,
    features: customOffer.overrideFeatures
      ? [...customOffer.features]
      : [...plan.features],
  };
}
