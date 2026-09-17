import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const MAX_NAME_LENGTH = 160;
const MAX_EMAIL_LENGTH = 320;
const MAX_PHONE_LENGTH = 50;
const MAX_ADDRESS_LENGTH = 240;
const MAX_CITY_LENGTH = 120;
const MAX_COUNTRY_LENGTH = 120;

function optionalText(
  value: unknown
): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  return text || null;
}

function isValidEmail(
  value: string | null
) {
  if (!value) {
    return true;
  }

  if (
    value.length >
    MAX_EMAIL_LENGTH
  ) {
    return false;
  }

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    value
  );
}

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SETTINGS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const academy =
    await prisma.academy.findFirst({
      where: {
        id: access.academyId,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        logo: true,
        address: true,
        city: true,
        country: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  if (!academy) {
    return NextResponse.json(
      {
        error:
          "Akademia nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    academy,
    canManage:
      access.permissions.includes(
        PERMISSIONS.SETTINGS_MANAGE
      ),
  });
}

export async function PATCH(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SETTINGS_MANAGE
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
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const email =
    optionalText(body.email);

  const phone =
    optionalText(body.phone);

  const address =
    optionalText(body.address);

  const city =
    optionalText(body.city);

  const country =
    optionalText(body.country);

  if (name.length < 2) {
    return NextResponse.json(
      {
        error:
          "Emri i akademisë duhet të ketë të paktën 2 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    name.length >
    MAX_NAME_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Emri i akademisë nuk mund të kalojë ${MAX_NAME_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (!isValidEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Adresa e email-it nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    phone &&
    phone.length >
      MAX_PHONE_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Numri i telefonit nuk mund të kalojë ${MAX_PHONE_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    address &&
    address.length >
      MAX_ADDRESS_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Adresa nuk mund të kalojë ${MAX_ADDRESS_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    city &&
    city.length >
      MAX_CITY_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Qyteti nuk mund të kalojë ${MAX_CITY_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    country &&
    country.length >
      MAX_COUNTRY_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Shteti nuk mund të kalojë ${MAX_COUNTRY_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  const academy =
    await prisma.academy.update({
      where: {
        id: access.academyId,
      },
      data: {
        name,
        email,
        phone,
        address,
        city,
        country,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        email: true,
        phone: true,
        logo: true,
        address: true,
        city: true,
        country: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

  return NextResponse.json({
    academy,
  });
}