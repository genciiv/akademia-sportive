import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

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
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await merrEkipin(
    params.teamId,
    academyId
  );

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }
  const hasTeamAccess =
    await canAccessTeam(
      access,
      team.id
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ekip.",
      },
      {
        status: 403,
      }
    );
  }

  const players = await prisma.player.findMany({
    where: {
      academyId: academyId,
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
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAM_ROSTER_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await merrEkipin(
    params.teamId,
    academyId
  );

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }
  const hasTeamAccess =
    await canAccessTeam(
      access,
      team.id
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ekip.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await request.json();

  const playerId = String(body.playerId || "").trim();

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: academyId,
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
        { error: "Sportisti Ã«shtÃ« tashmÃ« nÃ« kÃ«tÃ« ekip." },
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
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAM_ROSTER_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await merrEkipin(
    params.teamId,
    academyId
  );

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }
  const hasTeamAccess =
    await canAccessTeam(
      access,
      team.id
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ekip.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await request.json();

  const playerId = String(body.playerId || "").trim();

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: academyId,
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
      { error: "Sportisti nuk Ã«shtÃ« aktiv nÃ« kÃ«tÃ« ekip." },
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
