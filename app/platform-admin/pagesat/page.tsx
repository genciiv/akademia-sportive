import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { PaymentsClient } from "./payments-client";

export default async function PlatformAdminPaymentsPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/pagesat"
      );
    }

    redirect("/");
  }

  const payments =
    await prisma.subscriptionPayment.findMany({
      orderBy: {
        paidAt: "desc",
      },

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

        academy: {
          select: {
            id: true,
            name: true,
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
          },
        },

        recordedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

  const serialized =
    payments.map((payment) => ({
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
    }));

  return (
    <PlatformAdminShell>
      <PaymentsClient
        initialPayments={serialized}
      />
    </PlatformAdminShell>
  );
}