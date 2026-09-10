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

const KATEGORITE = [
  "SALARY",
  "RENT",
  "EQUIPMENT",
  "TRANSPORT",
  "MEDICAL",
  "TOURNAMENT",
  "UTILITIES",
  "MARKETING",
  "OTHER",
] as const;

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      expenseId: string;
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

  const expense =
    await prisma.expense.findFirst({
      where: {
        id: params.expenseId,
        academyId:
          membership.academyId,
      },
    });

  if (!expense) {
    return NextResponse.json(
      {
        error: "Shpenzimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body =
    await request.json();

  const title =
    body.title !== undefined
      ? String(body.title).trim()
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
  }

  let category:
    | (typeof KATEGORITE)[number]
    | undefined;

  if (
    body.category !== undefined
  ) {
    const parsedCategory =
      String(
        body.category
      ).trim();

    if (
      !KATEGORITE.includes(
        parsedCategory as
          (typeof KATEGORITE)[number]
      )
    ) {
      return NextResponse.json(
        {
          error: "Kategoria nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    category =
      parsedCategory as
        (typeof KATEGORITE)[number];
  }

  let expenseDate:
    | Date
    | undefined;

  if (
    body.expenseDate !== undefined
  ) {
    const parsed =
      new Date(
        body.expenseDate
      );

    if (
      Number.isNaN(
        parsed.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error: "Data e shpenzimit nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }

    expenseDate = parsed;
  }

  const updated =
    await prisma.expense.update({
      where: {
        id: expense.id,
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
        ...(category !== undefined
          ? {
              category,
            }
          : {}),
        ...(expenseDate !== undefined
          ? {
              expenseDate,
            }
          : {}),
        ...(body.description !==
        undefined
          ? {
              description:
                String(
                  body.description ??
                    ""
                ).trim() ||
                null,
            }
          : {}),
        ...(body.notes !== undefined
          ? {
              notes:
                String(
                  body.notes ?? ""
                ).trim() ||
                null,
            }
          : {}),
      },
    });

  return NextResponse.json({
    expense: updated,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: {
      expenseId: string;
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

  const expense =
    await prisma.expense.findFirst({
      where: {
        id: params.expenseId,
        academyId:
          membership.academyId,
      },
      select: {
        id: true,
      },
    });

  if (!expense) {
    return NextResponse.json(
      {
        error: "Shpenzimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.expense.delete({
    where: {
      id: expense.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}