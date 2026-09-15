import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const VESHTIRESITE = ["EASY", "MEDIUM", "HARD"] as const;


export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.DRILLS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const drills = await prisma.drill.findMany({
    where: {
      academyId: access.academyId,
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
  const access =
    await requireAcademyPermission(
      PERMISSIONS.DRILLS_CREATE
    );

  if (!access.ok) {
    return access.response;
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
      academyId: access.academyId,
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
