import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


function tekstOseNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PAYMENTS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const body = await request.json();

  const chargeId =
    String(body.chargeId ?? "").trim();

  if (!chargeId) {
    return NextResponse.json(
      {
        error: "Detyrimi është i detyrueshëm.",
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

  const charge =
    await prisma.playerCharge.findFirst({
      where: {
        id: chargeId,
        academyId:
          access.academyId,
      },
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        payments: {
          select: {
            amountLek: true,
          },
        },
      },
    });

  if (!charge) {
    return NextResponse.json(
      {
        error: "Detyrimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  if (
    charge.status === "CANCELLED"
  ) {
    return NextResponse.json(
      {
        error: "Nuk mund të regjistrohet pagesë për një detyrim të anuluar.",
      },
      {
        status: 400,
      }
    );
  }

  const paidBefore =
    charge.payments.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  const remainingBefore =
    charge.amountLek - paidBefore;

  if (remainingBefore <= 0) {
    return NextResponse.json(
      {
        error: "Ky detyrim është paguar plotësisht.",
      },
      {
        status: 400,
      }
    );
  }

  if (amountLek > remainingBefore) {
    return NextResponse.json(
      {
        error: `Shuma e regjistruar nuk mund të jetë më e madhe se ${remainingBefore} Lek.`,
      },
      {
        status: 400,
      }
    );
  }

  let paidAt = new Date();

  if (body.paidAt) {
    const parsed =
      new Date(body.paidAt);

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error: "Data e pagesës nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    paidAt = parsed;
  }

  const result =
    await prisma.$transaction(
      async (tx) => {
        const payment =
          await tx.cashPayment.create({
            data: {
              academyId:
                access.academyId,
              playerId:
                charge.playerId,
              chargeId:
                charge.id,
              amountLek,
              paidAt,
              notes:
                tekstOseNull(
                  body.notes
                ),
            },
          });

        const paidAfter =
          paidBefore + amountLek;

        const status =
          paidAfter >= charge.amountLek
            ? "PAID"
            : "PARTIALLY_PAID";

        const updatedCharge =
          await tx.playerCharge.update({
            where: {
              id: charge.id,
            },
            data: {
              status,
            },
          });

        return {
          payment,
          charge: updatedCharge,
          player:
            charge.player,
          summary: {
            chargeAmountLek:
              charge.amountLek,
            paidBefore,
            paidNow: amountLek,
            paidAfter,
            remainingAfter:
              Math.max(
                0,
                charge.amountLek -
                  paidAfter
              ),
          },
        };
      }
    );

  return NextResponse.json(
    result,
    {
      status: 201,
    }
  );
}
