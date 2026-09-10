import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
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

  const matches = await prisma.match.findMany({
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
          sport: true,
          ageGroup: true,
          season: true,
        },
      },
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  return NextResponse.json({
    matches,
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

  const teamId = String(body.teamId || "").trim();

  const opponentName = String(
    body.opponentName || ""
  ).trim();

  const startsAt = String(
    body.startsAt || ""
  ).trim();

  const location =
    String(body.location || "").trim() || null;

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
      academyId: membership.academyId,
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
      academyId: membership.academyId,
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
    },
  });

  return NextResponse.json(
    { match },
    { status: 201 }
  );
}