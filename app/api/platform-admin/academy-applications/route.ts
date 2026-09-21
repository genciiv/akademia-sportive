import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

const STATUSES = ["PENDING", "CONTACTED", "APPROVED", "REJECTED"] as const;

export async function GET(request: Request) {
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

  const url = new URL(request.url);
  const rawStatus = url.searchParams.get("status");

  const status =
    rawStatus && STATUSES.includes(rawStatus as (typeof STATUSES)[number])
      ? (rawStatus as (typeof STATUSES)[number])
      : null;

  const [applications, pending, contacted, approved, rejected] =
    await Promise.all([
      prisma.academyApplication.findMany({
        where: status
          ? {
              status,
            }
          : undefined,
        orderBy: {
          createdAt: "desc",
        },
        take: 200,
      }),

      prisma.academyApplication.count({
        where: {
          status: "PENDING",
        },
      }),

      prisma.academyApplication.count({
        where: {
          status: "CONTACTED",
        },
      }),

      prisma.academyApplication.count({
        where: {
          status: "APPROVED",
        },
      }),

      prisma.academyApplication.count({
        where: {
          status: "REJECTED",
        },
      }),
    ]);

  const safeApplications = applications.map(
    ({ onboardingTokenHash: _onboardingTokenHash, ...application }) =>
      application,
  );

  return NextResponse.json({
    applications: safeApplications,
    counts: {
      PENDING: pending,
      CONTACTED: contacted,
      APPROVED: approved,
      REJECTED: rejected,
    },
  });
}
