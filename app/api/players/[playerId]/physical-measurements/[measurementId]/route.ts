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
import { prisma } from "@/lib/prisma";

function parseOptionalNumber(
  value: unknown
): number | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return undefined;
  }

  return parsed;
}

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

  const heightCm =
    parseOptionalNumber(
      body.heightCm
    );

  const weightKg =
    parseOptionalNumber(
      body.weightKg
    );

  const bodyFatPercent =
    parseOptionalNumber(
      body.bodyFatPercent
    );

  const muscleMassKg =
    parseOptionalNumber(
      body.muscleMassKg
    );

  if (
    heightCm === undefined ||
    weightKg === undefined ||
    bodyFatPercent === undefined ||
    muscleMassKg === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "Një ose më shumë matje nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    heightCm !== null &&
    (
      heightCm <= 0 ||
      heightCm > 300
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Gjatësia duhet të jetë mes 0 dhe 300 cm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    weightKg !== null &&
    (
      weightKg <= 0 ||
      weightKg > 500
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Pesha duhet të jetë mes 0 dhe 500 kg.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    bodyFatPercent !== null &&
    (
      bodyFatPercent < 0 ||
      bodyFatPercent > 100
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Yndyra trupore duhet të jetë mes 0 dhe 100%.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    muscleMassKg !== null &&
    (
      muscleMassKg <= 0 ||
      muscleMassKg > 300
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Masa muskulore nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    heightCm === null &&
    weightKg === null &&
    bodyFatPercent === null &&
    muscleMassKg === null
  ) {
    return NextResponse.json(
      {
        error:
          "Vendos të paktën një matje fizike.",
      },
      {
        status: 400,
      }
    );
  }

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