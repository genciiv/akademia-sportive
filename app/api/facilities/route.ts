import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const FACILITY_TYPES = [
  "FOOTBALL_FIELD",
  "BASKETBALL_COURT",
  "VOLLEYBALL_COURT",
  "TENNIS_COURT",
  "SWIMMING_POOL",
  "GYM",
  "FITNESS_ROOM",
  "MULTIPURPOSE_HALL",
  "CLASSROOM",
  "OTHER",
] as const;

const FACILITY_STATUSES = [
  "ACTIVE",
  "MAINTENANCE",
  "INACTIVE",
] as const;

const MAX_NAME_LENGTH = 160;
const MAX_SHORT_TEXT_LENGTH = 500;
const MAX_LONG_TEXT_LENGTH = 4000;

function optionalText(
  value: unknown
): string | null {
  const text =
    String(value ?? "").trim();

  return text || null;
}

function parseCapacity(
  value: unknown
):
  | {
      ok: true;
      value: number | null;
    }
  | {
      ok: false;
    } {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return {
      ok: true,
      value: null,
    };
  }

  const capacity =
    Number(value);

  if (
    !Number.isInteger(capacity) ||
    capacity < 1 ||
    capacity > 100000
  ) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    value: capacity,
  };
}

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.FACILITIES_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const canManageFacilities =
    access.permissions.includes(
      PERMISSIONS.FACILITIES_MANAGE
    );

  const facilities =
    await prisma.facility.findMany({
      where: {
        academyId:
          access.academyId,
      },
      orderBy: [
        {
          status: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  return NextResponse.json({
    facilities,
    canManageFacilities,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.FACILITIES_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  let rawBody: unknown;

  try {
    rawBody =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Të dhënat e dërguara nuk janë në format të vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const body =
    rawBody &&
    typeof rawBody === "object" &&
    !Array.isArray(rawBody)
      ? (rawBody as Record<
          string,
          unknown
        >)
      : {};

  const name =
    String(
      body.name ?? ""
    ).trim();

  const type =
    String(
      body.type ?? "OTHER"
    ).trim();

  const status =
    String(
      body.status ?? "ACTIVE"
    ).trim();

  const isIndoor =
    body.isIndoor ?? false;

  const capacityResult =
    parseCapacity(
      body.capacity
    );

  const surface =
    optionalText(
      body.surface
    );

  const dimensions =
    optionalText(
      body.dimensions
    );

  const address =
    optionalText(
      body.address
    );

  const description =
    optionalText(
      body.description
    );

  const notes =
    optionalText(
      body.notes
    );

  if (
    !name ||
    name.length >
      MAX_NAME_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Emri është i detyrueshëm dhe duhet të ketë maksimumi ${MAX_NAME_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    !FACILITY_TYPES.includes(
      type as
        (typeof FACILITY_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Lloji i ambientit nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !FACILITY_STATUSES.includes(
      status as
        (typeof FACILITY_STATUSES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi i ambientit nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    typeof isIndoor !==
    "boolean"
  ) {
    return NextResponse.json(
      {
        error:
          "Vlera indoor/outdoor nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (!capacityResult.ok) {
    return NextResponse.json(
      {
        error:
          "Kapaciteti duhet të jetë një numër i plotë pozitiv.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    surface &&
    surface.length >
      MAX_SHORT_TEXT_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Sipërfaqja është shumë e gjatë.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    dimensions &&
    dimensions.length >
      MAX_SHORT_TEXT_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Dimensionet janë shumë të gjata.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    address &&
    address.length >
      MAX_SHORT_TEXT_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Adresa është shumë e gjatë.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    description &&
    description.length >
      MAX_LONG_TEXT_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Përshkrimi është shumë i gjatë.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    notes &&
    notes.length >
      MAX_LONG_TEXT_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          "Shënimet janë shumë të gjata.",
      },
      {
        status: 400,
      }
    );
  }

  const duplicate =
    await prisma.facility.findFirst({
      where: {
        academyId:
          access.academyId,
        name,
      },
      select: {
        id: true,
      },
    });

  if (duplicate) {
    return NextResponse.json(
      {
        error:
          "Ekziston tashmë një ambient me këtë emër.",
      },
      {
        status: 409,
      }
    );
  }

  const facility =
    await prisma.facility.create({
      data: {
        academyId:
          access.academyId,
        name,
        type:
          type as
            (typeof FACILITY_TYPES)[number],
        status:
          status as
            (typeof FACILITY_STATUSES)[number],
        isIndoor,
        capacity:
          capacityResult.value,
        surface,
        dimensions,
        address,
        description,
        notes,
      },
    });

  return NextResponse.json(
    {
      facility,
    },
    {
      status: 201,
    }
  );
}
