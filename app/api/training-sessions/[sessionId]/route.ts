import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
  canAccessTrainingSession,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "SCHEDULED",
  "COMPLETED",
  "CANCELLED",
] as const;

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TRAINING_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const existing = await prisma.trainingSession.findFirst({
    where: {
      id: (await params).sessionId,
      academyId: academyId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }
  const hasSessionAccess =
    await canAccessTrainingSession(
      access,
      existing.id
    );

  if (!hasSessionAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë seancë.",
      },
      {
        status: 403,
      }
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

  if (!title || !teamId || !body.startsAt) {
    return NextResponse.json(
      { error: "Titulli, ekipi dhe fillimi janÃ« tÃ« detyrueshme." },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      { error: "Statusi i seancÃ«s nuk Ã«shtÃ« i vlefshÃ«m." },
      { status: 400 }
    );
  }

  const startsAt = new Date(body.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      { error: "Data e fillimit nuk Ã«shtÃ« e vlefshme." },
      { status: 400 }
    );
  }

  let endsAt: Date | null = null;

  if (body.endsAt) {
    endsAt = new Date(body.endsAt);

    if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return NextResponse.json(
        { error: "Ora e pÃ«rfundimit nuk Ã«shtÃ« e vlefshme." },
        { status: 400 }
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
        isActive: true,
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: "Dega nuk u gjet." },
        { status: 404 }
      );
    }
  }

  const updated = await prisma.trainingSession.update({
    where: {
      id: existing.id,
    },
    data: {
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

  return NextResponse.json({
    trainingSession: updated,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TRAINING_DELETE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const existing = await prisma.trainingSession.findFirst({
    where: {
      id: (await params).sessionId,
      academyId: academyId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }
  const hasSessionAccess =
    await canAccessTrainingSession(
      access,
      existing.id
    );

  if (!hasSessionAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë seancë.",
      },
      {
        status: 403,
      }
    );
  }

  await prisma.trainingSession.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
