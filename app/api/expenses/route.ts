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

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.EXPENSES_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const expenses =
    await prisma.expense.findMany({
      where: {
        academyId:
          access.academyId,
      },
      orderBy: [
        {
          expenseDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

  const totalLek =
    expenses.reduce(
      (sum, expense) =>
        sum + expense.amountLek,
      0
    );

  return NextResponse.json({
    summary: {
      count: expenses.length,
      totalLek,
    },
    expenses,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.EXPENSES_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const body =
    await request.json();

  const title =
    String(
      body.title ?? ""
    ).trim();

  if (!title) {
    return NextResponse.json(
      {
        error: "Titulli është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const amountLek =
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

  const category =
    String(
      body.category ?? "OTHER"
    ).trim();

  if (
    !KATEGORITE.includes(
      category as
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

  let expenseDate =
    new Date();

  if (body.expenseDate) {
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

  const expense =
    await prisma.expense.create({
      data: {
        academyId:
          access.academyId,
        category:
          category as
            (typeof KATEGORITE)[number],
        title,
        amountLek,
        expenseDate,
        description:
          String(
            body.description ?? ""
          ).trim() || null,
        notes:
          String(
            body.notes ?? ""
          ).trim() || null,
      },
    });

  return NextResponse.json(
    {
      expense,
    },
    {
      status: 201,
    }
  );
}
