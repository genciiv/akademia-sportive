import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";
import { resolveSubscriptionStatus } from "@/lib/subscription";

type RouteContext = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

const STANDARD_PLAN_CODES = ["STARTER", "PRO", "PRO_PORTAL"] as const;

type StandardPlanCode = (typeof STANDARD_PLAN_CODES)[number];

function isStandardPlanCode(value: string): value is StandardPlanCode {
  return STANDARD_PLAN_CODES.includes(value as StandardPlanCode);
}

export async function PUT(request: Request, { params }: RouteContext) {
  const access = await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet të identifikohesh."
            : "Nuk ke akses në Platform Admin.",
      },
      {
        status: access.status,
      },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      {
        error: "Kërkesa nuk është e vlefshme.",
      },
      {
        status: 400,
      },
    );
  }

  const planCode = String(body.planCode ?? "")
    .trim()
    .toUpperCase();

  if (!isStandardPlanCode(planCode)) {
    return NextResponse.json(
      {
        error: "Plani duhet të jetë STARTER, PRO ose PRO_PORTAL.",
      },
      {
        status: 400,
      },
    );
  }

  const { subscriptionId } = await params;
  const now = new Date();

  try {
    const result = await prisma.$transaction(
      async (tx) => {
        const subscription = await tx.academySubscription.findUnique({
          where: {
            id: subscriptionId,
          },
          select: {
            id: true,
            planId: true,
            status: true,
            trialEndsAt: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            graceEndsAt: true,
            cancelledAt: true,

            plan: {
              select: {
                code: true,
              },
            },
          },
        });

        if (!subscription) {
          return {
            kind: "NOT_FOUND" as const,
          };
        }

        const resolvedStatus = resolveSubscriptionStatus({
          currentStatus: subscription.status,
          now,
          trialEndsAt: subscription.trialEndsAt,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          graceEndsAt: subscription.graceEndsAt,
          cancelledAt: subscription.cancelledAt,
        });

        if (resolvedStatus === "CANCELLED") {
          return {
            kind: "CANCELLED" as const,
          };
        }

        if (subscription.plan.code === planCode) {
          return {
            kind: "UNCHANGED" as const,
            planCode,
          };
        }

        const hasPaidCoverage =
          subscription.currentPeriodEnd !== null &&
          subscription.currentPeriodEnd.getTime() > now.getTime();

        if (hasPaidCoverage) {
          return {
            kind: "ACTIVE_PAID_PERIOD" as const,
          };
        }

        const targetPlan = await tx.plan.findUnique({
          where: {
            code: planCode,
          },
          select: {
            id: true,
            code: true,
            name: true,
            isActive: true,
          },
        });

        if (!targetPlan || !targetPlan.isActive) {
          return {
            kind: "PLAN_NOT_AVAILABLE" as const,
          };
        }

        await tx.academySubscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            planId: targetPlan.id,
          },
        });

        return {
          kind: "UPDATED" as const,
          plan: {
            code: targetPlan.code,
            name: targetPlan.name,
          },
        };
      },
      {
        isolationLevel: "Serializable",
      },
    );

    if (result.kind === "NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Abonimi nuk u gjet.",
        },
        {
          status: 404,
        },
      );
    }

    if (result.kind === "CANCELLED") {
      return NextResponse.json(
        {
          error:
            "Abonimi i anuluar duhet të riaktivizohet para ndryshimit të planit.",
        },
        {
          status: 409,
        },
      );
    }

    if (result.kind === "ACTIVE_PAID_PERIOD") {
      return NextResponse.json(
        {
          error:
            "Plani nuk mund të ndryshohet gjatë një periudhe të paguar aktive.",
        },
        {
          status: 409,
        },
      );
    }

    if (result.kind === "PLAN_NOT_AVAILABLE") {
      return NextResponse.json(
        {
          error: "Plani i zgjedhur nuk është i disponueshëm.",
        },
        {
          status: 409,
        },
      );
    }

    if (result.kind === "UNCHANGED") {
      return NextResponse.json({
        changed: false,
        planCode: result.planCode,
      });
    }

    return NextResponse.json({
      changed: true,
      plan: result.plan,
    });
  } catch (error) {
    console.error("Failed to change subscription plan", error);

    return NextResponse.json(
      {
        error: "Plani i abonimit nuk mund të ndryshohej.",
      },
      {
        status: 500,
      },
    );
  }
}
