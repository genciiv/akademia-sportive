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

const STATUSET = [
  "ACTIVE",
  "INACTIVE",
  "ARCHIVED",
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

export async function PATCH(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const team = await prisma.team.findFirst({
    where: {
      id: params.teamId,
      academyId: membership.academyId,
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const name = String(body.name || "").trim();
  const sport = String(body.sport || "").trim();
  const status = String(body.status || "ACTIVE").trim();

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

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      { error: "Statusi i zgjedhur nuk është i vlefshëm." },
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

  const duplicate = await prisma.team.findFirst({
    where: {
      academyId: membership.academyId,
      name,
      id: {
        not: team.id,
      },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Ekziston tashmë një ekip me këtë emër." },
      { status: 409 }
    );
  }

  const updatedTeam = await prisma.team.update({
    where: {
      id: team.id,
    },
    data: {
      name,
      sport: sport as (typeof SPORTET)[number],
      branchId: body.branchId || null,
      ageGroup: String(body.ageGroup || "").trim() || null,
      season: String(body.season || "").trim() || null,
      description: String(body.description || "").trim() || null,
      status: status as (typeof STATUSET)[number],
    },
  });

  return NextResponse.json({
    team: updatedTeam,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { teamId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const team = await prisma.team.findFirst({
    where: {
      id: params.teamId,
      academyId: membership.academyId,
    },
  });

  if (!team) {
    return NextResponse.json(
      { error: "Ekipi nuk u gjet." },
      { status: 404 }
    );
  }

  await prisma.team.delete({
    where: {
      id: team.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}