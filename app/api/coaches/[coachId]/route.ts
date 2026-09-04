import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "LEFT",
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
  { params }: { params: { coachId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const coach = await prisma.coach.findFirst({
    where: {
      id: params.coachId,
      academyId: membership.academyId,
    },
  });

  if (!coach) {
    return NextResponse.json(
      { error: "Trajneri nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();
  const status = String(body.status || "ACTIVE").trim();

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Emri dhe mbiemri janë të detyrueshëm." },
      { status: 400 }
    );
  }

  if (!STATUSET.includes(status as (typeof STATUSET)[number])) {
    return NextResponse.json(
      { error: "Statusi i zgjedhur nuk është i vlefshëm." },
      { status: 400 }
    );
  }

  let dateOfBirth: Date | null = null;

  if (body.dateOfBirth) {
    dateOfBirth = new Date(body.dateOfBirth);

    if (Number.isNaN(dateOfBirth.getTime())) {
      return NextResponse.json(
        { error: "Datëlindja nuk është e vlefshme." },
        { status: 400 }
      );
    }
  }

  const updatedCoach = await prisma.coach.update({
    where: {
      id: coach.id,
    },
    data: {
      firstName,
      lastName,
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      dateOfBirth,
      specialization:
        String(body.specialization || "").trim() || null,
      license:
        String(body.license || "").trim() || null,
      notes:
        String(body.notes || "").trim() || null,
      status: status as (typeof STATUSET)[number],
    },
  });

  return NextResponse.json({
    coach: updatedCoach,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { coachId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const coach = await prisma.coach.findFirst({
    where: {
      id: params.coachId,
      academyId: membership.academyId,
    },
  });

  if (!coach) {
    return NextResponse.json(
      { error: "Trajneri nuk u gjet." },
      { status: 404 }
    );
  }

  await prisma.coach.delete({
    where: {
      id: coach.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}