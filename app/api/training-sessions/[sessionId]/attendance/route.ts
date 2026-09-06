import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
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

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const trainingSession =
    await prisma.trainingSession.findFirst({
      where: {
        id: params.sessionId,
        academyId: membership.academyId,
      },
      select: {
        id: true,
        teamId: true,
        title: true,
        startsAt: true,
        status: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId: trainingSession.teamId,
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
    orderBy: {
      player: {
        lastName: "asc",
      },
    },
  });

  const attendances =
    await prisma.trainingAttendance.findMany({
      where: {
        trainingSessionId: trainingSession.id,
      },
      select: {
        id: true,
        playerId: true,
        status: true,
        note: true,
      },
    });

  const attendanceByPlayer = new Map(
    attendances.map((attendance) => [
      attendance.playerId,
      attendance,
    ])
  );

  const players = teamPlayers.map(({ player }) => {
    const attendance = attendanceByPlayer.get(player.id);

    return {
      ...player,
      attendance: attendance
        ? {
            id: attendance.id,
            status: attendance.status,
            note: attendance.note,
          }
        : null,
    };
  });

  const statistics = {
    total: players.length,
    marked: attendances.length,
    present: attendances.filter(
      (item) => item.status === "PRESENT"
    ).length,
    absent: attendances.filter(
      (item) => item.status === "ABSENT"
    ).length,
    late: attendances.filter(
      (item) => item.status === "LATE"
    ).length,
    excused: attendances.filter(
      (item) => item.status === "EXCUSED"
    ).length,
  };

  return NextResponse.json({
    trainingSession,
    players,
    statistics,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const playerId = String(body.playerId || "").trim();
  const status = String(body.status || "").trim();
  const note = String(body.note || "").trim() || null;

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (
    !STATUSET.includes(
      status as (typeof STATUSET)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Statusi i pjesëmarrjes nuk është i vlefshëm." },
      { status: 400 }
    );
  }

  const trainingSession =
    await prisma.trainingSession.findFirst({
      where: {
        id: params.sessionId,
        academyId: membership.academyId,
      },
      select: {
        id: true,
        teamId: true,
      },
    });

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: membership.academyId,
    },
    select: {
      id: true,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Sportisti nuk u gjet." },
      { status: 404 }
    );
  }

  const teamMembership =
    await prisma.teamPlayer.findFirst({
      where: {
        teamId: trainingSession.teamId,
        playerId: player.id,
        isActive: true,
      },
    });

  if (!teamMembership) {
    return NextResponse.json(
      {
        error:
          "Sportisti nuk është pjesë aktive e ekipit të kësaj seance.",
      },
      { status: 400 }
    );
  }

  const attendance =
    await prisma.trainingAttendance.upsert({
      where: {
        trainingSessionId_playerId: {
          trainingSessionId: trainingSession.id,
          playerId: player.id,
        },
      },
      create: {
        trainingSessionId: trainingSession.id,
        playerId: player.id,
        status:
          status as (typeof STATUSET)[number],
        note,
      },
      update: {
        status:
          status as (typeof STATUSET)[number],
        note,
      },
    });

  return NextResponse.json({
    attendance,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
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

  const trainingSession =
    await prisma.trainingSession.findFirst({
      where: {
        id: params.sessionId,
        academyId: membership.academyId,
      },
      select: {
        id: true,
      },
    });

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const attendance =
    await prisma.trainingAttendance.findUnique({
      where: {
        trainingSessionId_playerId: {
          trainingSessionId: trainingSession.id,
          playerId,
        },
      },
    });

  if (!attendance) {
    return NextResponse.json(
      { error: "Pjesëmarrja nuk u gjet." },
      { status: 404 }
    );
  }

  await prisma.trainingAttendance.delete({
    where: {
      id: attendance.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}