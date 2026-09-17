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

const MEDICAL_RECORD_TYPES = [
  "INJURY",
  "ILLNESS",
  "CHECKUP",
  "OTHER",
] as const;

const MEDICAL_RECORD_STATUSES = [
  "ACTIVE",
  "RECOVERING",
  "RESOLVED",
] as const;

const MEDICAL_AVAILABILITIES = [
  "AVAILABLE",
  "LIMITED",
  "UNAVAILABLE",
] as const;

type MedicalRecordType =
  (typeof MEDICAL_RECORD_TYPES)[number];

type MedicalRecordStatus =
  (typeof MEDICAL_RECORD_STATUSES)[number];

type MedicalAvailability =
  (typeof MEDICAL_AVAILABILITIES)[number];

function isMedicalRecordType(
  value: string
): value is MedicalRecordType {
  return (
    MEDICAL_RECORD_TYPES as readonly string[]
  ).includes(value);
}

function isMedicalRecordStatus(
  value: string
): value is MedicalRecordStatus {
  return (
    MEDICAL_RECORD_STATUSES as readonly string[]
  ).includes(value);
}

function isMedicalAvailability(
  value: string
): value is MedicalAvailability {
  return (
    MEDICAL_AVAILABILITIES as readonly string[]
  ).includes(value);
}

function parseOptionalDate(
  value: unknown
): Date | null | undefined {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const date =
    new Date(String(value));

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return undefined;
  }

  return date;
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
      PERMISSIONS.MEDICAL_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { playerId } =
    await params;

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId: access.academyId,
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
        error:
          "Sportisti nuk u gjet.",
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

  const canManageMedical =
    access.permissions.includes(
      PERMISSIONS.MEDICAL_MANAGE
    );

  const records =
    await prisma.playerMedicalRecord.findMany({
      where: {
        playerId: player.id,
      },
      select: {
        id: true,
        playerId: true,
        type: true,
        title: true,
        status: true,
        availability: true,
        startedAt: true,
        expectedReturnAt: true,
        resolvedAt: true,
        description: true,
        restrictions: true,
        recoveryNotes: true,
        privateNotes:
          canManageMedical,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: [
        {
          startedAt: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  return NextResponse.json({
    player,
    records,
    canManageMedical,
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
      PERMISSIONS.MEDICAL_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { playerId } =
    await params;

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
    return NextResponse.json(
      {
        error:
          "Sportisti nuk u gjet.",
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

  const body =
    await request.json();

  const type =
    String(
      body.type || ""
    )
      .trim()
      .toUpperCase();

  const title =
    String(
      body.title || ""
    ).trim();

  const status =
    String(
      body.status || "ACTIVE"
    )
      .trim()
      .toUpperCase();

  const availability =
    String(
      body.availability || ""
    )
      .trim()
      .toUpperCase();

  if (
    !isMedicalRecordType(type)
  ) {
    return NextResponse.json(
      {
        error:
          "Lloji i rekordit mjekësor nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !isMedicalRecordStatus(status)
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi mjekësor nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !isMedicalAvailability(
      availability
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Disponueshmëria e sportistit nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !title ||
    title.length > 200
  ) {
    return NextResponse.json(
      {
        error:
          "Titulli është i detyrueshëm dhe nuk mund të kalojë 200 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  const startedAtText =
    String(
      body.startedAt || ""
    ).trim();

  if (!startedAtText) {
    return NextResponse.json(
      {
        error:
          "Data e fillimit është e detyrueshme.",
      },
      {
        status: 400,
      }
    );
  }

  const startedAt =
    new Date(startedAtText);

  if (
    Number.isNaN(
      startedAt.getTime()
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Data e fillimit nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const expectedReturnAt =
    parseOptionalDate(
      body.expectedReturnAt
    );

  const resolvedAt =
    parseOptionalDate(
      body.resolvedAt
    );

  if (
    expectedReturnAt === undefined ||
    resolvedAt === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "Një ose më shumë data nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    expectedReturnAt &&
    expectedReturnAt < startedAt
  ) {
    return NextResponse.json(
      {
        error:
          "Data e pritshme e rikthimit nuk mund të jetë para datës së fillimit.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    resolvedAt &&
    resolvedAt < startedAt
  ) {
    return NextResponse.json(
      {
        error:
          "Data e zgjidhjes nuk mund të jetë para datës së fillimit.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    status === "RESOLVED" &&
    !resolvedAt
  ) {
    return NextResponse.json(
      {
        error:
          "Një rekord i zgjidhur duhet të ketë datën e zgjidhjes.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    status !== "RESOLVED" &&
    resolvedAt
  ) {
    return NextResponse.json(
      {
        error:
          "Data e zgjidhjes lejohet vetëm kur statusi është RESOLVED.",
      },
      {
        status: 400,
      }
    );
  }

  const description =
    String(
      body.description || ""
    ).trim();

  const restrictions =
    String(
      body.restrictions || ""
    ).trim();

  const recoveryNotes =
    String(
      body.recoveryNotes || ""
    ).trim();

  const privateNotes =
    String(
      body.privateNotes || ""
    ).trim();

  const textFields = [
    description,
    restrictions,
    recoveryNotes,
    privateNotes,
  ];

  if (
    textFields.some(
      (value) =>
        value.length > 4000
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Fushat e shënimeve nuk mund të kalojnë 4000 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  const record =
    await prisma.playerMedicalRecord.create({
      data: {
        playerId: player.id,
        type,
        title,
        status,
        availability,
        startedAt,
        expectedReturnAt,
        resolvedAt,
        description:
          description || null,
        restrictions:
          restrictions || null,
        recoveryNotes:
          recoveryNotes || null,
        privateNotes:
          privateNotes || null,
      },
    });

  return NextResponse.json(
    {
      record,
    },
    {
      status: 201,
    }
  );
}
