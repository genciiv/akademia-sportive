import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
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

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ teamId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await prisma.team.findFirst({
    where: {
      id: (await params).teamId,
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
          "Nuk ke leje pÃ«r tÃ« aksesuar kÃ«tÃ« ekip.",
      },
      {
        status: 403,
      }
    );
  }

  const body = await request.json();

  const name = String(body.name || "").trim();
  const sport = String(body.sport || "").trim();
  const status = String(body.status || "ACTIVE").trim();

  if (!name) {
    return NextResponse.json(
      { error: "Emri i ekipit Ã«shtÃ« i detyrueshÃ«m." },
      { status: 400 }
    );
  }

  if (!SPORTET.includes(sport as (typeof SPORTET)[number])) {
    return NextResponse.json(
      { error: "Sporti i zgjedhur nuk Ã«shtÃ« i vlefshÃ«m." },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      { error: "Statusi i zgjedhur nuk Ã«shtÃ« i vlefshÃ«m." },
      { status: 400 }
    );
  }

  if (body.branchId) {
    const branch = await prisma.academyBranch.findFirst({
      where: {
        id: String(body.branchId),
        academyId: academyId,
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Dega e zgjedhur nuk Ã«shtÃ« e vlefshme." },
        { status: 400 }
      );
    }
  }

  const duplicate = await prisma.team.findFirst({
    where: {
      academyId: academyId,
      name,
      id: {
        not: team.id,
      },
    },
  });

  if (duplicate) {
    return NextResponse.json(
      { error: "Ekziston tashmÃ« njÃ« ekip me kÃ«tÃ« emÃ«r." },
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
  { params }: { params: Promise<{ teamId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_DELETE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const team = await prisma.team.findFirst({
    where: {
      id: (await params).teamId,
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
          "Nuk ke leje pÃ«r tÃ« aksesuar kÃ«tÃ« ekip.",
      },
      {
        status: 403,
      }
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
