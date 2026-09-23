import {
  resolveAthletePortalEntitlement,
  type AthletePortalEntitlementReason,
} from "@/lib/athlete-portal-entitlement";
import { resolveEffectiveSubscriptionTerms } from "@/lib/effective-subscription";
import { prisma } from "@/lib/prisma";
import { resolveSubscriptionStatus } from "@/lib/subscription";

export type AthletePortalAccessReason =
  AthletePortalEntitlementReason | "NO_SUBSCRIPTION" | "LIMIT_REACHED";

export type AthletePortalAccessResult = {
  allowed: boolean;
  currentAthleteAccounts: number;
  maxAthleteAccounts: number;
  planCode: string;
  subscriptionStatus: string;
  reason: AthletePortalAccessReason;
};

export async function checkAthletePortalAccess(
  academyId: string,
): Promise<AthletePortalAccessResult> {
  const subscription = await prisma.academySubscription.findUnique({
    where: {
      academyId,
    },
    select: {
      status: true,
      trialEndsAt: true,
      currentPeriodStart: true,
      currentPeriodEnd: true,
      graceEndsAt: true,
      cancelledAt: true,

      plan: {
        select: {
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
      },

      customOffer: {
        select: {
          monthlyPrice: true,
          currency: true,
          maxPlayers: true,
          maxTeams: true,
          maxStaff: true,
          maxFacilities: true,
          maxAthleteAccounts: true,
          overrideFeatures: true,
          features: true,
          validFrom: true,
          validUntil: true,
          isActive: true,
        },
      },
    },
  });

  if (!subscription) {
    return {
      allowed: false,
      currentAthleteAccounts: 0,
      maxAthleteAccounts: 0,
      planCode: "NONE",
      subscriptionStatus: "MISSING",
      reason: "NO_SUBSCRIPTION",
    };
  }

  const now = new Date();

  const subscriptionStatus = resolveSubscriptionStatus({
    currentStatus: subscription.status,
    now,
    trialEndsAt: subscription.trialEndsAt,
    currentPeriodStart: subscription.currentPeriodStart,
    currentPeriodEnd: subscription.currentPeriodEnd,
    graceEndsAt: subscription.graceEndsAt,
    cancelledAt: subscription.cancelledAt,
  });

  const terms = resolveEffectiveSubscriptionTerms({
    status: subscriptionStatus,
    plan: subscription.plan,
    customOffer: subscription.customOffer,
    now,
  });

  const entitlement = resolveAthletePortalEntitlement({
    status: subscriptionStatus,
    terms,
  });

  const currentAthleteAccounts = await prisma.athleteAccount.count({
    where: {
      academyId,
    },
  });

  if (!entitlement.allowed) {
    return {
      allowed: false,
      currentAthleteAccounts,
      maxAthleteAccounts: entitlement.maxAthleteAccounts,
      planCode: terms.planCode,
      subscriptionStatus,
      reason: entitlement.reason,
    };
  }

  if (currentAthleteAccounts >= entitlement.maxAthleteAccounts) {
    return {
      allowed: false,
      currentAthleteAccounts,
      maxAthleteAccounts: entitlement.maxAthleteAccounts,
      planCode: terms.planCode,
      subscriptionStatus,
      reason: "LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    currentAthleteAccounts,
    maxAthleteAccounts: entitlement.maxAthleteAccounts,
    planCode: terms.planCode,
    subscriptionStatus,
    reason: "ALLOWED",
  };
}
