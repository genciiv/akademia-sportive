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

function tekstOseNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function POST(request: Request) {
  const membership = await merrAkademineAktive();

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

  const body = await request.json();

  const playerId =
    String(body.playerId ?? "").trim();

  if (!playerId) {
    return NextResponse.json(
      {
        error: "Sportisti është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const amountLek =
    Number(body.amountLek);

  if (
    !Number.isInteger(amountLek) ||
    amountLek <= 0
  ) {
    return NextResponse.json(
      {
        error: "Shuma duhet të jetë një numër i plotë më i madh se 0.",
      },
      {
        status: 400,
      }
    );
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId:
          membership.academyId,
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

  const validFrom =
    body.validFrom
      ? new Date(body.validFrom)
      : new Date();

  if (
    Number.isNaN(
      validFrom.getTime()
    )
  ) {
    return NextResponse.json(
      {
        error: "Data e fillimit nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  let validUntil: Date | null = null;

  if (body.validUntil) {
    validUntil =
      new Date(body.validUntil);

    if (
      Number.isNaN(
        validUntil.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error: "Data e përfundimit nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      validUntil.getTime() <
      validFrom.getTime()
    ) {
      return NextResponse.json(
        {
          error: "Data e përfundimit nuk mund të jetë para datës së fillimit.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const fee =
    await prisma.$transaction(
      async (tx) => {
        await tx.playerFee.updateMany({
          where: {
            academyId:
              membership.academyId,
            playerId: player.id,
            isActive: true,
          },
          data: {
            isActive: false,
            validUntil:
              validFrom,
          },
        });

        return tx.playerFee.create({
          data: {
            academyId:
              membership.academyId,
            playerId: player.id,
            amountLek,
            description:
              tekstOseNull(
                body.description
              ),
            validFrom,
            validUntil,
            isActive: true,
          },
        });
      }
    );

  return NextResponse.json(
    {
      fee,
      player,
    },
    {
      status: 201,
    }
  );
}