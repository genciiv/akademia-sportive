import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VESHTIRESITE = ["EASY", "MEDIUM", "HARD"] as const;

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

  const drills = await prisma.drill.findMany({
    where: {
      academyId: membership.academyId,
    },
    orderBy: [
      { isActive: "desc" },
      { name: "asc" },
    ],
  });

  return NextResponse.json({
    drills,
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
  const category = String(body.category || "").trim() || null;
  const sport = String(body.sport || "").trim() || null;
  const objective = String(body.objective || "").trim() || null;
  const equipment = String(body.equipment || "").trim() || null;
  const description = String(body.description || "").trim() || null;
  const notes = String(body.notes || "").trim() || null;

  const difficulty = String(body.difficulty || "MEDIUM").trim();

  const durationMin =
    body.durationMin === "" ||
    body.durationMin === null ||
    body.durationMin === undefined
      ? null
      : Number(body.durationMin);

  const isActive =
    body.isActive === undefined
      ? true
      : Boolean(body.isActive);

  if (!name) {
    return NextResponse.json(
      { error: "Emri i ushtrimit është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (
    !VESHTIRESITE.includes(
      difficulty as (typeof VESHTIRESITE)[number]
    )
  ) {
    return NextResponse.json(
      { error: "Niveli i vështirësisë nuk është i vlefshëm." },
      { status: 400 }
    );
  }

  if (
    durationMin !== null &&
    (!Number.isInteger(durationMin) || durationMin <= 0)
  ) {
    return NextResponse.json(
      { error: "Kohëzgjatja duhet të jetë numër i plotë pozitiv." },
      { status: 400 }
    );
  }

  const drill = await prisma.drill.create({
    data: {
      academyId: membership.academyId,
      name,
      category,
      sport,
      objective,
      durationMin,
      difficulty:
        difficulty as (typeof VESHTIRESITE)[number],
      equipment,
      description,
      notes,
      isActive,
    },
  });

  return NextResponse.json(
    { drill },
    { status: 201 }
  );
}