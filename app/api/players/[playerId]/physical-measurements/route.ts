import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessPlayer,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import {
  validatePhysicalMeasurementInput,
} from "@/lib/physical-measurement-validation";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      playerId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PLAYERS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;
  const { playerId } = await params;

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

  if (!player) {
    return NextResponse.json(
      {
        error: "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const hasPlayerAccess =
    await canAccessPlayer(
      access,
      player.id
    );

  if (!hasPlayerAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë sportist.",
      },
      {
        status: 403,
      }
    );
  }

  const measurements =
    await prisma.playerPhysicalMeasurement.findMany({
      where: {
        playerId: player.id,
      },
      orderBy: [
        {
          measuredAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  return NextResponse.json({
    player,
    measurements,
  });
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      playerId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PLAYERS_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;
  const { playerId } = await params;

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId,
      },
      select: {
        id: true,
      },
    });

  if (!player) {
    return NextResponse.json(
      {
        error: "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const hasPlayerAccess =
    await canAccessPlayer(
      access,
      player.id
    );

  if (!hasPlayerAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë sportist.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await request.json();

  const measuredAtText =
    String(
      body.measuredAt || ""
    ).trim();

  if (!measuredAtText) {
    return NextResponse.json(
      {
        error:
          "Data e matjes është e detyrueshme.",
      },
      {
        status: 400,
      }
    );
  }

  const measuredAt =
    new Date(measuredAtText);

  if (
    Number.isNaN(
      measuredAt.getTime()
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Data e matjes nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const measurementValidation =
    validatePhysicalMeasurementInput({
      heightCm: body.heightCm,
      weightKg: body.weightKg,
      bodyFatPercent:
        body.bodyFatPercent,
      muscleMassKg:
        body.muscleMassKg,
    });

  if (!measurementValidation.ok) {
    return NextResponse.json(
      {
        error:
          measurementValidation.error,
      },
      {
        status: 400,
      }
    );
  }

  const {
    heightCm,
    weightKg,
    bodyFatPercent,
    muscleMassKg,
  } = measurementValidation.values;

  const notes =
    String(
      body.notes || ""
    ).trim();

  if (notes.length > 2000) {
    return NextResponse.json(
      {
        error:
          "Shënimet nuk mund të kalojnë 2000 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  const measurement =
    await prisma.playerPhysicalMeasurement.create({
      data: {
        playerId: player.id,
        measuredAt,
        heightCm,
        weightKg,
        bodyFatPercent,
        muscleMassKg,
        notes: notes || null,
      },
    });

  return NextResponse.json(
    {
      measurement,
    },
    {
      status: 201,
    }
  );
}