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

async function merrEkipin(teamId: string, academyId: string) {
  return prisma.team.findFirst({
    where: {
      id: teamId,
      academyId,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const team = await merrEkipin(
    params.teamId,
    membership.academyId
  );

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }

  const players = await prisma.player.findMany({
    where: {
      academyId: membership.academyId,
      status: {
        not: "LEFT",
      },
    },
    include: {
      teams: {
        where: {
          teamId: team.id,
          isActive: true,
        },
        select: {
          id: true,
        },
      },
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  const result = players.map((player) => ({
    id: player.id,
    firstName: player.firstName,
    lastName: player.lastName,
    position: player.position,
    jerseyNumber: player.jerseyNumber,
    status: player.status,
    isInTeam: player.teams.length > 0,
  }));

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.name,
    },
    players: result,
  });
}

export async function POST(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const team = await merrEkipin(
    params.teamId,
    membership.academyId
  );

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const playerId = String(body.playerId || "").trim();

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti është i detyrueshëm." },
      { status: 400 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: membership.academyId,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Sportisti nuk u gjet." },
      { status: 404 }
    );
  }

  const ekziston = await prisma.teamPlayer.findUnique({
    where: {
      teamId_playerId: {
        teamId: team.id,
        playerId: player.id,
      },
    },
  });

  if (ekziston) {
    if (ekziston.isActive) {
      return NextResponse.json(
        { error: "Sportisti është tashmë në këtë ekip." },
        { status: 409 }
      );
    }

    const membershipEkipi = await prisma.teamPlayer.update({
      where: {
        id: ekziston.id,
      },
      data: {
        isActive: true,
        joinedAt: new Date(),
        leftAt: null,
      },
    });

    return NextResponse.json(
      { membership: membershipEkipi },
      { status: 200 }
    );
  }

  const membershipEkipi = await prisma.teamPlayer.create({
    data: {
      teamId: team.id,
      playerId: player.id,
      isActive: true,
    },
  });

  return NextResponse.json(
    { membership: membershipEkipi },
    { status: 201 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const team = await merrEkipin(
    params.teamId,
    membership.academyId
  );

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const playerId = String(body.playerId || "").trim();

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti është i detyrueshëm." },
      { status: 400 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: membership.academyId,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Sportisti nuk u gjet." },
      { status: 404 }
    );
  }

  const lidhja = await prisma.teamPlayer.findUnique({
    where: {
      teamId_playerId: {
        teamId: team.id,
        playerId: player.id,
      },
    },
  });

  if (!lidhja || !lidhja.isActive) {
    return NextResponse.json(
      { error: "Sportisti nuk është aktiv në këtë ekip." },
      { status: 404 }
    );
  }

  await prisma.teamPlayer.update({
    where: {
      id: lidhja.id,
    },
    data: {
      isActive: false,
      leftAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
  });
}