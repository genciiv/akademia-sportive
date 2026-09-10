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
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const seasons = await prisma.academySeason.findMany({
    where: {
      academyId: membership.academyId,
    },
    orderBy: {
      startsAt: "desc",
    },
  });

  return NextResponse.json({
    seasons,
  });
}

export async function POST(
  request: Request
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const body = await request.json();

  const name =
    typeof body.name === "string"
      ? body.name.trim()
      : "";

  const startsAt = new Date(
    body.startsAt
  );

  const endsAt = new Date(
    body.endsAt
  );

  const isActive =
    body.isActive === true;

  if (!name) {
    return NextResponse.json(
      {
        error:
          "Emri i sezonit është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    Number.isNaN(
      startsAt.getTime()
    ) ||
    Number.isNaN(
      endsAt.getTime()
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Datat e sezonit nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    endsAt.getTime() <=
    startsAt.getTime()
  ) {
    return NextResponse.json(
      {
        error:
          "Data e përfundimit duhet të jetë pas datës së fillimit.",
      },
      {
        status: 400,
      }
    );
  }

  try {
    const season =
      await prisma.$transaction(
        async (tx) => {
          if (isActive) {
            await tx.academySeason.updateMany({
              where: {
                academyId:
                  membership.academyId,
                isActive: true,
              },
              data: {
                isActive: false,
              },
            });
          }

          return tx.academySeason.create({
            data: {
              academyId:
                membership.academyId,
              name,
              startsAt,
              endsAt,
              isActive,
            },
          });
        }
      );

    return NextResponse.json(
      {
        season,
      },
      {
        status: 201,
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          "Sezoni nuk mund të krijohej. Kontrollo nëse ekziston një sezon me të njëjtin emër.",
      },
      {
        status: 400,
      }
    );
  }
}