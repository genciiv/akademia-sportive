import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTrainingSession,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "PRESENT",
  "ABSENT",
  "LATE",
  "EXCUSED",
] as const;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.ATTENDANCE_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const trainingSession =
    await prisma.trainingSession.findFirst({
      where: {
        id: (await params).sessionId,
        academyId: academyId,
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
  const hasSessionAccess =
    await canAccessTrainingSession(
      access,
      trainingSession.id
    );

  if (!hasSessionAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë seancë.",
      },
      {
        status: 403,
      }
    );
  }

  const teamPlayers = await prisma.teamPlayer.findMany({
    where: {
      teamId: trainingSession.teamId,
      isActive: true,
      player: {
        academyId: academyId,
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
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.ATTENDANCE_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const body = await request.json();

  const playerId = String(body.playerId || "").trim();
  const status = String(body.status || "").trim();
  const note = String(body.note || "").trim() || null;

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  if (
    !STATUSET.includes(
      status as (typeof STATUSET)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Statusi i pjesÃ«marrjes nuk Ã«shtÃ« i vlefshÃ«m." },
      { status: 400 }
    );
  }

  const trainingSession =
    await prisma.trainingSession.findFirst({
      where: {
        id: (await params).sessionId,
        academyId: academyId,
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
  const hasSessionAccess =
    await canAccessTrainingSession(
      access,
      trainingSession.id
    );

  if (!hasSessionAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë seancë.",
      },
      {
        status: 403,
      }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: playerId,
      academyId: academyId,
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
          "Sportisti nuk Ã«shtÃ« pjesÃ« aktive e ekipit tÃ« kÃ«saj seance.",
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
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.ATTENDANCE_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const body = await request.json();
  const playerId = String(body.playerId || "").trim();

  if (!playerId) {
    return NextResponse.json(
      { error: "Sportisti Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  const trainingSession =
    await prisma.trainingSession.findFirst({
      where: {
        id: (await params).sessionId,
        academyId: academyId,
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
  const hasSessionAccess =
    await canAccessTrainingSession(
      access,
      trainingSession.id
    );

  if (!hasSessionAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë seancë.",
      },
      {
        status: 403,
      }
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
      { error: "PjesÃ«marrja nuk u gjet." },
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
