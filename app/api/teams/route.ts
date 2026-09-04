import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const SPORTET = [
  "FOOTBALL",
  "BASKETBALL",
  "VOLLEYBALL",
  "TENNIS",
  "SWIMMING",
  "HANDBALL",
  "MARTIAL_ARTS",
  "ATHLETICS",
  "OTHER",
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

  const [teams, branches] = await Promise.all([
    prisma.team.findMany({
      where: {
        academyId: membership.academyId,
      },
      include: {
        branch: true,
        _count: {
          select: {
            players: {
              where: {
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        name: "asc",
      },
    }),

    prisma.academyBranch.findMany({
      where: {
        academyId: membership.academyId,
        isActive: true,
      },
      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return NextResponse.json({
    teams,
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

  const name = String(body.name || "").trim();
  const sport = String(body.sport || "").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Emri i ekipit është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (!SPORTET.includes(sport as (typeof SPORTET)[number])) {
    return NextResponse.json(
      { error: "Sporti i zgjedhur nuk është i vlefshëm." },
      { status: 400 }
    );
  }

  if (body.branchId) {
    const branch = await prisma.academyBranch.findFirst({
      where: {
        id: String(body.branchId),
        academyId: membership.academyId,
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Dega e zgjedhur nuk është e vlefshme." },
        { status: 400 }
      );
    }
  }

  const ekziston = await prisma.team.findUnique({
    where: {
      academyId_name: {
        academyId: membership.academyId,
        name,
      },
    },
  });

  if (ekziston) {
    return NextResponse.json(
      { error: "Ekziston tashmë një ekip me këtë emër." },
      { status: 409 }
    );
  }

  const team = await prisma.team.create({
    data: {
      academyId: membership.academyId,
      branchId: body.branchId || null,
      name,
      sport: sport as (typeof SPORTET)[number],
      ageGroup: String(body.ageGroup || "").trim() || null,
      season: String(body.season || "").trim() || null,
      description: String(body.description || "").trim() || null,
      status: "ACTIVE",
    },
  });

  return NextResponse.json(
    { team },
    { status: 201 }
  );
}