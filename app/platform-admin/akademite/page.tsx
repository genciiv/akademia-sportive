import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { AcademiesClient } from "./academies-client";

export default async function PlatformAdminAcademiesPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/akademite"
      );
    }

    redirect("/");
  }

  const academies =
    await prisma.academy.findMany({
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        city: true,
        country: true,
        address: true,
        status: true,
        createdAt: true,

        owner: {
          select: {
            name: true,
            email: true,
          },
        },

        subscription: {
          select: {
            status: true,
            trialStartsAt: true,
            trialEndsAt: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            graceEndsAt: true,
            cancelledAt: true,

            plan: {
              select: {
                code: true,
                name: true,
              },
            },
          },
        },

        _count: {
          select: {
            memberships: true,
            branches: true,
            players: true,
            teams: true,
            coaches: true,
          },
        },
      },
    });

  const serialized = academies.map(
    (academy) => ({
      ...academy,

      createdAt:
        academy.createdAt.toISOString(),

      subscription: academy.subscription
        ? {
            ...academy.subscription,

            trialStartsAt:
              academy.subscription.trialStartsAt?.toISOString() ??
              null,

            trialEndsAt:
              academy.subscription.trialEndsAt?.toISOString() ??
              null,

            currentPeriodStart:
              academy.subscription.currentPeriodStart?.toISOString() ??
              null,

            currentPeriodEnd:
              academy.subscription.currentPeriodEnd?.toISOString() ??
              null,

            graceEndsAt:
              academy.subscription.graceEndsAt?.toISOString() ??
              null,

            cancelledAt:
              academy.subscription.cancelledAt?.toISOString() ??
              null,
          }
        : null,
    })
  );

  return (
    <PlatformAdminShell>
      <AcademiesClient
        initialAcademies={serialized}
      />
    </PlatformAdminShell>
  );
}