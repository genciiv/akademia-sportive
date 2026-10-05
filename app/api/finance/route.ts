import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


function parseDateOnlyUtc(value: string | null) {
  if (!value) {
    return null;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] =
    value.split("-").map(Number);

  const date = new Date(
    Date.UTC(
      year,
      month - 1,
      day
    )
  );

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function addUtcDays(
  date: Date,
  days: number
) {
  return new Date(
    date.getTime() +
      days * 24 * 60 * 60 * 1000
  );
}

export async function GET(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.FINANCE_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { searchParams } =
    new URL(request.url);

  const fromParam =
    searchParams.get("from");

  const toParam =
    searchParams.get("to");

  const hasPeriodParams =
    Boolean(fromParam || toParam);

  if (
    hasPeriodParams &&
    (!fromParam || !toParam)
  ) {
    return NextResponse.json(
      {
        error:
          "Duhet të përcaktohen të dyja datat: nga dhe deri më.",
      },
      {
        status: 400,
      }
    );
  }

  const periodFrom =
    parseDateOnlyUtc(fromParam);

  const periodTo =
    parseDateOnlyUtc(toParam);

  if (
    hasPeriodParams &&
    (!periodFrom || !periodTo)
  ) {
    return NextResponse.json(
      {
        error:
          "Datat e raportit duhet të jenë në formatin YYYY-MM-DD.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    periodFrom &&
    periodTo &&
    periodFrom > periodTo
  ) {
    return NextResponse.json(
      {
        error:
          "Data fillestare nuk mund të jetë pas datës përfundimtare.",
      },
      {
        status: 400,
      }
    );
  }

  const periodEndExclusive =
    periodTo
      ? addUtcDays(periodTo, 1)
      : null;

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
          access.academyId,
      },
      select: {
        amountLek: true,
      },
    }),

    prisma.cashPayment.findMany({
      where: {
        academyId:
          access.academyId,
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
          access.academyId,
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
          access.academyId,
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
          access.academyId,
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
          access.academyId,
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
          access.academyId,
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
          access.academyId,
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

  let periodReport = null;

  if (
    periodFrom &&
    periodTo &&
    periodEndExclusive
  ) {
    const [
      periodPayments,
      periodExpenses,
    ] = await Promise.all([
      prisma.cashPayment.findMany({
        where: {
          academyId:
            access.academyId,
          paidAt: {
            gte: periodFrom,
            lt: periodEndExclusive,
          },
        },
        orderBy: {
          paidAt: "desc",
        },
        select: {
          id: true,
          amountLek: true,
          paidAt: true,
          notes: true,
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

      prisma.expense.findMany({
        where: {
          academyId:
            access.academyId,
          expenseDate: {
            gte: periodFrom,
            lt: periodEndExclusive,
          },
        },
        orderBy: [
          {
            expenseDate: "desc",
          },
          {
            createdAt: "desc",
          },
        ],
        select: {
          id: true,
          category: true,
          title: true,
          amountLek: true,
          expenseDate: true,
          description: true,
          notes: true,
        },
      }),
    ]);

    const collectedLek =
      periodPayments.reduce(
        (sum, payment) =>
          sum + payment.amountLek,
        0
      );

    const expensesLek =
      periodExpenses.reduce(
        (sum, expense) =>
          sum + expense.amountLek,
        0
      );

    const categoryMap =
      new Map<
        string,
        {
          category: string;
          totalLek: number;
          count: number;
        }
      >();

    for (const expense of periodExpenses) {
      const current =
        categoryMap.get(
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

      categoryMap.set(
        expense.category,
        current
      );
    }

    const expenseCategories =
      Array.from(
        categoryMap.values()
      ).sort(
        (a, b) =>
          b.totalLek - a.totalLek
      );

    periodReport = {
      from: fromParam,
      to: toParam,
      summary: {
        collectedLek,
        expensesLek,
        netLek:
          collectedLek - expensesLek,
        paymentCount:
          periodPayments.length,
        expenseCount:
          periodExpenses.length,
        payingPlayers:
          new Set(
            periodPayments.map(
              (payment) =>
                payment.player.id
            )
          ).size,
      },
      expenseCategories,
      payments: periodPayments,
      expenses: periodExpenses,
    };
  }

  return NextResponse.json({
    periodReport,
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
