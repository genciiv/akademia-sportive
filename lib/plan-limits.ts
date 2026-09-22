import {
  resolveEffectiveSubscriptionTerms,
} from "@/lib/effective-subscription";
import { prisma } from "@/lib/prisma";
import {
  resolveSubscriptionStatus,
} from "@/lib/subscription";

export type PlanLimitResource =
  | "players"
  | "teams"
  | "staff"
  | "facilities";

export type PlanLimitResult = {
  allowed: boolean;
  resource: PlanLimitResource;
  current: number;
  limit: number;
  planCode: string;
  subscriptionStatus: string;
  reason:
    | null
    | "NO_SUBSCRIPTION"
    | "SUBSCRIPTION_INACTIVE"
    | "LIMIT_REACHED";
};

export async function checkPlanLimit(
  academyId: string,
  resource: PlanLimitResource
): Promise<PlanLimitResult> {
  const subscription =
    await prisma.academySubscription.findUnique({
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
      resource,
      current: 0,
      limit: 0,
      planCode: "NONE",
      subscriptionStatus: "MISSING",
      reason: "NO_SUBSCRIPTION",
    };
  }

  const now = new Date();

  const subscriptionStatus =
    resolveSubscriptionStatus({
      currentStatus: subscription.status,
      now,
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodStart:
        subscription.currentPeriodStart,
      currentPeriodEnd:
        subscription.currentPeriodEnd,
      graceEndsAt:
        subscription.graceEndsAt,
      cancelledAt:
        subscription.cancelledAt,
    });

  const effective =
    resolveEffectiveSubscriptionTerms({
      status: subscriptionStatus,
      plan: subscription.plan,
      customOffer: subscription.customOffer,
      now,
    });

  const accessAllowed =
    subscriptionStatus === "TRIALING" ||
    subscriptionStatus === "ACTIVE" ||
    subscriptionStatus === "GRACE_PERIOD";

  const limit =
    resource === "players"
      ? effective.maxPlayers
      : resource === "teams"
        ? effective.maxTeams
        : resource === "staff"
          ? effective.maxStaff
          : effective.maxFacilities;

  let current = 0;

  if (resource === "players") {
    current = await prisma.player.count({
      where: {
        academyId,
        status: {
          not: "LEFT",
        },
      },
    });
  }

  if (resource === "teams") {
    current = await prisma.team.count({
      where: {
        academyId,
        status: {
          not: "ARCHIVED",
        },
      },
    });
  }

  if (resource === "staff") {
    current = await prisma.academyStaff.count({
      where: {
        academyId,
        status: {
          not: "LEFT",
        },
      },
    });
  }

  if (resource === "facilities") {
    current = await prisma.facility.count({
      where: {
        academyId,
      },
    });
  }

  if (!accessAllowed) {
    return {
      allowed: false,
      resource,
      current,
      limit,
      planCode: effective.planCode,
      subscriptionStatus,
      reason: "SUBSCRIPTION_INACTIVE",
    };
  }

  if (current >= limit) {
    return {
      allowed: false,
      resource,
      current,
      limit,
      planCode: effective.planCode,
      subscriptionStatus,
      reason: "LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    resource,
    current,
    limit,
    planCode: effective.planCode,
    subscriptionStatus,
    reason: null,
  };
}
