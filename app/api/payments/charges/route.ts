import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";

import { prisma } from "@/lib/prisma";


function tekstOseNull(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PAYMENTS_MANAGE
    );

  if (!access.ok) {
    return access.response;
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
          access.academyId,
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
          access.academyId,
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
