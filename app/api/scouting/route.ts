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

function vleresimOseNull(value: unknown, fieldName: string) {
  if (
    value === undefined ||
    value === null ||
    value === ""
  ) {
    return null;
  }

  const number = Number(value);

  if (
    !Number.isFinite(number) ||
    number < 1 ||
    number > 10
  ) {
    throw new Error(
      `${fieldName} duhet të jetë nga 1 deri në 10.`
    );
  }

  return number;
}

function tekstOseNull(value: unknown) {
  const text = String(value || "").trim();

  return text || null;
}

const STATUS_ALLOWED = [
  "NEW",
  "OBSERVING",
  "SHORTLISTED",
  "TRIAL",
  "REJECTED",
  "SIGNED",
] as const;

const PRIORITY_ALLOWED = [
  "LOW",
  "MEDIUM",
  "HIGH",
  "URGENT",
] as const;

const SPORT_ALLOWED = [
  "FOOTBALL",
  "BASKETBALL",
  "VOLLEYBALL",
  "TENNIS",
  "SWIMMING",
  "HANDBALL",
  "MARTIAL_ARTS",
  "ATHLETICS",
  "OTHER",
] as const;

const GENDER_ALLOWED = [
  "MALE",
  "FEMALE",
  "OTHER",
  "NOT_SPECIFIED",
] as const;

