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

  const coaches = await prisma.coach.findMany({
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
    include: {
      teams: {
        where: {
          isActive: true,
        },
        include: {
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [
      { lastName: "asc" },
      { firstName: "asc" },
    ],
  });

  return NextResponse.json({
    coaches,
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

  const coach = await prisma.coach.create({
    data: {
      academyId: membership.academyId,
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

  return NextResponse.json(
    { coach },
    { status: 201 }
  );
}