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

const MATCH_TYPES = [
  "FRIENDLY",
  "LEAGUE",
  "CUP",
  "TOURNAMENT",
  "OTHER",
] as const;

const MATCH_STATUSES = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
  "POSTPONED",
] as const;

function rezultatValid(value: unknown) {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return true;
  }

  const number = Number(value);

  return Number.isInteger(number) && number >= 0;
}

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.MATCHES_VIEW
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

  const matches = await prisma.match.findMany({
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
          sport: true,
          ageGroup: true,
          season: true,
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
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  const facilities = await prisma.facility.findMany({
    where: {
      academyId,
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
    matches,
    facilities,
  });
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.MATCHES_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const body = await request.json();

  const teamId = String(body.teamId || "").trim();

  const opponentName = String(
    body.opponentName || ""
  ).trim();

  const startsAt = String(
    body.startsAt || ""
  ).trim();

  const endsAt =
    String(body.endsAt || "").trim();

  const facilityId =
    String(body.facilityId || "").trim() || null;

  const location = facilityId
    ? null
    : String(body.location || "").trim() || null;

  const competitionName =
    String(body.competitionName || "").trim() ||
    null;

  const round =
    String(body.round || "").trim() || null;

  const description =
    String(body.description || "").trim() || null;

  const notes =
    String(body.notes || "").trim() || null;

  const matchType = String(
    body.matchType || "FRIENDLY"
  );

  const status = String(
    body.status || "SCHEDULED"
  );

  const isHome =
    body.isHome === undefined
      ? true
      : Boolean(body.isHome);

  if (!teamId) {
    return NextResponse.json(
      { error: "Ekipi është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (!opponentName) {
    return NextResponse.json(
      {
        error:
          "Emri i kundërshtarit është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  if (!startsAt) {
    return NextResponse.json(
      {
        error:
          "Data dhe ora e ndeshjes janë të detyrueshme.",
      },
      { status: 400 }
    );
  }

  const startsAtDate = new Date(startsAt);

  if (Number.isNaN(startsAtDate.getTime())) {
    return NextResponse.json(
      {
        error:
          "Data dhe ora e ndeshjes nuk janë të vlefshme.",
      },
      { status: 400 }
    );
  }

  let endsAtDate: Date | null = null;

  if (endsAt) {
    endsAtDate = new Date(endsAt);

    if (Number.isNaN(endsAtDate.getTime())) {
      return NextResponse.json(
        {
          error:
            "Data dhe ora e përfundimit nuk janë të vlefshme.",
        },
        { status: 400 }
      );
    }

    if (endsAtDate <= startsAtDate) {
      return NextResponse.json(
        {
          error:
            "Ora e përfundimit duhet të jetë pas fillimit.",
        },
        { status: 400 }
      );
    }
  }

  if (facilityId && !endsAtDate) {
    return NextResponse.json(
      {
        error:
          "Ora e përfundimit është e detyrueshme kur zgjidhet një ambient.",
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
      startsAtDate < activeSeason.startsAt ||
      startsAtDate > activeSeason.endsAt
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Data e ndeshjes duhet të jetë brenda sezonit aktiv.",
      },
      { status: 400 }
    );
  }

  if (
    !MATCH_TYPES.includes(
      matchType as (typeof MATCH_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Lloji i ndeshjes nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  if (
    !MATCH_STATUSES.includes(
      status as (typeof MATCH_STATUSES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi i ndeshjes nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  if (facilityId && endsAtDate) {
    const availability =
      await checkFacilityAvailability({
        academyId,
        facilityId,
        startsAt: startsAtDate,
        endsAt: endsAtDate,
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

  if (
    !rezultatValid(body.ourScore) ||
    !rezultatValid(body.opponentScore)
  ) {
    return NextResponse.json(
      {
        error:
          "Rezultati duhet të jetë numër i plotë zero ose pozitiv.",
      },
      { status: 400 }
    );
  }

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      academyId: academyId,
    },
    select: {
      id: true,
    },
  });

  if (!team) {
    return NextResponse.json(
      {
        error:
          "Ekipi nuk u gjet në këtë akademi.",
      },
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
      { status: 403 }
    );
  }

  const ourScore =
    body.ourScore === "" ||
    body.ourScore === null ||
    body.ourScore === undefined
      ? null
      : Number(body.ourScore);

  const opponentScore =
    body.opponentScore === "" ||
    body.opponentScore === null ||
    body.opponentScore === undefined
      ? null
      : Number(body.opponentScore);

  const match = await prisma.match.create({
    data: {
      academyId: academyId,
      teamId: team.id,
      opponentName,
      matchType: matchType as
        | "FRIENDLY"
        | "LEAGUE"
        | "CUP"
        | "TOURNAMENT"
        | "OTHER",
      status: status as
        | "SCHEDULED"
        | "COMPLETED"
        | "CANCELLED"
        | "POSTPONED",
      startsAt: startsAtDate,
      endsAt: endsAtDate,
      facilityId,
      location,
      isHome,
      ourScore,
      opponentScore,
      competitionName,
      round,
      description,
      notes,
    },
    include: {
      team: {
        select: {
          id: true,
          name: true,
          sport: true,
          ageGroup: true,
          season: true,
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
    },
  });

  return NextResponse.json(
    { match },
    { status: 201 }
  );
}
