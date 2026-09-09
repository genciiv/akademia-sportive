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

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      chargeId: string;
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

  const charge =
    await prisma.playerCharge.findFirst({
      where: {
        id: params.chargeId,
        academyId:
          membership.academyId,
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
    return NextResponse.json(
      {
        error: "Detyrimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body = await request.json();

  const title =
    typeof body.title === "string"
      ? body.title.trim()
      : undefined;

  if (
    title !== undefined &&
    !title
  ) {
    return NextResponse.json(
      {
        error: "Titulli është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

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

    const paidLek =
      charge.payments.reduce(
        (sum, payment) =>
          sum + payment.amountLek,
        0
      );

    if (amountLek < paidLek) {
      return NextResponse.json(
        {
          error: `Shuma e detyrimit nuk mund të jetë më e vogël se ${paidLek} Lek që janë paguar tashmë.`,
        },
        {
          status: 400,
        }
      );
    }
  }

  let dueDate:
    | Date
    | null
    | undefined;

  if (
    body.dueDate !== undefined
  ) {
    if (
      body.dueDate === null ||
      body.dueDate === ""
    ) {
      dueDate = null;
    } else {
      const parsed =
        new Date(body.dueDate);

      if (
        Number.isNaN(
          parsed.getTime()
        )
      ) {
        return NextResponse.json(
          {
            error: "Afati i pagesës nuk është i vlefshëm.",
          },
          {
            status: 400,
          }
        );
      }

      dueDate = parsed;
    }
  }

  let periodMonth:
    | number
    | null
    | undefined;

  if (
    body.periodMonth !== undefined
  ) {
    if (
      body.periodMonth === null ||
      body.periodMonth === ""
    ) {
      periodMonth = null;
    } else {
      periodMonth =
        Number(body.periodMonth);

      if (
        !Number.isInteger(
          periodMonth
        ) ||
        periodMonth < 1 ||
        periodMonth > 12
      ) {
        return NextResponse.json(
          {
            error: "Muaji duhet të jetë nga 1 deri në 12.",
          },
          {
            status: 400,
          }
        );
      }
    }
  }

  let periodYear:
    | number
    | null
    | undefined;

  if (
    body.periodYear !== undefined
  ) {
    if (
      body.periodYear === null ||
      body.periodYear === ""
    ) {
      periodYear = null;
    } else {
      periodYear =
        Number(body.periodYear);

      if (
        !Number.isInteger(
          periodYear
        ) ||
        periodYear < 2000 ||
        periodYear > 2100
      ) {
        return NextResponse.json(
          {
            error: "Viti nuk është i vlefshëm.",
          },
          {
            status: 400,
          }
        );
      }
    }
  }

  const paidLek =
    charge.payments.reduce(
      (sum, payment) =>
        sum + payment.amountLek,
      0
    );

  const nextAmountLek =
    amountLek ??
    charge.amountLek;

  let status =
    charge.status;

  if (
    charge.status !==
    "CANCELLED"
  ) {
    if (paidLek >= nextAmountLek) {
      status = "PAID";
    } else if (paidLek > 0) {
      status =
        "PARTIALLY_PAID";
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
        ...(title !== undefined
          ? {
              title,
            }
          : {}),
        ...(amountLek !== undefined
          ? {
              amountLek,
            }
          : {}),
        ...(dueDate !== undefined
          ? {
              dueDate,
            }
          : {}),
        ...(periodMonth !== undefined
          ? {
              periodMonth,
            }
          : {}),
        ...(periodYear !== undefined
          ? {
              periodYear,
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
        status,
      },
      include: {
        payments: true,
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

  return NextResponse.json({
    charge: updatedCharge,
    paidLek,
    remainingLek:
      Math.max(
        0,
        updatedCharge.amountLek -
          paidLek
      ),
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: {
      chargeId: string;
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

  const charge =
    await prisma.playerCharge.findFirst({
      where: {
        id: params.chargeId,
        academyId:
          membership.academyId,
      },
      include: {
        payments: {
          select: {
            id: true,
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

  if (charge.payments.length > 0) {
    return NextResponse.json(
      {
        error: "Ky detyrim ka pagesa të regjistruara dhe nuk mund të fshihet. Fshi fillimisht pagesat e lidhura.",
      },
      {
        status: 400,
      }
    );
  }

  await prisma.playerCharge.delete({
    where: {
      id: charge.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}