import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const GJINITE = [
  "MALE",
  "FEMALE",
  "OTHER",
  "NOT_SPECIFIED",
] as const;

const STATUSET = [
  "ACTIVE",
  "INACTIVE",
  "INJURED",
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
  { params }: { params: { playerId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: params.playerId,
      academyId: membership.academyId,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Sportisti nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Emri dhe mbiemri janë të detyrueshëm." },
      { status: 400 }
    );
  }

  const gender = String(body.gender || "NOT_SPECIFIED");
  const status = String(body.status || "ACTIVE");

  if (!GJINITE.includes(gender as (typeof GJINITE)[number])) {
    return NextResponse.json(
      { error: "Gjinia e zgjedhur nuk është e vlefshme." },
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

  let jerseyNumber: number | null = null;

  if (
    body.jerseyNumber !== undefined &&
    body.jerseyNumber !== null &&
    body.jerseyNumber !== ""
  ) {
    jerseyNumber = Number(body.jerseyNumber);

    if (
      !Number.isInteger(jerseyNumber) ||
      jerseyNumber < 0 ||
      jerseyNumber > 999
    ) {
      return NextResponse.json(
        { error: "Numri i fanellës nuk është i vlefshëm." },
        { status: 400 }
      );
    }
  }

  const updatedPlayer = await prisma.player.update({
    where: {
      id: player.id,
    },
    data: {
      firstName,
      lastName,
      dateOfBirth,
      gender: gender as (typeof GJINITE)[number],
      email: String(body.email || "").trim() || null,
      phone: String(body.phone || "").trim() || null,
      guardianName:
        String(body.guardianName || "").trim() || null,
      guardianPhone:
        String(body.guardianPhone || "").trim() || null,
      guardianEmail:
        String(body.guardianEmail || "").trim() || null,
      position: String(body.position || "").trim() || null,
      jerseyNumber,
      notes: String(body.notes || "").trim() || null,
      status: status as (typeof STATUSET)[number],
    },
  });

  return NextResponse.json({
    player: updatedPlayer,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { playerId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const player = await prisma.player.findFirst({
    where: {
      id: params.playerId,
      academyId: membership.academyId,
    },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Sportisti nuk u gjet." },
      { status: 404 }
    );
  }

  await prisma.player.delete({
    where: {
      id: player.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}