import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function merrAkademineAktive() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return prisma.academyMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    select: {
      academyId: true,
    },
  });
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      seasonId: string;
    };
  }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const existing =
    await prisma.academySeason.findFirst({
      where: {
        id: params.seasonId,
        academyId:
          membership.academyId,
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
                membership.academyId,
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