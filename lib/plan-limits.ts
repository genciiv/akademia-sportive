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
        currentPeriodEnd: true,
        graceEndsAt: true,
        cancelledAt: true,
        plan: {
          select: {
            code: true,
            maxPlayers: true,
            maxTeams: true,
            maxStaff: true,
            maxFacilities: true,
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

  const subscriptionStatus =
    resolveSubscriptionStatus({
      currentStatus: subscription.status,
      now: new Date(),
      trialEndsAt: subscription.trialEndsAt,
      currentPeriodEnd:
        subscription.currentPeriodEnd,
      graceEndsAt:
        subscription.graceEndsAt,
      cancelledAt:
        subscription.cancelledAt,
    });

  const accessAllowed =
    subscriptionStatus === "TRIALING" ||
    subscriptionStatus === "ACTIVE" ||
    subscriptionStatus === "GRACE_PERIOD";

  const limit =
    resource === "players"
      ? subscription.plan.maxPlayers
      : resource === "teams"
        ? subscription.plan.maxTeams
        : resource === "staff"
          ? subscription.plan.maxStaff
          : subscription.plan.maxFacilities;

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
      planCode: subscription.plan.code,
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
      planCode: subscription.plan.code,
      subscriptionStatus,
      reason: "LIMIT_REACHED",
    };
  }

  return {
    allowed: true,
    resource,
    current,
    limit,
    planCode: subscription.plan.code,
    subscriptionStatus,
    reason: null,
  };
}