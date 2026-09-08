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

export async function POST(request: Request) {
  const membership = await merrAkademineAktive();

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

  const body = await request.json();

  const playerId =
    String(body.playerId ?? "").trim();

  if (!playerId) {
    return NextResponse.json(
      {
        error: "Sportisti është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId:
          membership.academyId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

  if (!player) {
    return NextResponse.json(
      {
        error: "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const title =
    String(body.title ?? "").trim();

  if (!title) {
    return NextResponse.json(
      {
        error: "Titulli i detyrimit është i detyrueshëm.",
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

  let dueDate: Date | null = null;

  if (body.dueDate) {
    dueDate =
      new Date(body.dueDate);

    if (
      Number.isNaN(
        dueDate.getTime()
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
  }

  let periodMonth: number | null =
    null;

  if (
    body.periodMonth !== undefined &&
    body.periodMonth !== null &&
    body.periodMonth !== ""
  ) {
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

  let periodYear: number | null =
    null;

  if (
    body.periodYear !== undefined &&
    body.periodYear !== null &&
    body.periodYear !== ""
  ) {
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

  const charge =
    await prisma.playerCharge.create({
      data: {
        academyId:
          membership.academyId,
        playerId: player.id,
        title,
        amountLek,
        dueDate,
        periodMonth,
        periodYear,
        status: "UNPAID",
        notes:
          tekstOseNull(body.notes),
      },
    });

  return NextResponse.json(
    {
      charge,
      player,
    },
    {
      status: 201,
    }
  );
}