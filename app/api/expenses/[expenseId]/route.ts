import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


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
    params: Promise<{
      expenseId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.EXPENSES_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const expense =
    await prisma.expense.findFirst({
      where: {
        id: (await params).expenseId,
        academyId:
          access.academyId,
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
    params: Promise<{
      expenseId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.EXPENSES_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const expense =
    await prisma.expense.findFirst({
      where: {
        id: (await params).expenseId,
        academyId:
          access.academyId,
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
