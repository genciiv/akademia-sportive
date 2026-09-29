import { NextResponse } from "next/server";

import {
  requireAnyAcademyPermission,
} from "@/lib/academy-permissions";
import {
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const EMPTY_SPORTS = {
  players: 0,
  teams: 0,
  coaches: 0,
  trainingSessions: 0,
  matches: 0,
};

const EMPTY_FINANCE = {
  totalCollected: 0,
  collectedThisMonth: 0,
  totalExpenses: 0,
  expensesThisMonth: 0,
  netProfit: 0,
  netProfitThisMonth: 0,
  totalCharges: 0,
  totalOutstanding: 0,
  playersWithDebt: 0,
  paymentCount: 0,
  expenseCount: 0,
};

export async function GET() {
  const access =
    await requireAnyAcademyPermission([
      PERMISSIONS.REPORTS_SPORTS_VIEW,
      PERMISSIONS.REPORTS_FINANCE_VIEW,
    ]);

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const canViewSports =
    access.permissions.includes(
      PERMISSIONS.REPORTS_SPORTS_VIEW
    );

  const canViewFinance =
    access.permissions.includes(
      PERMISSIONS.REPORTS_FINANCE_VIEW
    );


  const teamScope =
    canViewSports
      ? await getActiveTeamScope(access)
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


  let sports = {
    ...EMPTY_SPORTS,
  };

  if (canViewSports) {
    const [
      players,
      teams,
      coaches,
      trainingSessions,
      matches,
    ] = await Promise.all([
      prisma.player.count({
        where: {
          academyId,

          ...(teamScope?.isScoped
            ? {
                teams: {
                  some: {
                    isActive: true,

                    ...(teamScope?.isScoped
                      ? {
                          teamId: {
                            in: teamScope.teamIds,
                          },
                        }
                      : {}),

                  },
                },
              }
            : {}),
        },
      }),

      prisma.team.count({
        where: {
          academyId,
          status: "ACTIVE",

          ...(teamScope?.isScoped
            ? {
                id: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

        },
      }),

      prisma.coach.count({
        where: {
          academyId,

          ...(teamScope?.isScoped
            ? {
                teams: {
                  some: {
                    isActive: true,

                    ...(teamScope?.isScoped
                      ? {
                          teamId: {
                            in: teamScope.teamIds,
                          },
                        }
                      : {}),

                  },
                },
              }
            : {}),
        },
      }),

      prisma.trainingSession.count({
        where: {
          academyId,

          ...(teamScope?.isScoped
            ? {
                teamId: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

        },
      }),

      prisma.match.count({
        where: {
          academyId,

          ...(teamScope?.isScoped
            ? {
                teamId: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

        },
      }),
    ]);

    sports = {
      players,
      teams,
      coaches,
      trainingSessions,
      matches,
    };
  }

  let finance = {
    ...EMPTY_FINANCE,
  };

  if (canViewFinance) {
    const [
      payments,
      paymentsThisMonth,
      expenses,
      monthExpenses,
      charges,
    ] = await Promise.all([
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
              (
                paymentSum,
                payment
              ) =>
                paymentSum +
                payment.amountLek,
              0
            );

          return (
            sum +
            Math.max(
              0,
              charge.amountLek -
                paid
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

    finance = {
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
    };
  }

  return NextResponse.json({
    generatedAt:
      new Date().toISOString(),

    access: {
      sports: canViewSports,
      finance: canViewFinance,
    },


    sports,
    finance,
  });
}
