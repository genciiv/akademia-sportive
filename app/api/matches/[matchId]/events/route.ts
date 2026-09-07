import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const EVENT_TYPES = [
  "GOAL",
  "ASSIST",
  "YELLOW_CARD",
  "RED_CARD",
  "SUBSTITUTION_IN",
  "SUBSTITUTION_OUT",
] as const;

type MatchEventTypeValue =
  (typeof EVENT_TYPES)[number];

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
    },
  });
}

function minuteEVlefshme(value: unknown) {
  const minute = Number(value);

  return (
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 200
  );
}

function minutaShteseEVlefshme(
  value: unknown
) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return true;
  }

  const minute = Number(value);

  return (
    Number.isInteger(minute) &&
    minute >= 0 &&
    minute <= 99
  );
}

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const match = await merrNdeshjen(
    params.matchId,
    membership.academyId
  );

  if (!match) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  const [events, squad] =
    await Promise.all([
      prisma.matchEvent.findMany({
        where: {
          matchId: match.id,
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
            minute: "asc",
          },
          {
            extraMinute: "asc",
          },
          {
            createdAt: "asc",
          },
        ],
      }),

      prisma.matchPlayer.findMany({
        where: {
          matchId: match.id,
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
        ],
      }),
    ]);

  const goals = events.filter(
    (event) => event.type === "GOAL"
  ).length;

  const assists = events.filter(
    (event) => event.type === "ASSIST"
  ).length;

  const yellowCards = events.filter(
    (event) =>
      event.type === "YELLOW_CARD"
  ).length;

  const redCards = events.filter(
    (event) =>
      event.type === "RED_CARD"
  ).length;

  const substitutionsIn = events.filter(
    (event) =>
      event.type === "SUBSTITUTION_IN"
  ).length;

  const substitutionsOut = events.filter(
    (event) =>
      event.type === "SUBSTITUTION_OUT"
  ).length;

  return NextResponse.json({
    match,
    events,
    squad,
    statistics: {
      total: events.length,
      goals,
      assists,
      yellowCards,
      redCards,
      substitutionsIn,
      substitutionsOut,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const match = await merrNdeshjen(
    params.matchId,
    membership.academyId
  );

  if (!match) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const playerId = String(
    body.playerId || ""
  ).trim();

  const type = String(
    body.type || ""
  ).trim();

  const minute = Number(body.minute);

  const extraMinute =
    body.extraMinute === "" ||
    body.extraMinute === null ||
    body.extraMinute === undefined
      ? null
      : Number(body.extraMinute);

  const notes =
    String(body.notes || "").trim() ||
    null;

  if (!playerId) {
    return NextResponse.json(
      {
        error:
          "Sportisti është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  if (
    !EVENT_TYPES.includes(
      type as MatchEventTypeValue
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Lloji i ngjarjes nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  if (!minuteEVlefshme(minute)) {
    return NextResponse.json(
      {
        error:
          "Minuta e ngjarjes nuk është e vlefshme.",
      },
      { status: 400 }
    );
  }

  if (
    !minutaShteseEVlefshme(extraMinute)
  ) {
    return NextResponse.json(
      {
        error:
          "Minuta shtesë nuk është e vlefshme.",
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
            membership.academyId,
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
      { status: 400 }
    );
  }

  const event =
    await prisma.matchEvent.create({
      data: {
        matchId: match.id,
        playerId,
        type:
          type as MatchEventTypeValue,
        minute,
        extraMinute,
        notes,
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
    });

  return NextResponse.json(
    { event },
    { status: 201 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const match = await merrNdeshjen(
    params.matchId,
    membership.academyId
  );

  if (!match) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const eventId = String(
    body.eventId || ""
  ).trim();

  if (!eventId) {
    return NextResponse.json(
      {
        error:
          "Ngjarja është e detyrueshme.",
      },
      { status: 400 }
    );
  }

  const existing =
    await prisma.matchEvent.findFirst({
      where: {
        id: eventId,
        matchId: match.id,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Ngjarja nuk u gjet.",
      },
      { status: 404 }
    );
  }

  const playerId =
    body.playerId === undefined
      ? existing.playerId
      : String(body.playerId || "").trim();

  if (!playerId) {
    return NextResponse.json(
      {
        error:
          "Sportisti është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  const type =
    body.type === undefined
      ? existing.type
      : String(body.type);

  if (
    !EVENT_TYPES.includes(
      type as MatchEventTypeValue
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Lloji i ngjarjes nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const minute =
    body.minute === undefined
      ? existing.minute
      : Number(body.minute);

  if (!minuteEVlefshme(minute)) {
    return NextResponse.json(
      {
        error:
          "Minuta e ngjarjes nuk është e vlefshme.",
      },
      { status: 400 }
    );
  }

  const extraMinute =
    body.extraMinute === undefined
      ? existing.extraMinute
      : body.extraMinute === "" ||
          body.extraMinute === null
        ? null
        : Number(body.extraMinute);

  if (
    !minutaShteseEVlefshme(extraMinute)
  ) {
    return NextResponse.json(
      {
        error:
          "Minuta shtesë nuk është e vlefshme.",
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
            membership.academyId,
        },
      },
      select: {
        id: true,
      },
    });

  if (!matchPlayer) {
    return NextResponse.json(
      {
        error:
          "Sportisti nuk është pjesë e grumbullimit të kësaj ndeshjeje.",
      },
      { status: 400 }
    );
  }

  const event =
    await prisma.matchEvent.update({
      where: {
        id: existing.id,
      },
      data: {
        playerId,
        type:
          type as MatchEventTypeValue,
        minute,
        extraMinute,
        notes:
          body.notes === undefined
            ? existing.notes
            : String(
                body.notes || ""
              ).trim() || null,
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
    });

  return NextResponse.json({
    event,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership =
    await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const match = await merrNdeshjen(
    params.matchId,
    membership.academyId
  );

  if (!match) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const eventId = String(
    body.eventId || ""
  ).trim();

  if (!eventId) {
    return NextResponse.json(
      {
        error:
          "Ngjarja është e detyrueshme.",
      },
      { status: 400 }
    );
  }

  const existing =
    await prisma.matchEvent.findFirst({
      where: {
        id: eventId,
        matchId: match.id,
      },
      select: {
        id: true,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Ngjarja nuk u gjet.",
      },
      { status: 404 }
    );
  }

  await prisma.matchEvent.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}