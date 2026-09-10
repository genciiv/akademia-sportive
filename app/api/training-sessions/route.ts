import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
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

export async function GET() {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId: membership.academyId,
        isActive: true,
      },
    });

  const sessions = await prisma.trainingSession.findMany({
    where: {
      academyId: membership.academyId,
      ...(activeSeason
        ? {
            startsAt: {
              gte: activeSeason.startsAt,
              lte: activeSeason.endsAt,
            },
          }
        : {}),
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
      coach: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
        },
      },
      _count: {
        select: {
          attendances: true,
        },
      },
    },
    orderBy: {
      startsAt: "asc",
    },
  });

  const teams = await prisma.team.findMany({
    where: {
      academyId: membership.academyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  const coaches = await prisma.coach.findMany({
    where: {
      academyId: membership.academyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  const branches = await prisma.academyBranch.findMany({
    where: {
      academyId: membership.academyId,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
    },
    orderBy: {
      name: "asc",
    },
  });

  return NextResponse.json({
    sessions,
    teams,
    coaches,
    branches,
  });
}

export async function POST(request: Request) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const title = String(body.title || "").trim();
  const teamId = String(body.teamId || "").trim();
  const coachId = String(body.coachId || "").trim() || null;
  const branchId = String(body.branchId || "").trim() || null;
  const location = String(body.location || "").trim() || null;
  const description = String(body.description || "").trim() || null;
  const notes = String(body.notes || "").trim() || null;
  const status = String(body.status || "SCHEDULED").trim();

  if (!title) {
    return NextResponse.json(
      { error: "Titulli i seancës është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (!teamId) {
    return NextResponse.json(
      { error: "Ekipi është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (!body.startsAt) {
    return NextResponse.json(
      {
        error:
          "Data dhe ora e fillimit janë të detyrueshme.",
      },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      {
        error:
          "Statusi i seancës nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const startsAt = new Date(body.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      {
        error:
          "Data e fillimit nuk është e vlefshme.",
      },
      { status: 400 }
    );
  }

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId: membership.academyId,
        isActive: true,
      },
    });

  if (
    activeSeason &&
    (
      startsAt < activeSeason.startsAt ||
      startsAt > activeSeason.endsAt
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Data e seancës duhet të jetë brenda sezonit aktiv.",
      },
      { status: 400 }
    );
  }

  let endsAt: Date | null = null;

  if (body.endsAt) {
    endsAt = new Date(body.endsAt);

    if (Number.isNaN(endsAt.getTime())) {
      return NextResponse.json(
        {
          error:
            "Data e përfundimit nuk është e vlefshme.",
        },
        { status: 400 }
      );
    }

    if (endsAt <= startsAt) {
      return NextResponse.json(
        {
          error:
            "Ora e përfundimit duhet të jetë pas fillimit.",
        },
        { status: 400 }
      );
    }

    if (
      activeSeason &&
      endsAt > activeSeason.endsAt
    ) {
      return NextResponse.json(
        {
          error:
            "Data e përfundimit duhet të jetë brenda sezonit aktiv.",
        },
        { status: 400 }
      );
    }
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      academyId: membership.academyId,
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }

  if (coachId) {
    const coach = await prisma.coach.findFirst({
      where: {
        id: coachId,
        academyId: membership.academyId,
      },
    });

    if (!coach) {
      return NextResponse.json(
        { error: "Trajneri nuk u gjet." },
        { status: 404 }
      );
    }
  }

  if (branchId) {
    const branch = await prisma.academyBranch.findFirst({
      where: {
        id: branchId,
        academyId: membership.academyId,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Dega nuk u gjet." },
        { status: 404 }
      );
    }
  }

  const trainingSession =
    await prisma.trainingSession.create({
      data: {
        academyId: membership.academyId,
        teamId,
        coachId,
        branchId,
        title,
        startsAt,
        endsAt,
        location,
        description,
        notes,
        status: status as (typeof STATUSET)[number],
      },
    });

  return NextResponse.json(
    { trainingSession },
    { status: 201 }
  );
}