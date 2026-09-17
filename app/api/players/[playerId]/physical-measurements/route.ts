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