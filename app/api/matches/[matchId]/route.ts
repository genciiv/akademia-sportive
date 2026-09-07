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

  return (
    Number.isInteger(number) &&
    number >= 0
  );
}

export async function GET(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const match = await prisma.match.findFirst({
    where: {
      id: params.matchId,
      academyId: membership.academyId,
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

  if (!match) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    match,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const existing = await prisma.match.findFirst({
    where: {
      id: params.matchId,
      academyId: membership.academyId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const teamId =
    body.teamId === undefined
      ? existing.teamId
      : String(body.teamId || "").trim();

  if (!teamId) {
    return NextResponse.json(
      { error: "Ekipi është i detyrueshëm." },
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

  const opponentName =
    body.opponentName === undefined
      ? existing.opponentName
      : String(body.opponentName || "").trim();

  if (!opponentName) {
    return NextResponse.json(
      {
        error:
          "Emri i kundërshtarit është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  const matchType =
    body.matchType === undefined
      ? existing.matchType
      : String(body.matchType);

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

  const status =
    body.status === undefined
      ? existing.status
      : String(body.status);

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

  let startsAt = existing.startsAt;

  if (body.startsAt !== undefined) {
    const value = String(body.startsAt || "").trim();

    if (!value) {
      return NextResponse.json(
        {
          error:
            "Data dhe ora e ndeshjes janë të detyrueshme.",
        },
        { status: 400 }
      );
    }

    const parsed = new Date(value);

    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json(
        {
          error:
            "Data dhe ora e ndeshjes nuk janë të vlefshme.",
        },
        { status: 400 }
      );
    }

    startsAt = parsed;
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

  const ourScore =
    body.ourScore === undefined
      ? existing.ourScore
      : body.ourScore === "" ||
          body.ourScore === null
        ? null
        : Number(body.ourScore);

  const opponentScore =
    body.opponentScore === undefined
      ? existing.opponentScore
      : body.opponentScore === "" ||
          body.opponentScore === null
        ? null
        : Number(body.opponentScore);

  const match = await prisma.match.update({
    where: {
      id: existing.id,
    },
    data: {
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
      startsAt,
      location:
        body.location === undefined
          ? existing.location
          : String(body.location || "").trim() ||
            null,
      isHome:
        body.isHome === undefined
          ? existing.isHome
          : Boolean(body.isHome),
      ourScore,
      opponentScore,
      competitionName:
        body.competitionName === undefined
          ? existing.competitionName
          : String(
              body.competitionName || ""
            ).trim() || null,
      round:
        body.round === undefined
          ? existing.round
          : String(body.round || "").trim() ||
            null,
      description:
        body.description === undefined
          ? existing.description
          : String(
              body.description || ""
            ).trim() || null,
      notes:
        body.notes === undefined
          ? existing.notes
          : String(body.notes || "").trim() ||
            null,
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

  return NextResponse.json({
    match,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { matchId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const existing = await prisma.match.findFirst({
    where: {
      id: params.matchId,
      academyId: membership.academyId,
    },
    select: {
      id: true,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Ndeshja nuk u gjet." },
      { status: 404 }
    );
  }

  await prisma.match.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}