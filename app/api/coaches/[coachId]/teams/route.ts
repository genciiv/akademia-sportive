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

export async function GET(
  request: Request,
  { params }: { params: { coachId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const coach = await prisma.coach.findFirst({
    where: {
      id: params.coachId,
      academyId: membership.academyId,
    },
  });

  if (!coach) {
    return NextResponse.json(
      { error: "Trajneri nuk u gjet." },
      { status: 404 }
    );
  }

  const teams = await prisma.team.findMany({
    where: {
      academyId: membership.academyId,
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
  { params }: { params: { coachId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
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
        id: params.coachId,
        academyId: membership.academyId,
      },
    }),
    prisma.team.findFirst({
      where: {
        id: teamId,
        academyId: membership.academyId,
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
  { params }: { params: { coachId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
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
        id: params.coachId,
        academyId: membership.academyId,
      },
    }),
    prisma.team.findFirst({
      where: {
        id: teamId,
        academyId: membership.academyId,
      },
    }),
  ]);

  if (!coach || !team) {
    return NextResponse.json(
      { error: "Trajneri ose ekipi nuk u gjet." },
      { status: 404 }
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