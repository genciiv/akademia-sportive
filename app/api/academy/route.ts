import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "Duhet të jesh i identifikuar." },
      { status: 401 }
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Kërkesa nuk është e vlefshme." },
      { status: 400 }
    );
  }

  const name = String(body.name ?? "").trim();
  const city = String(body.city ?? "").trim();
  const country = String(body.country ?? "Shqipëri").trim();

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Emri i akademisë është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (
    name.length > 160 ||
    city.length > 120 ||
    country.length > 120
  ) {
    return NextResponse.json(
      { error: "Të dhënat e dërguara janë shumë të gjata." },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: {
      id: session.user.id,
    },
    select: {
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Përdoruesi nuk u gjet." },
      { status: 401 }
    );
  }

  const email = user.email.trim().toLowerCase();

  const existingMembership =
    await prisma.academyMembership.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      select: {
        id: true,
      },
    });

  if (existingMembership) {
    return NextResponse.json(
      { error: "Ke tashmë një akademi aktive." },
      { status: 409 }
    );
  }

  const application =
    await prisma.academyApplication.findFirst({
      where: {
        email,
        status: "APPROVED",
        consumedAt: null,
      },
      select: {
        id: true,
      },
      orderBy: {
        approvedAt: "desc",
      },
    });

  if (!application) {
    return NextResponse.json(
      {
        error:
          "Nuk ke një aplikim të aprovuar për krijimin e akademisë.",
      },
      { status: 403 }
    );
  }

  const baseSlug = krijoSlug(name) || "akademia";

  let slug = baseSlug;
  let number = 1;

  while (
    await prisma.academy.findUnique({
      where: {
        slug,
      },
      select: {
        id: true,
      },
    })
  ) {
    number += 1;
    slug = `${baseSlug}-${number}`;
  }

  try {
    const academy = await prisma.$transaction(async (tx) => {
      /*
       * Claim application atomically.
       * If another request has already consumed it, count = 0.
       */
      const claim =
        await tx.academyApplication.updateMany({
          where: {
            id: application.id,
            email,
            status: "APPROVED",
            consumedAt: null,
          },
          data: {
            consumedAt: new Date(),
          },
        });

      if (claim.count !== 1) {
        throw new Error("APPLICATION_ALREADY_CONSUMED");
      }

      const proPlan = await tx.plan.findUnique({
        where: {
          code: "PRO",
        },
        select: {
          id: true,
        },
      });

      if (!proPlan) {
        throw new Error("PRO_PLAN_NOT_FOUND");
      }

      const trialStartsAt = new Date();
      const trialEndsAt = new Date(trialStartsAt);

      trialEndsAt.setUTCDate(
        trialEndsAt.getUTCDate() + 7
      );

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

      await tx.academySubscription.create({
        data: {
          academyId: createdAcademy.id,
          planId: proPlan.id,
          status: "TRIALING",
          trialStartsAt,
          trialEndsAt,
        },
      });

      await tx.academyApplication.update({
        where: {
          id: application.id,
        },
        data: {
          createdAcademyId: createdAcademy.id,
        },
      });

      return createdAcademy;
    });

    return NextResponse.json({
      academy,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "APPLICATION_ALREADY_CONSUMED"
    ) {
      return NextResponse.json(
        {
          error:
            "Ky aplikim është përdorur tashmë për krijimin e një akademie.",
        },
        { status: 409 }
      );
    }

    if (
      error instanceof Error &&
      error.message === "PRO_PLAN_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Plani PRO nuk është konfiguruar. Kontakto administratorin.",
        },
        { status: 500 }
      );
    }

    console.error("Academy creation failed:", error);

    return NextResponse.json(
      {
        error:
          "Akademia nuk mund të krijohej. Provo përsëri.",
      },
      { status: 500 }
    );
  }
}