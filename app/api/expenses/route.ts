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

  const expenses =
    await prisma.expense.findMany({
      where: {
        academyId:
          membership.academyId,
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
          membership.academyId,
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