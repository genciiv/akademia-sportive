import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

  const activeSeason = await prisma.academySeason.findFirst({
    where: {
      academyId: membership.academyId,
      isActive: true,
    },
  });

  const players = await prisma.player.findMany({
    where: {
      academyId: membership.academyId,
      ...(activeSeason
        ? {
            teams: {
              some: {
                isActive: true,
                team: {
                  academyId: membership.academyId,
                  season: activeSeason.name,
                  status: "ACTIVE",
                },
              },
            },
          }
        : {}),
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return NextResponse.json({ players });
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

  const firstName = String(body.firstName || "").trim();
  const lastName = String(body.lastName || "").trim();

  if (!firstName || !lastName) {
    return NextResponse.json(
      { error: "Emri dhe mbiemri janë të detyrueshëm." },
      { status: 400 }
    );
  }

  const player = await prisma.player.create({
    data: {
      academyId: membership.academyId,
      firstName,
      lastName,
      dateOfBirth: body.dateOfBirth
        ? new Date(body.dateOfBirth)
        : null,
      gender: body.gender || "NOT_SPECIFIED",
      email: body.email || null,
      phone: body.phone || null,
      guardianName: body.guardianName || null,
      guardianPhone: body.guardianPhone || null,
      guardianEmail: body.guardianEmail || null,
      position: body.position || null,
      jerseyNumber:
        body.jerseyNumber !== undefined &&
        body.jerseyNumber !== null &&
        body.jerseyNumber !== ""
          ? Number(body.jerseyNumber)
          : null,
      notes: body.notes || null,
      status: body.status || "ACTIVE",
    },
  });

  return NextResponse.json(
    { player },
    { status: 201 }
  );
}