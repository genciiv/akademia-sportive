import { NextResponse } from "next/server";

import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: Promise<{
    subscriptionId: string;
  }>;
};

const ALLOWED_FEATURES = [
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

type AllowedFeature =
  (typeof ALLOWED_FEATURES)[number];

function parseOptionalMoney(
  value: unknown
): string | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return value === undefined
      ? undefined
      : null;
  }

  const normalized = String(value).trim();

  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) {
    return undefined;
  }

  const amount = Number(normalized);

  if (!Number.isFinite(amount) || amount < 0) {
    return undefined;
  }

  return normalized;
}

function parseOptionalLimit(
  value: unknown
): number | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return value === undefined
      ? undefined
      : null;
  }

  const parsed =
    typeof value === "number"
      ? value
      : Number(String(value).trim());

  if (
    !Number.isSafeInteger(parsed) ||
    parsed < 0
  ) {
    return undefined;
  }

  return parsed;
}

function serializeOffer(offer: {
  id: string;
  subscriptionId: string;
  monthlyPrice: { toString(): string } | null;
  currency: string | null;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  overrideFeatures: boolean;
  features: readonly string[];
  note: string | null;
  validFrom: Date;
  validUntil: Date | null;
  isActive: boolean;
  createdById: string | null;
  updatedById: string | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    ...offer,
    monthlyPrice:
      offer.monthlyPrice?.toString() ?? null,
    features: [...offer.features],
    validFrom: offer.validFrom.toISOString(),
    validUntil:
      offer.validUntil?.toISOString() ?? null,
    createdAt: offer.createdAt.toISOString(),
    updatedAt: offer.updatedAt.toISOString(),
  };
}

