import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";


export async function GET(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.COACHES_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const teamScope =
    await getActiveTeamScope(access);

  const coach = await prisma.coach.findFirst({
    where: {
      id: (await params).coachId,
      academyId: access.academyId,
    },
  });

  if (!coach) {
    return NextResponse.json(
      { error: "Trajneri nuk u gjet." },
      { status: 404 }
    );
  }

  if (teamScope.isScoped) {
    const accessibleAssignment =
      await prisma.coachTeam.findFirst({
        where: {
          coachId: coach.id,
          isActive: true,
          teamId: {
            in: teamScope.teamIds,
          },
        },
        select: {
          id: true,
        },
      });

    if (!accessibleAssignment) {
      return NextResponse.json(
        {
          error:
            "Nuk ke leje për të aksesuar këtë trajner.",
        },
        { status: 403 }
      );
    }
  }

  const teams = await prisma.team.findMany({
    where: {
      academyId: access.academyId,
          ...(teamScope.isScoped
        ? {
            id: {
              in: teamScope.teamIds,
            },
          }
        : {}),
    },
    include: {
      coaches: {
        where: {
          coachId: coach.id,
        },
      },
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    teams: teams.map((team) => ({
      id: team.id,
      name: team.name,
      sport: team.sport,
      status: team.status,
      isAssigned:
        team.coaches.length > 0 &&
        team.coaches[0].isActive,
      isHeadCoach:
        team.coaches.length > 0 &&
        team.coaches[0].isActive &&
        team.coaches[0].isHeadCoach,
    })),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.COACH_ASSIGNMENTS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const body = await request.json();
  const teamId = String(body.teamId || "").trim();
  const isHeadCoach = Boolean(body.isHeadCoach);

  if (!teamId) {
    return NextResponse.json(
      { error: "Ekipi është i detyrueshëm." },
      { status: 400 }
    );
  }

  const [coach, team] = await Promise.all([
    prisma.coach.findFirst({
      where: {
        id: (await params).coachId,
        academyId: access.academyId,
      },
    }),
    prisma.team.findFirst({
      where: {
        id: teamId,
        academyId: access.academyId,
      },
    }),
  ]);

  if (!coach) {
    return NextResponse.json(
      { error: "Trajneri nuk u gjet." },
      { status: 404 }
    );
  }

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
          "Nuk ke leje për të menaxhuar këtë ekip.",
      },
      { status: 403 }
    );
  }

  const existing = await prisma.coachTeam.findUnique({
    where: {
      coachId_teamId: {
        coachId: coach.id,
        teamId: team.id,
      },
    },
  });

  if (existing) {
    if (existing.isActive) {
      return NextResponse.json(
        { error: "Trajneri është tashmë i lidhur me këtë ekip." },
        { status: 409 }
      );
    }

    const updated = await prisma.coachTeam.update({
      where: {
        id: existing.id,
      },
      data: {
        isActive: true,
        isHeadCoach,
        leftAt: null,
        assignedAt: new Date(),
      },
    });

    return NextResponse.json({
      assignment: updated,
    });
  }

  const assignment = await prisma.coachTeam.create({
    data: {
      coachId: coach.id,
      teamId: team.id,
      isHeadCoach,
    },
  });

  return NextResponse.json(
    { assignment },
    { status: 201 }
  );
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ coachId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.COACH_ASSIGNMENTS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const body = await request.json();
  const teamId = String(body.teamId || "").trim();

  if (!teamId) {
    return NextResponse.json(
      { error: "Ekipi është i detyrueshëm." },
      { status: 400 }
    );
  }

  const [coach, team] = await Promise.all([
    prisma.coach.findFirst({
      where: {
        id: (await params).coachId,
        academyId: access.academyId,
      },
    }),
    prisma.team.findFirst({
      where: {
        id: teamId,
        academyId: access.academyId,
      },
    }),
  ]);

  if (!coach || !team) {
    return NextResponse.json(
      { error: "Trajneri ose ekipi nuk u gjet." },
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
          "Nuk ke leje për të menaxhuar këtë ekip.",
      },
      { status: 403 }
    );
  }

  const assignment = await prisma.coachTeam.findUnique({
    where: {
      coachId_teamId: {
        coachId: coach.id,
        teamId: team.id,
      },
    },
  });

  if (!assignment || !assignment.isActive) {
    return NextResponse.json(
      { error: "Trajneri nuk është i lidhur me këtë ekip." },
      { status: 404 }
    );
  }

  await prisma.coachTeam.update({
    where: {
      id: assignment.id,
    },
    data: {
      isActive: false,
      isHeadCoach: false,
      leftAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
  });
}
