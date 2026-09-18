import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { PlatformReportsClient } from "./reports-client";

const MONTHS_SQ = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

function tiranaMonthKey(date: Date) {
  const parts =
    new Intl.DateTimeFormat(
      "en-CA",
      {
        timeZone: "Europe/Tirane",
        year: "numeric",
        month: "2-digit",
      }
    ).formatToParts(date);

  const year =
    parts.find(
      (part) =>
        part.type === "year"
    )?.value ?? "";

  const month =
    parts.find(
      (part) =>
        part.type === "month"
    )?.value ?? "";

  return `${year}-${month}`;
}

function monthLabel(key: string) {
  const [year, month] =
    key.split("-");

  const index =
    Number(month) - 1;

  return `${
    MONTHS_SQ[index] ?? month
  } ${year.slice(-2)}`;
}

export default async function PlatformAdminReportsPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/raportet"
      );
    }

    redirect("/");
  }

  const now = new Date();

  const monthDates =
    Array.from(
      {
        length: 6,
      },
      (_, index) =>
        new Date(
          Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth() -
              5 +
              index,
            15,
            12
          )
        )
    );

  const monthBuckets =
    monthDates.map((date) => {
      const key =
        tiranaMonthKey(date);

      return {
        key,
        label:
          monthLabel(key),
        revenue: 0,
      };
    });

  const revenueStart =
    new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth() - 5,
        1
      )
    );

  revenueStart.setUTCDate(
    revenueStart.getUTCDate() - 1
  );

  const [
    academyGroups,
    subscriptionGroups,
    applicationGroups,
    usersCount,
    paymentTotals,
    recentPayments,
  ] = await Promise.all([
    prisma.academy.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.academySubscription.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.academyApplication.groupBy({
      by: ["status"],
      _count: {
        _all: true,
      },
    }),

    prisma.user.count(),

    prisma.subscriptionPayment.aggregate({
      where: {
        currency: "ALL",
      },

      _count: {
        _all: true,
      },

      _sum: {
        totalAmount: true,
      },
    }),

    prisma.subscriptionPayment.findMany({
      where: {
        currency: "ALL",
        paidAt: {
          gte: revenueStart,
        },
      },

      select: {
        paidAt: true,
        totalAmount: true,
      },

      orderBy: {
        paidAt: "asc",
      },
    }),
  ]);

  for (const payment of recentPayments) {
    const key =
      tiranaMonthKey(
        payment.paidAt
      );

    const bucket =
      monthBuckets.find(
        (item) =>
          item.key === key
      );

    if (bucket) {
      bucket.revenue +=
        Number(
          payment.totalAmount.toString()
        );
    }
  }

  const academyStatuses = [
    "TRIAL",
    "ACTIVE",
    "SUSPENDED",
  ].map((status) => ({
    status,
    value:
      academyGroups.find(
        (item) =>
          item.status === status
      )?._count._all ?? 0,
  }));

  const subscriptionStatuses = [
    "TRIALING",
    "ACTIVE",
    "GRACE_PERIOD",
    "EXPIRED",
    "CANCELLED",
  ].map((status) => ({
    status,
    value:
      subscriptionGroups.find(
        (item) =>
          item.status === status
      )?._count._all ?? 0,
  }));

  const applicationStatuses = [
    "PENDING",
    "CONTACTED",
    "APPROVED",
    "REJECTED",
  ].map((status) => ({
    status,
    value:
      applicationGroups.find(
        (item) =>
          item.status === status
      )?._count._all ?? 0,
  }));

  const academyCount =
    academyStatuses.reduce(
      (sum, item) =>
        sum + item.value,
      0
    );

  const pendingApplications =
    applicationStatuses.find(
      (item) =>
        item.status === "PENDING"
    )?.value ?? 0;

  return (
    <PlatformAdminShell>
      <PlatformReportsClient
        stats={{
          academies:
            academyCount,
          users:
            usersCount,
          pendingApplications,
          payments:
            paymentTotals._count._all,
          totalRevenue:
            Number(
              paymentTotals._sum.totalAmount?.toString() ??
                "0"
            ),
        }}
        academyStatuses={
          academyStatuses
        }
        subscriptionStatuses={
          subscriptionStatuses
        }
        applicationStatuses={
          applicationStatuses
        }
        monthlyRevenue={
          monthBuckets.map(
            (item) => ({
              label:
                item.label,
              value:
                item.revenue,
            })
          )
        }
      />
    </PlatformAdminShell>
  );
}