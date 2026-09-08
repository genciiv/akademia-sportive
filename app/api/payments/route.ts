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

export async function GET() {
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

  const players = await prisma.player.findMany({
    where: {
      academyId: membership.academyId,
      status: "ACTIVE",
    },
    orderBy: [
      {
        lastName: "asc",
      },
      {
        firstName: "asc",
      },
    ],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      photo: true,
      position: true,
      jerseyNumber: true,

      fees: {
        where: {
          isActive: true,
        },
        orderBy: {
          validFrom: "desc",
        },
        take: 1,
        select: {
          id: true,
          amountLek: true,
          description: true,
          validFrom: true,
          validUntil: true,
        },
      },

      charges: {
        orderBy: {
          createdAt: "desc",
        },
        select: {
          id: true,
          title: true,
          amountLek: true,
          dueDate: true,
          periodMonth: true,
          periodYear: true,
          status: true,
          notes: true,

          payments: {
            orderBy: {
              paidAt: "asc",
            },
            select: {
              id: true,
              amountLek: true,
              paidAt: true,
              notes: true,
            },
          },
        },
      },

      cashPayments: {
        orderBy: {
          paidAt: "desc",
        },
        select: {
          id: true,
          amountLek: true,
          paidAt: true,
          notes: true,
          chargeId: true,
        },
      },
    },
  });

  const result = players.map((player) => {
    const fee =
      player.fees[0] ?? null;

    const charges =
      player.charges.map((charge) => {
        const paidLek =
          charge.payments.reduce(
            (sum, payment) =>
              sum + payment.amountLek,
            0
          );

        const remainingLek =
          Math.max(
            0,
            charge.amountLek - paidLek
          );

        return {
          ...charge,
          paidLek,
          remainingLek,
        };
      });

    const totalCharges =
      charges.reduce(
        (sum, charge) =>
          sum + charge.amountLek,
        0
      );

    const totalPaid =
      player.cashPayments.reduce(
        (sum, payment) =>
          sum + payment.amountLek,
        0
      );

    const totalRemaining =
      charges.reduce(
        (sum, charge) =>
          sum + charge.remainingLek,
        0
      );

    return {
      player: {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        photo: player.photo,
        position: player.position,
        jerseyNumber:
          player.jerseyNumber,
      },

      fee,

      summary: {
        totalCharges,
        totalPaid,
        totalRemaining,
      },

      charges,
      payments:
        player.cashPayments,
    };
  });

  const summary = result.reduce(
    (acc, item) => {
      acc.players += 1;

      if (item.fee) {
        acc.playersWithFee += 1;
      }

      acc.totalCharges +=
        item.summary.totalCharges;

      acc.totalPaid +=
        item.summary.totalPaid;

      acc.totalRemaining +=
        item.summary.totalRemaining;

      return acc;
    },
    {
      players: 0,
      playersWithFee: 0,
      totalCharges: 0,
      totalPaid: 0,
      totalRemaining: 0,
    }
  );

  return NextResponse.json({
    summary,
    players: result,
  });
}