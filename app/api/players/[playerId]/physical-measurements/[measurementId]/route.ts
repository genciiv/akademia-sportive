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

async function getAuthorizedPlayer(
  access: Awaited<
    ReturnType<typeof requireAcademyPermission>
  >,
  playerId: string
) {
  if (!access.ok) {
    return null;
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId: access.academyId,
      },
      select: {
        id: true,
      },
    });

  if (!player) {
    return null;
  }

  const hasPlayerAccess =
    await canAccessPlayer(
      access,
      player.id
    );

  if (!hasPlayerAccess) {
    return false;
  }

  return player;
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      playerId: string;
      measurementId: string;
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

  const {
    playerId,
    measurementId,
  } = await params;

  const player =
    await getAuthorizedPlayer(
      access,
      playerId
    );

  if (player === null) {
    return NextResponse.json(
      {
        error: "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  if (player === false) {
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

  const existing =
    await prisma.playerPhysicalMeasurement.findFirst({
      where: {
        id: measurementId,
        playerId: player.id,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Matja fizike nuk u gjet.",
      },
      {
        status: 404,
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
    await prisma.playerPhysicalMeasurement.update({
      where: {
        id: existing.id,
      },
      data: {
        measuredAt,
        heightCm,
        weightKg,
        bodyFatPercent,
        muscleMassKg,
        notes: notes || null,
      },
    });

  return NextResponse.json({
    measurement,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      playerId: string;
      measurementId: string;
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

  const {
    playerId,
    measurementId,
  } = await params;

  const player =
    await getAuthorizedPlayer(
      access,
      playerId
    );

  if (player === null) {
    return NextResponse.json(
      {
        error: "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  if (player === false) {
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

  const measurement =
    await prisma.playerPhysicalMeasurement.findFirst({
      where: {
        id: measurementId,
        playerId: player.id,
      },
      select: {
        id: true,
      },
    });

  if (!measurement) {
    return NextResponse.json(
      {
        error:
          "Matja fizike nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.playerPhysicalMeasurement.delete({
    where: {
      id: measurement.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}