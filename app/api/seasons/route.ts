import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SEASONS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const seasons = await prisma.academySeason.findMany({
    where: {
      academyId: access.academyId,
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  return NextResponse.json({
    seasons,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SEASONS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const body = await request.json();

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const startsAt = new Date(
    body.startsAt
  );

  const endsAt = new Date(
    body.endsAt
  );

  const isActive =
    body.isActive === true;

  if (!name) {
    return NextResponse.json(
      {
        error:
          "Emri i sezonit është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    Number.isNaN(
      startsAt.getTime()
    ) ||
    Number.isNaN(
      endsAt.getTime()
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Datat e sezonit nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    endsAt.getTime() <=
    startsAt.getTime()
  ) {
    return NextResponse.json(
      {
        error:
          "Data e përfundimit duhet të jetë pas datës së fillimit.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const season =
      await prisma.$transaction(
        async (tx) => {
          if (isActive) {
            await tx.academySeason.updateMany({
              where: {
                academyId:
                  access.academyId,
                isActive: true,
              },
              data: {
                isActive: false,
              },
            });
          }

          return tx.academySeason.create({
            data: {
              academyId:
                access.academyId,
              name,
              startsAt,
              endsAt,
              isActive,
            },
          });
        }
      );

    return NextResponse.json(
      {
        season,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Sezoni nuk mund të krijohej. Kontrollo nëse ekziston një sezon me të njëjtin emër.",
      },
      {
        status: 400,
      }
    );
  }
}
