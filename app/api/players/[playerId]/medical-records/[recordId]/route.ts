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

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      playerId: string;
      recordId: string;
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

  const {
    playerId,
    recordId,
  } = await params;

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

  const existingRecord =
    await prisma.playerMedicalRecord.findFirst({
      where: {
        id: recordId,
        playerId: player.id,
      },
    });

  if (!existingRecord) {
    return NextResponse.json(
      {
        error:
          "Rekordi mjekësor nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body =
    await request.json();

  const typeText =
    body.type === undefined
      ? String(existingRecord.type)
      : String(body.type)
          .trim()
          .toUpperCase();

  const statusText =
    body.status === undefined
      ? String(existingRecord.status)
      : String(body.status)
          .trim()
          .toUpperCase();

  const availabilityText =
    body.availability === undefined
      ? String(existingRecord.availability)
      : String(body.availability)
          .trim()
          .toUpperCase();

  if (
    !isMedicalRecordType(
      typeText
    )
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
    !isMedicalRecordStatus(
      statusText
    )
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
      availabilityText
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

  const title =
    body.title === undefined
      ? existingRecord.title
      : String(
          body.title || ""
        ).trim();

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

  let startedAt =
    existingRecord.startedAt;

  if (
    body.startedAt !== undefined
  ) {
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

    const parsedStartedAt =
      new Date(
        startedAtText
      );

    if (
      Number.isNaN(
        parsedStartedAt.getTime()
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

    startedAt =
      parsedStartedAt;
  }

  let expectedReturnAt =
    existingRecord.expectedReturnAt;

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "expectedReturnAt"
    )
  ) {
    const parsed =
      parseOptionalDate(
        body.expectedReturnAt
      );

    if (
      parsed === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Data e pritshme e rikthimit nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    expectedReturnAt =
      parsed;
  }

  let resolvedAt =
    existingRecord.resolvedAt;

  if (
    Object.prototype.hasOwnProperty.call(
      body,
      "resolvedAt"
    )
  ) {
    const parsed =
      parseOptionalDate(
        body.resolvedAt
      );

    if (
      parsed === undefined
    ) {
      return NextResponse.json(
        {
          error:
            "Data e zgjidhjes nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    resolvedAt =
      parsed;
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
    statusText === "RESOLVED" &&
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
    statusText !== "RESOLVED" &&
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
    body.description === undefined
      ? existingRecord.description ?? ""
      : String(
          body.description || ""
        ).trim();

  const restrictions =
    body.restrictions === undefined
      ? existingRecord.restrictions ?? ""
      : String(
          body.restrictions || ""
        ).trim();

  const recoveryNotes =
    body.recoveryNotes === undefined
      ? existingRecord.recoveryNotes ?? ""
      : String(
          body.recoveryNotes || ""
        ).trim();

  const privateNotes =
    body.privateNotes === undefined
      ? existingRecord.privateNotes ?? ""
      : String(
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
    await prisma.playerMedicalRecord.update({
      where: {
        id: existingRecord.id,
      },
      data: {
        type: typeText,
        title,
        status: statusText,
        availability:
          availabilityText,
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

  return NextResponse.json({
    record,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      playerId: string;
      recordId: string;
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

  const {
    playerId,
    recordId,
  } = await params;

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

  const existingRecord =
    await prisma.playerMedicalRecord.findFirst({
      where: {
        id: recordId,
        playerId: player.id,
      },
      select: {
        id: true,
      },
    });

  if (!existingRecord) {
    return NextResponse.json(
      {
        error:
          "Rekordi mjekësor nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.playerMedicalRecord.delete({
    where: {
      id: existingRecord.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
