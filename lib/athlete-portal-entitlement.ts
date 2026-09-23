import type { EffectiveSubscriptionTerms } from "@/lib/effective-subscription";
import type { SubscriptionAccessStatus } from "@/lib/subscription";

export type AthletePortalEntitlementReason =
  | "ALLOWED"
  | "TRIAL_NOT_ELIGIBLE"
  | "SUBSCRIPTION_INACTIVE"
  | "FEATURE_NOT_INCLUDED"
  | "ACCOUNT_LIMIT_DISABLED";

export type AthletePortalEntitlement = {
  allowed: boolean;
  reason: AthletePortalEntitlementReason;
  maxAthleteAccounts: number;
};

export function resolveAthletePortalEntitlement(input: {
  status: SubscriptionAccessStatus;
  terms: EffectiveSubscriptionTerms;
}): AthletePortalEntitlement {
  const { status, terms } = input;

  if (status === "TRIALING") {
    return {
      allowed: false,
      reason: "TRIAL_NOT_ELIGIBLE",
      maxAthleteAccounts: terms.maxAthleteAccounts,
    };
  }

  if (
    status !== "ACTIVE" &&
    status !== "GRACE_PERIOD"
  ) {
    return {
      allowed: false,
      reason: "SUBSCRIPTION_INACTIVE",
      maxAthleteAccounts: terms.maxAthleteAccounts,
    };
  }

  if (!terms.features.includes("ATHLETE_PORTAL")) {
    return {
      allowed: false,
      reason: "FEATURE_NOT_INCLUDED",
      maxAthleteAccounts: terms.maxAthleteAccounts,
    };
  }

  if (terms.maxAthleteAccounts <= 0) {
    return {
      allowed: false,
      reason: "ACCOUNT_LIMIT_DISABLED",
      maxAthleteAccounts: terms.maxAthleteAccounts,
    };
  }

  return {
    allowed: true,
    reason: "ALLOWED",
    maxAthleteAccounts: terms.maxAthleteAccounts,
  };
}