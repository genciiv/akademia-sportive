import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function krijoSlug(emri: string) {
  return emri
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Duhet të jesh i identifikuar." },
      { status: 401 }
    );
  }

  const body = await request.json();

  const name = String(body.name || "").trim();
  const city = String(body.city || "").trim();
  const country = String(body.country || "Shqipëri").trim();

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Emri i akademisë është i detyrueshëm." },
      { status: 400 }
    );
  }

  const ekzistuese = await prisma.academyMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
  });

  if (ekzistuese) {
    return NextResponse.json(
      { error: "Ke tashmë një akademi aktive." },
      { status: 409 }
    );
  }

  const bazaSlug = krijoSlug(name) || "akademia";

  let slug = bazaSlug;
  let numer = 1;

  while (
    await prisma.academy.findUnique({
      where: { slug },
    })
  ) {
    numer++;
    slug = `${bazaSlug}-${numer}`;
  }

  const academy = await prisma.$transaction(async (tx) => {
    const createdAcademy = await tx.academy.create({
      data: {
        name,
        slug,
        city: city || null,
        country: country || null,
        ownerId: session.user.id,
        status: "TRIAL",
      },
    });

    await tx.academyMembership.create({
      data: {
        userId: session.user.id,
        academyId: createdAcademy.id,
        role: "OWNER",
        status: "ACTIVE",
      },
    });

    await tx.academyBranch.create({
      data: {
        academyId: createdAcademy.id,
        name: "Dega Kryesore",
        city: city || null,
        country: country || null,
      },
    });

    return createdAcademy;
  });

  return NextResponse.json({
    academy,
  });
}