export async function GET(request: Request) {
  const membership =
    await merrAkademineAktive();

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

  const { searchParams } =
    new URL(request.url);

  const status =
    String(
      searchParams.get("status") || ""
    ).trim();

  const priority =
    String(
      searchParams.get("priority") || ""
    ).trim();

  const sport =
    String(
      searchParams.get("sport") || ""
    ).trim();

  const search =
    String(
      searchParams.get("search") || ""
    ).trim();

  if (
    status &&
    !STATUS_ALLOWED.includes(
      status as (typeof STATUS_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Statusi nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    priority &&
    !PRIORITY_ALLOWED.includes(
      priority as (typeof PRIORITY_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Prioriteti nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    sport &&
    !SPORT_ALLOWED.includes(
      sport as (typeof SPORT_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Sporti nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const candidates =
    await prisma.scoutingCandidate.findMany({
      where: {
        academyId:
          membership.academyId,

        ...(status
          ? {
              status:
                status as (typeof STATUS_ALLOWED)[number],
            }
          : {}),

        ...(priority
          ? {
              priority:
                priority as (typeof PRIORITY_ALLOWED)[number],
            }
          : {}),

        ...(sport
          ? {
              sport:
                sport as (typeof SPORT_ALLOWED)[number],
            }
          : {}),

        ...(search
          ? {
              OR: [
                {
                  firstName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  lastName: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  currentClub: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  position: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
                {
                  city: {
                    contains: search,
                    mode: "insensitive",
                  },
                },
              ],
            }
          : {}),
      },

      include: {
        observations: {
          orderBy: {
            observedAt: "desc",
          },
          take: 1,
        },
      },

      orderBy: [
        {
          priority: "desc",
        },
        {
          updatedAt: "desc",
        },
      ],
    });

  const summary =
    await prisma.scoutingCandidate.groupBy({
      by: ["status"],
      where: {
        academyId:
          membership.academyId,
      },
      _count: {
        _all: true,
      },
    });

  return NextResponse.json({
    candidates: candidates.map(
      (candidate) => ({
        ...candidate,

        technicalRating:
          candidate.technicalRating === null
            ? null
            : Number(
                candidate.technicalRating
              ),

        physicalRating:
          candidate.physicalRating === null
            ? null
            : Number(
                candidate.physicalRating
              ),

        tacticalRating:
          candidate.tacticalRating === null
            ? null
            : Number(
                candidate.tacticalRating
              ),

        mentalRating:
          candidate.mentalRating === null
            ? null
            : Number(
                candidate.mentalRating
              ),

        overallRating:
          candidate.overallRating === null
            ? null
            : Number(
                candidate.overallRating
              ),

        observations:
          candidate.observations.map(
            (observation) => ({
              ...observation,

              technicalRating:
                observation.technicalRating === null
                  ? null
                  : Number(
                      observation.technicalRating
                    ),

              physicalRating:
                observation.physicalRating === null
                  ? null
                  : Number(
                      observation.physicalRating
                    ),

              tacticalRating:
                observation.tacticalRating === null
                  ? null
                  : Number(
                      observation.tacticalRating
                    ),

              mentalRating:
                observation.mentalRating === null
                  ? null
                  : Number(
                      observation.mentalRating
                    ),

              overallRating:
                observation.overallRating === null
                  ? null
                  : Number(
                      observation.overallRating
                    ),
            })
          ),
      })
    ),

    summary: summary.reduce(
      (
        result,
        item
      ) => {
        result[item.status] =
          item._count._all;

        return result;
      },
      {} as Record<string, number>
    ),
  });
}

export async function POST(
  request: Request
) {
  const membership =
    await merrAkademineAktive();

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

  const body =
    await request.json();

  const firstName =
    String(
      body.firstName || ""
    ).trim();

  const lastName =
    String(
      body.lastName || ""
    ).trim();

  const sport =
    String(
      body.sport || ""
    ).trim();

  if (!firstName || !lastName) {
    return NextResponse.json(
      {
        error:
          "Emri dhe mbiemri janë të detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !SPORT_ALLOWED.includes(
      sport as (typeof SPORT_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Sporti është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const status =
    String(
      body.status || "NEW"
    ).trim();

  const priority =
    String(
      body.priority || "MEDIUM"
    ).trim();

  const gender =
    String(
      body.gender ||
        "NOT_SPECIFIED"
    ).trim();

  if (
    !STATUS_ALLOWED.includes(
      status as (typeof STATUS_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Statusi nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !PRIORITY_ALLOWED.includes(
      priority as (typeof PRIORITY_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Prioriteti nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !GENDER_ALLOWED.includes(
      gender as (typeof GENDER_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error: "Gjinia nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  let technicalRating:
    | number
    | null;

  let physicalRating:
    | number
    | null;

  let tacticalRating:
    | number
    | null;

  let mentalRating:
    | number
    | null;

  let overallRating:
    | number
    | null;

  try {
    technicalRating =
      vleresimOseNull(
        body.technicalRating,
        "Vlerësimi teknik"
      );

    physicalRating =
      vleresimOseNull(
        body.physicalRating,
        "Vlerësimi fizik"
      );

    tacticalRating =
      vleresimOseNull(
        body.tacticalRating,
        "Vlerësimi taktik"
      );

    mentalRating =
      vleresimOseNull(
        body.mentalRating,
        "Vlerësimi mental"
      );

    overallRating =
      vleresimOseNull(
        body.overallRating,
        "Vlerësimi i përgjithshëm"
      );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Vlerësimet nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  let dateOfBirth:
    | Date
    | null = null;

  if (body.dateOfBirth) {
    dateOfBirth =
      new Date(
        body.dateOfBirth
      );

    if (
      Number.isNaN(
        dateOfBirth.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Data e lindjes nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const candidate =
    await prisma.scoutingCandidate.create({
      data: {
        academyId:
          membership.academyId,

        firstName,
        lastName,

        dateOfBirth,

        gender:
          gender as (typeof GENDER_ALLOWED)[number],

        sport:
          sport as (typeof SPORT_ALLOWED)[number],

        position:
          tekstOseNull(
            body.position
          ),

        currentClub:
          tekstOseNull(
            body.currentClub
          ),

        nationality:
          tekstOseNull(
            body.nationality
          ),

        city:
          tekstOseNull(
            body.city
          ),

        email:
          tekstOseNull(
            body.email
          ),

        phone:
          tekstOseNull(
            body.phone
          ),

        guardianName:
          tekstOseNull(
            body.guardianName
          ),

        guardianPhone:
          tekstOseNull(
            body.guardianPhone
          ),

        guardianEmail:
          tekstOseNull(
            body.guardianEmail
          ),

        photo:
          tekstOseNull(
            body.photo
          ),

        status:
          status as (typeof STATUS_ALLOWED)[number],

        priority:
          priority as (typeof PRIORITY_ALLOWED)[number],

        technicalRating,
        physicalRating,
        tacticalRating,
        mentalRating,
        overallRating,

        strengths:
          tekstOseNull(
            body.strengths
          ),

        weaknesses:
          tekstOseNull(
            body.weaknesses
          ),

        notes:
          tekstOseNull(
            body.notes
          ),
      },
    });

  return NextResponse.json(
    {
      candidate: {
        ...candidate,

        technicalRating:
          candidate.technicalRating === null
            ? null
            : Number(
                candidate.technicalRating
              ),

        physicalRating:
          candidate.physicalRating === null
            ? null
            : Number(
                candidate.physicalRating
              ),

        tacticalRating:
          candidate.tacticalRating === null
            ? null
            : Number(
                candidate.tacticalRating
              ),

        mentalRating:
          candidate.mentalRating === null
            ? null
            : Number(
                candidate.mentalRating
              ),

        overallRating:
          candidate.overallRating === null
            ? null
            : Number(
                candidate.overallRating
              ),
      },
    },
    {
      status: 201,
    }
  );
}