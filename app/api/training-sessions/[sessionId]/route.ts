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

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const existing = await prisma.trainingSession.findFirst({
    where: {
      id: params.sessionId,
      academyId: membership.academyId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
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
      { error: "Titulli, ekipi dhe fillimi janë të detyrueshme." },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      { error: "Statusi i seancës nuk është i vlefshëm." },
      { status: 400 }
    );
  }

  const startsAt = new Date(body.startsAt);

  if (Number.isNaN(startsAt.getTime())) {
    return NextResponse.json(
      { error: "Data e fillimit nuk është e vlefshme." },
      { status: 400 }
    );
  }

  let endsAt: Date | null = null;

  if (body.endsAt) {
    endsAt = new Date(body.endsAt);

    if (Number.isNaN(endsAt.getTime()) || endsAt <= startsAt) {
      return NextResponse.json(
        { error: "Ora e përfundimit nuk është e vlefshme." },
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
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const existing = await prisma.trainingSession.findFirst({
    where: {
      id: params.sessionId,
      academyId: membership.academyId,
    },
  });

  if (!existing) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
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