export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  const access = await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet t? identifikohesh."
            : "Nuk ke akses n? Platform Admin.",
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
        error: "K?rkesa nuk ?sht? e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const { subscriptionId } = await params;

  const subscription =
    await prisma.academySubscription.findUnique({
      where: {
        id: subscriptionId,
      },
      select: {
        id: true,
      },
    });

  if (!subscription) {
    return NextResponse.json(
      {
        error: "Abonimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const monthlyPrice =
    parseOptionalMoney(body.monthlyPrice);

  if (
    body.monthlyPrice !== undefined &&
    monthlyPrice === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "?mimi mujor duhet t? jet? num?r jo-negativ me maksimumi 2 shifra dhjetore.",
      },
      {
        status: 400,
      }
    );
  }

  const maxPlayers =
    parseOptionalLimit(body.maxPlayers);
  const maxTeams =
    parseOptionalLimit(body.maxTeams);
  const maxStaff =
    parseOptionalLimit(body.maxStaff);
  const maxFacilities =
    parseOptionalLimit(body.maxFacilities);
  const maxAthleteAccounts =
    parseOptionalLimit(body.maxAthleteAccounts);

  if (
    (body.maxPlayers !== undefined &&
      maxPlayers === undefined) ||
    (body.maxTeams !== undefined &&
      maxTeams === undefined) ||
    (body.maxStaff !== undefined &&
      maxStaff === undefined) ||
    (body.maxFacilities !== undefined &&
      maxFacilities === undefined) ||
    (body.maxAthleteAccounts !== undefined &&
      maxAthleteAccounts === undefined)
  ) {
    return NextResponse.json(
      {
        error:
          "Limitet duhet t? jen? numra t? plot? jo-negativ?.",
      },
      {
        status: 400,
      }
    );
  }

  let currency: string | null = null;

  if (
    body.currency !== undefined &&
    body.currency !== null &&
    body.currency !== ""
  ) {
    currency =
      String(body.currency)
        .trim()
        .toUpperCase();

    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json(
        {
          error:
            "Monedha duhet t? ket? kod ISO me 3 shkronja.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const overrideFeatures =
    body.overrideFeatures === true;

  if (
    body.overrideFeatures !== undefined &&
    typeof body.overrideFeatures !== "boolean"
  ) {
    return NextResponse.json(
      {
        error:
          "overrideFeatures duhet t? jet? boolean.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    body.features !== undefined &&
    !Array.isArray(body.features)
  ) {
    return NextResponse.json(
      {
        error:
          "Lista e funksioneve nuk ?sht? e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const rawFeatures =
    Array.isArray(body.features)
      ? body.features
      : [];

  const features: AllowedFeature[] = [];

  for (const feature of rawFeatures) {
    if (
      typeof feature !== "string" ||
      !ALLOWED_FEATURES.includes(
        feature as AllowedFeature
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Lista p?rmban nj? funksion t? pavlefsh?m.",
        },
        {
          status: 400,
        }
      );
    }

    const typedFeature =
      feature as AllowedFeature;

    if (!features.includes(typedFeature)) {
      features.push(typedFeature);
    }
  }

  const note =
    String(body.note ?? "").trim() || null;

  if ((note?.length ?? 0) > 2000) {
    return NextResponse.json(
      {
        error:
          "Sh?nimi nuk mund t? kaloj? 2000 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  const now = new Date();

  const validFrom =
    body.validFrom === undefined ||
    body.validFrom === null ||
    body.validFrom === ""
      ? now
      : new Date(String(body.validFrom));

  if (Number.isNaN(validFrom.getTime())) {
    return NextResponse.json(
      {
        error:
          "Data e fillimit nuk ?sht? e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const validUntil =
    body.validUntil === undefined ||
    body.validUntil === null ||
    body.validUntil === ""
      ? null
      : new Date(String(body.validUntil));

  if (
    validUntil &&
    Number.isNaN(validUntil.getTime())
  ) {
    return NextResponse.json(
      {
        error:
          "Data e p?rfundimit nuk ?sht? e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    validUntil &&
    validUntil.getTime() <= validFrom.getTime()
  ) {
    return NextResponse.json(
      {
        error:
          "Data e p?rfundimit duhet t? jet? pas dat?s s? fillimit.",
      },
      {
        status: 400,
      }
    );
  }

  const isActive =
    body.isActive === undefined
      ? true
      : body.isActive;

  if (typeof isActive !== "boolean") {
    return NextResponse.json(
      {
        error:
          "isActive duhet t? jet? boolean.",
      },
      {
        status: 400,
      }
    );
  }

  const data = {
    monthlyPrice: monthlyPrice ?? null,
    currency,
    maxPlayers: maxPlayers ?? null,
    maxTeams: maxTeams ?? null,
    maxStaff: maxStaff ?? null,
    maxFacilities: maxFacilities ?? null,
    maxAthleteAccounts: maxAthleteAccounts ?? null,
    overrideFeatures,
    features,
    note,
    validFrom,
    validUntil,
    isActive,
  };

  const offer =
    await prisma.academyCustomOffer.upsert({
      where: {
        subscriptionId,
      },
      create: {
        subscriptionId,
        ...data,
        createdById: access.user.id,
        updatedById: access.user.id,
      },
      update: {
        ...data,
        updatedById: access.user.id,
      },
    });

  return NextResponse.json({
    customOffer: serializeOffer(offer),
  });
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  const access = await getPlatformAdminAccess();

  if (!access.ok) {
    return NextResponse.json(
      {
        error:
          access.status === 401
            ? "Duhet t? identifikohesh."
            : "Nuk ke akses n? Platform Admin.",
      },
      {
        status: access.status,
      }
    );
  }

  const { subscriptionId } = await params;

  const existing =
    await prisma.academyCustomOffer.findUnique({
      where: {
        subscriptionId,
      },
      select: {
        id: true,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error: "Oferta custom nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const offer =
    await prisma.academyCustomOffer.update({
      where: {
        subscriptionId,
      },
      data: {
        isActive: false,
        updatedById: access.user.id,
      },
    });

  return NextResponse.json({
    customOffer: serializeOffer(offer),
  });
}
