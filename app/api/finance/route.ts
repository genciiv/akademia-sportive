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

  const twelveMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 11,
    1
  );

  const [
    allPayments,
    currentMonthPayments,
    charges,
    recentPayments,
    monthlyPayments,
    allExpenses,
    currentMonthExpenses,
    monthlyExpenses,
  ] = await Promise.all([
    prisma.cashPayment.findMany({
      where: {
        academyId:
          membership.academyId,
      },
      select: {
        amountLek: true,
      },
    }),

    prisma.cashPayment.findMany({
      where: {
        academyId:
          membership.academyId,
        paidAt: {
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
        academyId:
          membership.academyId,
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
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),

    prisma.cashPayment.findMany({
      where: {
        academyId:
          membership.academyId,
      },
      orderBy: {
        paidAt: "desc",
      },
      take: 12,
      include: {
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        charge: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    }),

    prisma.cashPayment.findMany({
      where: {
        academyId:
          membership.academyId,
        paidAt: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        amountLek: true,
        paidAt: true,
      },
    }),

    prisma.expense.findMany({
      where: {
        academyId:
          membership.academyId,
      },
      select: {
        id: true,
        amountLek: true,
        category: true,
        title: true,
        expenseDate: true,
      },
    }),

    prisma.expense.findMany({
      where: {
        academyId:
          membership.academyId,
        expenseDate: {
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
        academyId:
          membership.academyId,
        expenseDate: {
          gte: twelveMonthsAgo,
        },
      },
      select: {
        amountLek: true,
        expenseDate: true,
      },
    }),
  ]);

  const totalCollected =
    allPayments.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  const collectedThisMonth =
    currentMonthPayments.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  const totalExpenses =
    allExpenses.reduce(
      (sum, expense) =>
        sum + expense.amountLek,
      0
    );

  const expensesThisMonth =
    currentMonthExpenses.reduce(
      (sum, expense) =>
        sum + expense.amountLek,
      0
    );

  const netProfit =
    totalCollected - totalExpenses;

  const netProfitThisMonth =
    collectedThisMonth -
    expensesThisMonth;

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
            charge.amountLek - paid >
            0
          );
        })
        .map(
          (charge) =>
            charge.playerId
        )
    ).size;

  const months = Array.from(
    {
      length: 12,
    },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() -
          (11 - index),
        1
      );

      return {
        year: date.getFullYear(),
        month:
          date.getMonth() + 1,
        collectedLek: 0,
        expensesLek: 0,
        netLek: 0,
      };
    }
  );

  for (const payment of monthlyPayments) {
    const date =
      new Date(payment.paidAt);

    const target =
      months.find(
        (item) =>
          item.year ===
            date.getFullYear() &&
          item.month ===
            date.getMonth() + 1
      );

    if (target) {
      target.collectedLek +=
        payment.amountLek;
    }
  }

  for (const expense of monthlyExpenses) {
    const date =
      new Date(
        expense.expenseDate
      );

    const target =
      months.find(
        (item) =>
          item.year ===
            date.getFullYear() &&
          item.month ===
            date.getMonth() + 1
      );

    if (target) {
      target.expensesLek +=
        expense.amountLek;
    }
  }

  for (const month of months) {
    month.netLek =
      month.collectedLek -
      month.expensesLek;
  }

  const expenseCategoriesMap =
    new Map<
      string,
      {
        category: string;
        totalLek: number;
        count: number;
      }
    >();

  for (const expense of allExpenses) {
    const current =
      expenseCategoriesMap.get(
        expense.category
      ) ?? {
        category:
          expense.category,
        totalLek: 0,
        count: 0,
      };

    current.totalLek +=
      expense.amountLek;

    current.count += 1;

    expenseCategoriesMap.set(
      expense.category,
      current
    );
  }

  const expenseCategories =
    Array.from(
      expenseCategoriesMap.values()
    ).sort(
      (a, b) =>
        b.totalLek -
        a.totalLek
    );

  const debts = charges
    .map((charge) => {
      const paidLek =
        charge.payments.reduce(
          (sum, payment) =>
            sum + payment.amountLek,
          0
        );

      return {
        id: charge.id,
        title: charge.title,
        player: charge.player,
        amountLek:
          charge.amountLek,
        paidLek,
        remainingLek:
          Math.max(
            0,
            charge.amountLek -
              paidLek
          ),
        dueDate:
          charge.dueDate,
        status:
          charge.status,
      };
    })
    .filter(
      (charge) =>
        charge.remainingLek > 0
    )
    .sort(
      (a, b) =>
        b.remainingLek -
        a.remainingLek
    )
    .slice(0, 12);

  return NextResponse.json({
    summary: {
      totalCollected,
      collectedThisMonth,
      totalExpenses,
      expensesThisMonth,
      netProfit,
      netProfitThisMonth,
      totalCharges,
      totalOutstanding,
      paymentCount:
        allPayments.length,
      expenseCount:
        allExpenses.length,
      playersWithDebt,
    },

    monthly: months,

    expenseCategories,

    recentPayments:
      recentPayments.map(
        (payment) => ({
          id: payment.id,
          amountLek:
            payment.amountLek,
          paidAt:
            payment.paidAt,
          notes:
            payment.notes,
          player:
            payment.player,
          charge:
            payment.charge,
        })
      ),

    debts,
  });
}