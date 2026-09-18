import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { PlatformSettingsClient } from "./settings-client";

export default async function PlatformAdminSettingsPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/cilesimet"
      );
    }

    redirect("/");
  }

  const plans =
    await prisma.plan.findMany({
      orderBy: {
        sortOrder: "asc",
      },

      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        monthlyPrice: true,
        currency: true,
        maxPlayers: true,
        maxTeams: true,
        maxStaff: true,
        maxFacilities: true,
        features: true,
        isActive: true,
        sortOrder: true,

        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

  const serialized =
    plans.map((plan) => ({
      ...plan,

      monthlyPrice:
        plan.monthlyPrice.toString(),
    }));

  return (
    <PlatformAdminShell>
      <PlatformSettingsClient
        plans={serialized}
        trialDays={7}
      />
    </PlatformAdminShell>
  );
}