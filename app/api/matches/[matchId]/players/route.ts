import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const ROLES = [
  "STARTER",
  "SUBSTITUTE",
] as const;

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

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

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

  const teamPlayers =
    await prisma.teamPlayer.findMany({
      where: {
        teamId: match.teamId,
        isActive: true,
        player: {
          academyId: membership.academyId,
          status: {
            not: "LEFT",
          },
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
            status: true,
          },
        },
      },
      orderBy: [
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
    });

  const squad =
    await prisma.matchPlayer.findMany({
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
    });

  const squadByPlayerId = new Map(
    squad.map((item) => [
      item.playerId,
      item,
    ])
  );

  const players = teamPlayers.map(
    (teamPlayer) => {
      const selected =
        squadByPlayerId.get(
          teamPlayer.player.id
        );

      return {
        ...teamPlayer.player,
        teamPosition: teamPlayer.player.position,
        teamJerseyNumber:
          teamPlayer.player.jerseyNumber,
        selected: Boolean(selected),
        matchPlayer: selected || null,
      };
    }
  );

  const starters = squad.filter(
    (item) => item.role === "STARTER"
  ).length;

  const substitutes = squad.filter(
    (item) => item.role === "SUBSTITUTE"
  ).length;

  return NextResponse.json({
    match,
    players,
    squad,
    statistics: {
      totalTeamPlayers:
        teamPlayers.length,
      selected: squad.length,
      starters,
      substitutes,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

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

  const role = String(
    body.role || "SUBSTITUTE"
  );

  const position =
    String(body.position || "").trim() ||
    null;

  const notes =
    String(body.notes || "").trim() ||
    null;

  const jerseyNumber =
    body.jerseyNumber === "" ||
    body.jerseyNumber === null ||
    body.jerseyNumber === undefined
      ? null
      : Number(body.jerseyNumber);

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
    !ROLES.includes(
      role as (typeof ROLES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Roli në ndeshje nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  if (
    jerseyNumber !== null &&
    (
      !Number.isInteger(jerseyNumber) ||
      jerseyNumber < 0 ||
      jerseyNumber > 999
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Numri i fanellës nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const teamPlayer =
    await prisma.teamPlayer.findFirst({
      where: {
        teamId: match.teamId,
        playerId,
        isActive: true,
        player: {
          academyId:
            membership.academyId,
          status: {
            not: "LEFT",
          },
        },
      },
      include: {
        player: {
          select: {
            id: true,
            position: true,
            jerseyNumber: true,
          },
        },
      },
    });

  if (!teamPlayer) {
    return NextResponse.json(
      {
        error:
          "Sportisti nuk është pjesë aktive e ekipit të kësaj ndeshjeje.",
      },
      { status: 404 }
    );
  }

  const existing =
    await prisma.matchPlayer.findUnique({
      where: {
        matchId_playerId: {
          matchId: match.id,
          playerId,
        },
      },
    });

  if (existing) {
    return NextResponse.json(
      {
        error:
          "Ky sportist është grumbulluar tashmë për këtë ndeshje.",
      },
      { status: 409 }
    );
  }

  const matchPlayer =
    await prisma.matchPlayer.create({
      data: {
        matchId: match.id,
        playerId,
        role: role as
          | "STARTER"
          | "SUBSTITUTE",
        jerseyNumber:
          jerseyNumber ??
          teamPlayer.player.jerseyNumber,
        position:
          position ??
          teamPlayer.player.position,
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
    { matchPlayer },
    { status: 201 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

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

  const matchPlayerId = String(
    body.matchPlayerId || ""
  ).trim();

  if (!matchPlayerId) {
    return NextResponse.json(
      {
        error:
          "Grumbullimi i sportistit është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  const existing =
    await prisma.matchPlayer.findFirst({
      where: {
        id: matchPlayerId,
        matchId: match.id,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Sportisti nuk u gjet në grumbullimin e kësaj ndeshjeje.",
      },
      { status: 404 }
    );
  }

  const role =
    body.role === undefined
      ? existing.role
      : String(body.role);

  if (
    !ROLES.includes(
      role as (typeof ROLES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Roli në ndeshje nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const jerseyNumber =
    body.jerseyNumber === undefined
      ? existing.jerseyNumber
      : body.jerseyNumber === "" ||
          body.jerseyNumber === null
        ? null
        : Number(body.jerseyNumber);

  if (
    jerseyNumber !== null &&
    (
      !Number.isInteger(jerseyNumber) ||
      jerseyNumber < 0 ||
      jerseyNumber > 999
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Numri i fanellës nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const matchPlayer =
    await prisma.matchPlayer.update({
      where: {
        id: existing.id,
      },
      data: {
        role: role as
          | "STARTER"
          | "SUBSTITUTE",
        jerseyNumber,
        position:
          body.position === undefined
            ? existing.position
            : String(
                body.position || ""
              ).trim() || null,
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
    matchPlayer,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

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

  const matchPlayerId = String(
    body.matchPlayerId || ""
  ).trim();

  if (!matchPlayerId) {
    return NextResponse.json(
      {
        error:
          "Grumbullimi i sportistit është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  const existing =
    await prisma.matchPlayer.findFirst({
      where: {
        id: matchPlayerId,
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
          "Sportisti nuk u gjet në grumbullimin e kësaj ndeshjeje.",
      },
      { status: 404 }
    );
  }

  await prisma.matchPlayer.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}