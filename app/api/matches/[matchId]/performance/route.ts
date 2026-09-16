import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessMatch,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

async function merrNdeshjen(
  matchId: string,
  academyId: string
) {
  return prisma.match.findFirst({
    where: {
      id: matchId,
      academyId,
    },
    select: {
      id: true,
      teamId: true,
      opponentName: true,
      startsAt: true,
      status: true,
    },
  });
}

function numerJoNegativ(
  value: unknown,
  fieldName: string
) {
  const number = Number(value ?? 0);

  if (
    !Number.isInteger(number) ||
    number < 0 ||
    number > 10000
  ) {
    throw new Error(
      `${fieldName} nuk është i vlefshëm.`
    );
  }

  return number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PERFORMANCE_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const match = await merrNdeshjen(
    (await params).matchId,
    academyId
  );

  if (!match) {
    return NextResponse.json(
      {
        error: "Ndeshja nuk u gjet.",
      },
      { status: 404 }
    );
  }
  const hasMatchAccess =
    await canAccessMatch(
      access,
      match.id
    );

  if (!hasMatchAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ndeshje.",
      },
      { status: 403 }
    );
  }

  const [matchPlayers, performances] =
    await Promise.all([
      prisma.matchPlayer.findMany({
        where: {
          matchId: match.id,
          player: {
            academyId:
              academyId,
          },
        },
        include: {
          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              jerseyNumber: true,
            },
          },
        },
        orderBy: [
          {
            role: "asc",
          },
          {
            player: {
              firstName: "asc",
            },
          },
          {
            player: {
              lastName: "asc",
            },
          },
        ],
      }),

      prisma.playerMatchPerformance.findMany({
        where: {
          matchId: match.id,
          player: {
            academyId:
              academyId,
          },
        },
      }),
    ]);

  const performanceByPlayer =
    new Map(
      performances.map(
        (performance) => [
          performance.playerId,
          performance,
        ]
      )
    );

  const players =
    matchPlayers.map((matchPlayer) => {
      const performance =
        performanceByPlayer.get(
          matchPlayer.playerId
        );

      return {
        matchPlayerId:
          matchPlayer.id,

        playerId:
          matchPlayer.playerId,

        player:
          matchPlayer.player,

        role:
          matchPlayer.role,

        minutesPlayed:
          matchPlayer.minutesPlayed,

        performance: performance
          ? {
              id: performance.id,

              shots:
                performance.shots,

              shotsOnTarget:
                performance.shotsOnTarget,

              passesAttempted:
                performance.passesAttempted,

              passesCompleted:
                performance.passesCompleted,

              dribblesAttempted:
                performance.dribblesAttempted,

              dribblesCompleted:
                performance.dribblesCompleted,

              duelsWon:
                performance.duelsWon,

              tackles:
                performance.tackles,

              interceptions:
                performance.interceptions,

              foulsCommitted:
                performance.foulsCommitted,

              foulsWon:
                performance.foulsWon,

              coachRating:
                performance.coachRating ===
                null
                  ? null
                  : Number(
                      performance.coachRating
                    ),

              coachNotes:
                performance.coachNotes,
            }
          : null,
      };
    });

  return NextResponse.json({
    match,
    players,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PERFORMANCE_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const match = await merrNdeshjen(
    (await params).matchId,
    academyId
  );

  if (!match) {
    return NextResponse.json(
      {
        error: "Ndeshja nuk u gjet.",
      },
      { status: 404 }
    );
  }
  const hasMatchAccess =
    await canAccessMatch(
      access,
      match.id
    );

  if (!hasMatchAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ndeshje.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const playerId = String(
    body.playerId || ""
  ).trim();

  if (!playerId) {
    return NextResponse.json(
      {
        error:
          "Sportisti është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  const matchPlayer =
    await prisma.matchPlayer.findFirst({
      where: {
        matchId: match.id,
        playerId,
        player: {
          academyId:
            academyId,
        },
      },
      select: {
        id: true,
        playerId: true,
      },
    });

  if (!matchPlayer) {
    return NextResponse.json(
      {
        error:
          "Sportisti nuk është pjesë e grumbullimit të kësaj ndeshjeje.",
      },
      { status: 404 }
    );
  }

  let shots: number;
  let shotsOnTarget: number;
  let passesAttempted: number;
  let passesCompleted: number;
  let dribblesAttempted: number;
  let dribblesCompleted: number;
  let duelsWon: number;
  let tackles: number;
  let interceptions: number;
  let foulsCommitted: number;
  let foulsWon: number;

  try {
    shots = numerJoNegativ(
      body.shots,
      "Goditjet totale"
    );

    shotsOnTarget = numerJoNegativ(
      body.shotsOnTarget,
      "Goditjet në portë"
    );

    passesAttempted = numerJoNegativ(
      body.passesAttempted,
      "Pasimet totale"
    );

    passesCompleted = numerJoNegativ(
      body.passesCompleted,
      "Pasimet e sakta"
    );

    dribblesAttempted = numerJoNegativ(
      body.dribblesAttempted,
      "Driblimet e tentuara"
    );

    dribblesCompleted = numerJoNegativ(
      body.dribblesCompleted,
      "Driblimet e suksesshme"
    );

    duelsWon = numerJoNegativ(
      body.duelsWon,
      "Duelet e fituara"
    );

    tackles = numerJoNegativ(
      body.tackles,
      "Ndërhyrjet"
    );

    interceptions = numerJoNegativ(
      body.interceptions,
      "Interceptimet"
    );

    foulsCommitted = numerJoNegativ(
      body.foulsCommitted,
      "Faullet e kryera"
    );

    foulsWon = numerJoNegativ(
      body.foulsWon,
      "Faullet e fituara"
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Statistikat nuk janë të vlefshme.",
      },
      { status: 400 }
    );
  }

  if (shotsOnTarget > shots) {
    return NextResponse.json(
      {
        error:
          "Goditjet në portë nuk mund të jenë më shumë se goditjet totale.",
      },
      { status: 400 }
    );
  }

  if (
    passesCompleted >
    passesAttempted
  ) {
    return NextResponse.json(
      {
        error:
          "Pasimet e sakta nuk mund të jenë më shumë se pasimet totale.",
      },
      { status: 400 }
    );
  }

  if (
    dribblesCompleted >
    dribblesAttempted
  ) {
    return NextResponse.json(
      {
        error:
          "Driblimet e suksesshme nuk mund të jenë më shumë se driblimet e tentuara.",
      },
      { status: 400 }
    );
  }

  const coachRating =
    body.coachRating === "" ||
    body.coachRating === null ||
    body.coachRating === undefined
      ? null
      : Number(body.coachRating);

  if (
    coachRating !== null &&
    (
      !Number.isFinite(coachRating) ||
      coachRating < 1 ||
      coachRating > 10
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Vlerësimi i trajnerit duhet të jetë nga 1 deri në 10.",
      },
      { status: 400 }
    );
  }

  const coachNotes =
    String(
      body.coachNotes || ""
    ).trim() || null;

  if (
    coachNotes &&
    coachNotes.length > 2000
  ) {
    return NextResponse.json(
      {
        error:
          "Shënimet e trajnerit nuk mund të kalojnë 2000 karaktere.",
      },
      { status: 400 }
    );
  }

  const performance =
    await prisma.playerMatchPerformance.upsert({
      where: {
        matchId_playerId: {
          matchId: match.id,
          playerId,
        },
      },

      create: {
        matchId: match.id,
        playerId,

        shots,
        shotsOnTarget,

        passesAttempted,
        passesCompleted,

        dribblesAttempted,
        dribblesCompleted,

        duelsWon,

        tackles,
        interceptions,

        foulsCommitted,
        foulsWon,

        coachRating,
        coachNotes,
      },

      update: {
        shots,
        shotsOnTarget,

        passesAttempted,
        passesCompleted,

        dribblesAttempted,
        dribblesCompleted,

        duelsWon,

        tackles,
        interceptions,

        foulsCommitted,
        foulsWon,

        coachRating,
        coachNotes,
      },
    });

  return NextResponse.json({
    performance: {
      ...performance,
      coachRating:
        performance.coachRating === null
          ? null
          : Number(
              performance.coachRating
            ),
    },
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PERFORMANCE_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const match = await merrNdeshjen(
    (await params).matchId,
    academyId
  );

  if (!match) {
    return NextResponse.json(
      {
        error: "Ndeshja nuk u gjet.",
      },
      { status: 404 }
    );
  }
  const hasMatchAccess =
    await canAccessMatch(
      access,
      match.id
    );

  if (!hasMatchAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ndeshje.",
      },
      { status: 403 }
    );
  }

  const body = await request.json();

  const playerId = String(
    body.playerId || ""
  ).trim();

  if (!playerId) {
    return NextResponse.json(
      {
        error:
          "Sportisti është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  const performance =
    await prisma.playerMatchPerformance.findFirst({
      where: {
        matchId: match.id,
        playerId,
        player: {
          academyId:
            academyId,
        },
      },
      select: {
        id: true,
      },
    });

  if (!performance) {
    return NextResponse.json(
      {
        error:
          "Performanca e sportistit nuk u gjet.",
      },
      { status: 404 }
    );
  }

  await prisma.playerMatchPerformance.delete({
    where: {
      id: performance.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
