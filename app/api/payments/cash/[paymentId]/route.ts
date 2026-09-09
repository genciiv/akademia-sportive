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

async function rillogaritDetyrimin(
  chargeId: string
) {
  const charge =
    await prisma.playerCharge.findUnique({
      where: {
        id: chargeId,
      },
      include: {
        payments: {
          select: {
            amountLek: true,
          },
        },
      },
    });

  if (!charge) {
    return null;
  }

  const paidLek =
    charge.payments.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  let status = charge.status;

  if (charge.status !== "CANCELLED") {
    if (paidLek >= charge.amountLek) {
      status = "PAID";
    } else if (paidLek > 0) {
      status = "PARTIALLY_PAID";
    } else {
      status = "UNPAID";
    }
  }

  const updatedCharge =
    await prisma.playerCharge.update({
      where: {
        id: charge.id,
      },
      data: {
        status,
      },
    });

  return {
    charge: updatedCharge,
    paidLek,
    remainingLek: Math.max(
      0,
      charge.amountLek - paidLek
    ),
  };
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      paymentId: string;
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

  const payment =
    await prisma.cashPayment.findFirst({
      where: {
        id: params.paymentId,
        academyId:
          membership.academyId,
      },
      include: {
        charge: {
          include: {
            payments: {
              select: {
                id: true,
                amountLek: true,
              },
            },
          },
        },
      },
    });

  if (!payment) {
    return NextResponse.json(
      {
        error: "Pagesa nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body = await request.json();

  let amountLek:
    | number
    | undefined;

  if (
    body.amountLek !== undefined
  ) {
    amountLek =
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

    const otherPaidLek =
      payment.charge.payments
        .filter(
          (item) =>
            item.id !== payment.id
        )
        .reduce(
          (sum, item) =>
            sum + item.amountLek,
          0
        );

    const maxAllowed =
      payment.charge.amountLek -
      otherPaidLek;

    if (amountLek > maxAllowed) {
      return NextResponse.json(
        {
          error: `Shuma mund të jetë maksimumi ${maxAllowed} Lek.`,
        },
        {
          status: 400,
        }
      );
    }
  }

  let paidAt:
    | Date
    | undefined;

  if (
    body.paidAt !== undefined
  ) {
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

  const updatedPayment =
    await prisma.cashPayment.update({
      where: {
        id: payment.id,
      },
      data: {
        ...(amountLek !== undefined
          ? {
              amountLek,
            }
          : {}),
        ...(paidAt !== undefined
          ? {
              paidAt,
            }
          : {}),
        ...(body.notes !== undefined
          ? {
              notes:
                tekstOseNull(
                  body.notes
                ),
            }
          : {}),
      },
    });

  const summary =
    await rillogaritDetyrimin(
      payment.chargeId
    );

  return NextResponse.json({
    payment: updatedPayment,
    ...summary,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: {
      paymentId: string;
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

  const payment =
    await prisma.cashPayment.findFirst({
      where: {
        id: params.paymentId,
        academyId:
          membership.academyId,
      },
      select: {
        id: true,
        chargeId: true,
      },
    });

  if (!payment) {
    return NextResponse.json(
      {
        error: "Pagesa nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.cashPayment.delete({
    where: {
      id: payment.id,
    },
  });

  const summary =
    await rillogaritDetyrimin(
      payment.chargeId
    );

  return NextResponse.json({
    success: true,
    ...summary,
  });
}