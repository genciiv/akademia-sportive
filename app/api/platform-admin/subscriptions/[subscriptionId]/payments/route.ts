import { NextResponse } from "next/server";

import {
  resolveEffectiveCommercialTerms,
} from "@/lib/effective-subscription";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";
import {
  assertSubscriptionPaymentMonths,
  calculatePaymentLifecycle,
  calculateSubscriptionTotal,
} from "@/lib/subscription";

type RouteContext = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

function serializePayment(payment: {
  id: string;
  academyId: string;
  subscriptionId: string;
  planId: string;
  months: number;
  monthlyPrice: { toString(): string };
  totalAmount: { toString(): string };
  currency: string;
  method: string;
  paidAt: Date;
  periodStart: Date;
  periodEnd: Date;
  note: string | null;
  recordedById: string | null;
  createdAt: Date;
}) {
  return {
    ...payment,
    monthlyPrice: payment.monthlyPrice.toString(),
    totalAmount: payment.totalAmount.toString(),
    paidAt: payment.paidAt.toISOString(),
    periodStart: payment.periodStart.toISOString(),
    periodEnd: payment.periodEnd.toISOString(),
    createdAt: payment.createdAt.toISOString(),
  };
}

const MAX_TRANSACTION_RETRIES = 3;

function isRetryableTransactionConflict(
  error: unknown
) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2034"
  );
}

export async function POST(
  request: Request,
  { params }: RouteContext
) {
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
      }
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
      }
    );
  }

  const rawMonths =
    typeof body.months === "number"
      ? body.months
      : Number(body.months);

  try {
    assertSubscriptionPaymentMonths(rawMonths);
  } catch {
    return NextResponse.json(
      {
        error:
          "Periudha e pagesës duhet të jetë 1, 3, 6 ose 12 muaj.",
      },
      {
        status: 400,
      }
    );
  }

  const method =
    body.method === undefined
      ? "CASH"
      : String(body.method)
          .trim()
          .toUpperCase();

  if (method !== "CASH") {
    return NextResponse.json(
      {
        error:
          "Metoda e pagesës nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const note =
    String(body.note ?? "").trim() || null;

  if ((note?.length ?? 0) > 2000) {
    return NextResponse.json(
      {
        error:
          "Shënimi nuk mund të kalojë 2000 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  const { subscriptionId } = await params;
  const paidAt = new Date();

  try {
    const recordPayment = () =>
      prisma.$transaction(
        async (tx) => {
        const subscription =
          await tx.academySubscription.findUnique({
            where: {
              id: subscriptionId,
            },
            select: {
              id: true,
              academyId: true,
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
            kind: "NOT_FOUND" as const,
          };
        }

        const commercial =
          resolveEffectiveCommercialTerms({
            plan: subscription.plan,
            customOffer: subscription.customOffer,
            now: paidAt,
          });

        const monthlyPrice =
          Number(commercial.monthlyPrice);

        if (
          !Number.isFinite(monthlyPrice) ||
          monthlyPrice < 0
        ) {
          throw new Error(
            "Çmimi efektiv i abonimit është i pavlefshëm."
          );
        }

        const totalAmount =
          calculateSubscriptionTotal(
            monthlyPrice,
            rawMonths
          );

        let lifecycle;

        try {
          lifecycle =
            calculatePaymentLifecycle({
              currentStatus: subscription.status,
              paidAt,
              trialEndsAt:
                subscription.trialEndsAt,
              currentPeriodStart:
                subscription.currentPeriodStart,
              currentPeriodEnd:
                subscription.currentPeriodEnd,
              graceEndsAt:
                subscription.graceEndsAt,
              cancelledAt:
                subscription.cancelledAt,
              months: rawMonths,
            });
        } catch (error) {
          if (
            error instanceof Error &&
            error.message.includes("riaktivizohet")
          ) {
            return {
              kind: "CANCELLED" as const,
            };
          }

          throw error;
        }

        const payment =
          await tx.subscriptionPayment.create({
            data: {
              academyId: subscription.academyId,
              subscriptionId: subscription.id,
              planId: subscription.planId,
              months: rawMonths,
              monthlyPrice:
                commercial.monthlyPrice,
              totalAmount:
                totalAmount.toFixed(2),
              currency: commercial.currency,
              method: "CASH",
              paidAt,
              periodStart:
                lifecycle.periodStart,
              periodEnd:
                lifecycle.periodEnd,
              note,
              recordedById: access.user.id,
            },
          });

        await tx.academySubscription.update({
          where: {
            id: subscription.id,
          },
          data: {
            status: lifecycle.status,
            currentPeriodStart:
              lifecycle.subscriptionPeriodStart,
            currentPeriodEnd:
              lifecycle.periodEnd,
            graceEndsAt:
              lifecycle.graceEndsAt,
          },
        });

        return {
          kind: "CREATED" as const,
          payment,
          subscriptionStatus:
            lifecycle.status,
          commercialSource:
            commercial.source,
        };
        },
        {
          isolationLevel: "Serializable",
        }
      );

    let result:
      Awaited<ReturnType<typeof recordPayment>>;

    for (
      let attempt = 1;
      ;
      attempt += 1
    ) {
      try {
        result = await recordPayment();
        break;
      } catch (error) {
        if (
          !isRetryableTransactionConflict(error) ||
          attempt >= MAX_TRANSACTION_RETRIES
        ) {
          throw error;
        }
      }
    }

    if (result.kind === "NOT_FOUND") {
      return NextResponse.json(
        {
          error: "Abonimi nuk u gjet.",
        },
        {
          status: 404,
        }
      );
    }

    if (result.kind === "CANCELLED") {
      return NextResponse.json(
        {
          error:
            "Abonimi i anuluar duhet të riaktivizohet para regjistrimit të pagesës.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json(
      {
        payment:
          serializePayment(result.payment),
        subscriptionStatus:
          result.subscriptionStatus,
        commercialSource:
          result.commercialSource,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    console.error(
      "Failed to record subscription payment",
      error
    );

    return NextResponse.json(
      {
        error:
          "Pagesa nuk mund të regjistrohej.",
      },
      {
        status: 500,
      }
    );
  }
}
