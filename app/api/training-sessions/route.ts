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
import { checkFacilityAvailability } from "@/lib/facility-scheduling";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TRAINING_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId: academyId,
        isActive: true,
      },
    });

  const teamScope =
    await getActiveTeamScope(access);

  const sessions = await prisma.trainingSession.findMany({
    where: {
      academyId: academyId,
      ...(teamScope.isScoped
        ? {
            teamId: {
              in: teamScope.teamIds,
            },
          }
        : {}),
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
      facility: {
        select: {
          id: true,
          name: true,
          type: true,
          status: true,
          isIndoor: true,
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
      academyId: academyId,
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
      academyId: academyId,
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
      academyId: academyId,
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

  const facilities = await prisma.facility.findMany({
    where: {
      academyId: academyId,
    },
    select: {
      id: true,
      name: true,
      type: true,
      status: true,
      isIndoor: true,
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
    facilities,
  });
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TRAINING_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const body = await request.json();

  const title = String(body.title || "").trim();
  const teamId = String(body.teamId || "").trim();
  const coachId = String(body.coachId || "").trim() || null;
  const branchId = String(body.branchId || "").trim() || null;
  const facilityId = String(body.facilityId || "").trim() || null;
  const location = facilityId ? null : String(body.location || "").trim() || null;
  const description = String(body.description || "").trim() || null;
  const notes = String(body.notes || "").trim() || null;
  const status = String(body.status || "SCHEDULED").trim();

  if (!title) {
    return NextResponse.json(
      { error: "Titulli i seancÃ«s Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  if (!teamId) {
    return NextResponse.json(
      { error: "Ekipi Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  if (!body.startsAt) {
    return NextResponse.json(
      {
        error:
          "Data dhe ora e fillimit janÃ« tÃ« detyrueshme.",
      },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      {
        error:
          "Statusi i seancÃ«s nuk Ã«shtÃ« i vlefshÃ«m.",
      },
      { status: 400 }
    );
  }

  const startsAt = new Date(body.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      {
        error:
          "Data e fillimit nuk Ã«shtÃ« e vlefshme.",
      },
      { status: 400 }
    );
  }

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId: academyId,
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
          "Data e seancÃ«s duhet tÃ« jetÃ« brenda sezonit aktiv.",
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
            "Data e pÃ«rfundimit nuk Ã«shtÃ« e vlefshme.",
        },
        { status: 400 }
      );
    }

    if (endsAt <= startsAt) {
      return NextResponse.json(
        {
          error:
            "Ora e pÃ«rfundimit duhet tÃ« jetÃ« pas fillimit.",
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
            "Data e pÃ«rfundimit duhet tÃ« jetÃ« brenda sezonit aktiv.",
        },
        { status: 400 }
      );
    }
  }

  if (facilityId && !endsAt) {
    return NextResponse.json(
      {
        error:
          "Ora e përfundimit është e detyrueshme kur zgjidhet një ambient.",
      },
      { status: 400 }
    );
  }

  if (facilityId && endsAt) {
    const availability =
      await checkFacilityAvailability({
        academyId,
        facilityId,
        startsAt,
        endsAt,
      });

    if (!availability.ok) {
      return NextResponse.json(
        {
          error: availability.error,
          conflict: availability.conflict ?? null,
        },
        { status: availability.status }
      );
    }
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      academyId: academyId,
    },
  });

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

  if (coachId) {
    const coach = await prisma.coach.findFirst({
      where: {
        id: coachId,
        academyId: academyId,
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
        academyId: academyId,
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
        academyId: academyId,
        teamId,
        coachId,
        branchId,
        facilityId,
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
