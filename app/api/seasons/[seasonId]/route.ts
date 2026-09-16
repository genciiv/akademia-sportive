import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      seasonId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.SEASONS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const existing =
    await prisma.academySeason.findFirst({
      where: {
        id: (await params).seasonId,
        academyId:
          access.academyId,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error: "Sezoni nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body = await request.json();

  if (body.isActive === true) {
    const season =
      await prisma.$transaction(
        async (tx) => {
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

          return tx.academySeason.update({
            where: {
              id: existing.id,
            },
            data: {
              isActive: true,
            },
          });
        }
      );

    return NextResponse.json({
      season,
    });
  }

  const season =
    await prisma.academySeason.update({
      where: {
        id: existing.id,
      },
      data: {
        isActive:
          body.isActive === false
            ? false
            : existing.isActive,
      },
    });

  return NextResponse.json({
    season,
  });
}
