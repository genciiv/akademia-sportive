import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

type Params = {
  params: Promise<{
    planId: string;
  }>;
};

const PLAN_FEATURES = [
  "MEDICAL",
  "PHYSICAL_PROFILE",
  "PERFORMANCE",
  "SCOUTING",
  "TACTICS",
  "KNOWLEDGE_BASE",
  "FACILITY_SCHEDULING",
  "ADVANCED_REPORTS",
  "ATHLETE_PORTAL",
] as const;

type PlanFeature =
  (typeof PLAN_FEATURES)[number];

type PlanBody = {
  monthlyPrice?: unknown;
  maxPlayers?: unknown;
  maxTeams?: unknown;
  maxStaff?: unknown;
  maxFacilities?: unknown;
  maxAthleteAccounts?: unknown;
  features?: unknown;
  isActive?: unknown;
};

function parseLimit(
  value: unknown,
  label: string
) {
  if (value === null) {
    return {
      ok: true as const,
      value: null,
    };
  }

  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > 1_000_000
  ) {
    return {
      ok: false as const,
      error:
        `${label} duhet të jetë numër i plotë pozitiv ose pa limit.`,
    };
  }

  return {
    ok: true as const,
    value,
  };
}

function serializePlan(plan: {
  id: string;
  code: string;
  name: string;
  monthlyPrice: {
    toString(): string;
  };
  currency: string;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  features: string[];
  isActive: boolean;
}) {
  return {
    id: plan.id,
    code: plan.code,
    name: plan.name,
    monthlyPrice:
      plan.monthlyPrice.toString(),
    currency: plan.currency,
    maxPlayers: plan.maxPlayers,
    maxTeams: plan.maxTeams,
    maxStaff: plan.maxStaff,
    maxFacilities:
      plan.maxFacilities,
    maxAthleteAccounts:
      plan.maxAthleteAccounts,
    features: plan.features,
    isActive: plan.isActive,
  };
}

export async function PATCH(
  request: Request,
  context: Params
) {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet të identifikohesh."
            : "Nuk ke leje për këtë veprim.",
      },
      {
        status: access.status,
      }
    );
  }

  const {
    planId,
  } = await context.params;

  const body =
    (await request.json().catch(
      () => null
    )) as PlanBody | null;

  if (!body) {
    return NextResponse.json(
      {
        error:
          "Të dhënat e planit mungojnë.",
      },
      {
        status: 400,
      }
    );
  }

  const monthlyPrice =
    Number(body.monthlyPrice);

  if (
    !Number.isFinite(monthlyPrice) ||
    monthlyPrice < 0 ||
    monthlyPrice > 100_000_000
  ) {
    return NextResponse.json(
      {
        error:
          "Çmimi mujor nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const maxPlayers =
    parseLimit(
      body.maxPlayers,
      "Limiti i sportistëve"
    );

  const maxTeams =
    parseLimit(
      body.maxTeams,
      "Limiti i ekipeve"
    );

  const maxStaff =
    parseLimit(
      body.maxStaff,
      "Limiti i stafit"
    );

  const maxFacilities =
    parseLimit(
      body.maxFacilities,
      "Limiti i ambienteve"
    );

  const maxAthleteAccounts =
    parseLimit(
      body.maxAthleteAccounts,
      "Limiti i llogarive të sportistëve"
    );

  const limits = [
    maxPlayers,
    maxTeams,
    maxStaff,
    maxFacilities,
    maxAthleteAccounts,
  ];

  const invalidLimit =
    limits.find(
      (item) => !item.ok
    );

  if (
    invalidLimit &&
    !invalidLimit.ok
  ) {
    return NextResponse.json(
      {
        error:
          invalidLimit.error,
      },
      {
        status: 400,
      }
    );
  }

  if (
    !Array.isArray(body.features) ||
    !body.features.every(
      (feature) =>
        typeof feature ===
          "string" &&
        PLAN_FEATURES.includes(
          feature as PlanFeature
        )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Lista e funksionaliteteve nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    typeof body.isActive !==
    "boolean"
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi i planit nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const isActive =
    body.isActive;

  const features =
    Array.from(
      new Set(
        body.features as PlanFeature[]
      )
    );

  const existing =
    await prisma.plan.findUnique({
      where: {
        id: planId,
      },

      select: {
        id: true,
        code: true,
        name: true,
        monthlyPrice: true,
        currency: true,
        maxPlayers: true,
        maxTeams: true,
        maxStaff: true,
        maxFacilities: true,
        maxAthleteAccounts: true,
        features: true,
        isActive: true,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Plani nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const beforeData =
    serializePlan(existing);

  const updated =
    await prisma.$transaction(
      async (tx) => {
        const plan =
          await tx.plan.update({
            where: {
              id: existing.id,
            },

            data: {
              monthlyPrice,
              maxPlayers:
                maxPlayers.value,
              maxTeams:
                maxTeams.value,
              maxStaff:
                maxStaff.value,
              maxFacilities:
                maxFacilities.value,
              maxAthleteAccounts:
                maxAthleteAccounts.value,
              features,
              isActive,
            },

            select: {
              id: true,
              code: true,
              name: true,
              monthlyPrice: true,
              currency: true,
              maxPlayers: true,
              maxTeams: true,
              maxStaff: true,
              maxFacilities: true,
              maxAthleteAccounts: true,
              features: true,
              isActive: true,
            },
          });

        const afterData =
          serializePlan(plan);

        await tx.platformAuditLog.create({
          data: {
            actorUserId:
              access.user.id,

            action:
              "PLATFORM_PLAN_UPDATED",

            entityType:
              "Plan",

            entityId:
              plan.id,

            entityLabel:
              `${plan.code} · ${plan.name}`,

            beforeData,
            afterData,

            metadata: {
              source:
                "platform-admin-settings",
            },
          },
        });

        return afterData;
      }
    );

  return NextResponse.json({
    ok: true,
    plan: updated,
  });
}