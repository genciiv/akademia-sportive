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

function parseDateOnly(value: string) {
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

function nextUtcDay(date: Date) {
  const result = new Date(date);

  result.setUTCDate(
    result.getUTCDate() + 1
  );

  return result;
}

export async function GET(
  request: Request
) {
  const access =
    await requireAnyAcademyPermission([
      PERMISSIONS.REPORTS_SPORTS_VIEW,
      PERMISSIONS.REPORTS_FINANCE_VIEW,
    ]);

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const url =
    new URL(request.url);

  const fromParam =
    url.searchParams.get("from");

  const toParam =
    url.searchParams.get("to");

  const hasAnyPeriodParam =
    Boolean(fromParam || toParam);

  if (
    hasAnyPeriodParam &&
    (!fromParam || !toParam)
  ) {
    return NextResponse.json(
      {
        error:
          "Vendos të dyja datat: nga dhe deri më.",
      },
      {
        status: 400,
      }
    );
  }

  let period:
    | {
        from: string;
        to: string;
        start: Date;
        endExclusive: Date;
      }
    | null = null;

  if (fromParam && toParam) {
    const start =
      parseDateOnly(fromParam);

    const end =
      parseDateOnly(toParam);

    if (!start || !end) {
      return NextResponse.json(
        {
          error:
            "Datat duhet të jenë në formatin YYYY-MM-DD.",
        },
        {
          status: 400,
        }
      );
    }

    if (start.getTime() > end.getTime()) {
      return NextResponse.json(
        {
          error:
            "Data 'Nga' nuk mund të jetë pas datës 'Deri më'.",
        },
        {
          status: 400,
        }
      );
    }

    period = {
      from: fromParam,
      to: toParam,
      start,
      endExclusive:
        nextUtcDay(end),
    };
  }

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

  let periodReport:
    | {
        from: string;
        to: string;

        sports: {
          trainingSessions: number;
          matches: number;
        };

        finance: {
          collectedLek: number;
          expensesLek: number;
          netLek: number;
          paymentCount: number;
          expenseCount: number;
        };
      }
    | null = null;

  if (period) {
    let periodSports = {
      trainingSessions: 0,
      matches: 0,
    };

    if (canViewSports) {
      const [
        trainingSessions,
        matches,
      ] = await Promise.all([
        prisma.trainingSession.count({
          where: {
            academyId,

            startsAt: {
              gte: period.start,
              lt: period.endExclusive,
            },

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

            startsAt: {
              gte: period.start,
              lt: period.endExclusive,
            },

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

      periodSports = {
        trainingSessions,
        matches,
      };
    }

    let periodFinance = {
      collectedLek: 0,
      expensesLek: 0,
      netLek: 0,
      paymentCount: 0,
      expenseCount: 0,
    };

    if (canViewFinance) {
      const [
        periodPayments,
        periodExpenses,
      ] = await Promise.all([
        prisma.cashPayment.findMany({
          where: {
            academyId,

            paidAt: {
              gte: period.start,
              lt: period.endExclusive,
            },
          },

          select: {
            amountLek: true,
          },
        }),

        prisma.expense.findMany({
          where: {
            academyId,

            expenseDate: {
              gte: period.start,
              lt: period.endExclusive,
            },
          },

          select: {
            amountLek: true,
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

      periodFinance = {
        collectedLek,
        expensesLek,
        netLek:
          collectedLek - expensesLek,
        paymentCount:
          periodPayments.length,
        expenseCount:
          periodExpenses.length,
      };
    }

    periodReport = {
      from: period.from,
      to: period.to,
      sports: periodSports,
      finance: periodFinance,
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
    periodReport,
  });
}
