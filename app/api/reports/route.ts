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

  const academyId =
    membership.academyId;

  const now = new Date();

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const startOfNextMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  const [
    players,
    teams,
    coaches,
    trainingSessions,
    matches,
    payments,
    paymentsThisMonth,
    expenses,
    monthExpenses,
    charges,
  ] = await Promise.all([
    prisma.player.count({
      where: {
        academyId,
      },
    }),

    prisma.team.count({
      where: {
        academyId,
      },
    }),

    prisma.coach.count({
      where: {
        academyId,
      },
    }),

    prisma.trainingSession.count({
      where: {
        academyId,
      },
    }),

    prisma.match.count({
      where: {
        academyId,
      },
    }),

    prisma.cashPayment.findMany({
      where: {
        academyId,
      },
      select: {
        amountLek: true,
      },
    }),

    prisma.cashPayment.findMany({
      where: {
        academyId,
        paidAt: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      select: {
        amountLek: true,
      },
    }),

    prisma.expense.findMany({
      where: {
        academyId,
      },
      select: {
        amountLek: true,
      },
    }),

    prisma.expense.findMany({
      where: {
        academyId,
        expenseDate: {
          gte: startOfMonth,
          lt: startOfNextMonth,
        },
      },
      select: {
        amountLek: true,
      },
    }),

    prisma.playerCharge.findMany({
      where: {
        academyId,
        status: {
          not: "CANCELLED",
        },
      },
      include: {
        payments: {
          select: {
            amountLek: true,
          },
        },
      },
    }),
  ]);

  const totalCollected =
    payments.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  const collectedThisMonth =
    paymentsThisMonth.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  const totalExpenses =
    expenses.reduce(
      (sum, expense) =>
        sum + expense.amountLek,
      0
    );

  const expensesThisMonth =
    monthExpenses.reduce(
      (sum, expense) =>
        sum + expense.amountLek,
      0
    );

  const totalCharges =
    charges.reduce(
      (sum, charge) =>
        sum + charge.amountLek,
      0
    );

  const totalOutstanding =
    charges.reduce(
      (sum, charge) => {
        const paid =
          charge.payments.reduce(
            (paymentSum, payment) =>
              paymentSum +
              payment.amountLek,
            0
          );

        return (
          sum +
          Math.max(
            0,
            charge.amountLek - paid
          )
        );
      },
      0
    );

  const playersWithDebt =
    new Set(
      charges
        .filter((charge) => {
          const paid =
            charge.payments.reduce(
              (sum, payment) =>
                sum +
                payment.amountLek,
              0
            );

          return (
            charge.amountLek -
              paid >
            0
          );
        })
        .map(
          (charge) =>
            charge.playerId
        )
    ).size;

  return NextResponse.json({
    generatedAt:
      new Date().toISOString(),

    sports: {
      players,
      teams,
      coaches,
      trainingSessions,
      matches,
    },

    finance: {
      totalCollected,
      collectedThisMonth,
      totalExpenses,
      expensesThisMonth,
      netProfit:
        totalCollected -
        totalExpenses,
      netProfitThisMonth:
        collectedThisMonth -
        expensesThisMonth,
      totalCharges,
      totalOutstanding,
      playersWithDebt,
      paymentCount:
        payments.length,
      expenseCount:
        expenses.length,
    },
  });
}