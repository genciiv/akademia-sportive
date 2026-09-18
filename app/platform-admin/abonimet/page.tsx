import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { SubscriptionsClient } from "./subscriptions-client";

export default async function PlatformAdminSubscriptionsPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/abonimet"
      );
    }

    redirect("/");
  }

  const subscriptions =
    await prisma.academySubscription.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        status: true,

        trialStartsAt: true,
        trialEndsAt: true,

        currentPeriodStart: true,
        currentPeriodEnd: true,

        graceEndsAt: true,
        cancelledAt: true,

        createdAt: true,

        academy: {
          select: {
            id: true,
            name: true,
            status: true,
            city: true,

            owner: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },

        plan: {
          select: {
            code: true,
            name: true,
            monthlyPrice: true,
            currency: true,
          },
        },

        payments: {
          orderBy: {
            paidAt: "desc",
          },

          take: 8,

          select: {
            id: true,
            months: true,
            monthlyPrice: true,
            totalAmount: true,
            currency: true,
            method: true,
            paidAt: true,
            periodStart: true,
            periodEnd: true,
            note: true,

            recordedBy: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },

        _count: {
          select: {
            payments: true,
          },
        },
      },
    });

  const serialized =
    subscriptions.map(
      (subscription) => ({
        ...subscription,

        createdAt:
          subscription.createdAt.toISOString(),

        trialStartsAt:
          subscription.trialStartsAt?.toISOString() ??
          null,

        trialEndsAt:
          subscription.trialEndsAt?.toISOString() ??
          null,

        currentPeriodStart:
          subscription.currentPeriodStart?.toISOString() ??
          null,

        currentPeriodEnd:
          subscription.currentPeriodEnd?.toISOString() ??
          null,

        graceEndsAt:
          subscription.graceEndsAt?.toISOString() ??
          null,

        cancelledAt:
          subscription.cancelledAt?.toISOString() ??
          null,

        plan: {
          ...subscription.plan,
          monthlyPrice:
            subscription.plan.monthlyPrice.toString(),
        },

        payments:
          subscription.payments.map(
            (payment) => ({
              ...payment,

              monthlyPrice:
                payment.monthlyPrice.toString(),

              totalAmount:
                payment.totalAmount.toString(),

              paidAt:
                payment.paidAt.toISOString(),

              periodStart:
                payment.periodStart.toISOString(),

              periodEnd:
                payment.periodEnd.toISOString(),
            })
          ),
      })
    );

  return (
    <PlatformAdminShell>
      <SubscriptionsClient
        initialSubscriptions={serialized}
      />
    </PlatformAdminShell>
  );
}