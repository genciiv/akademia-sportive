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

function tekstOseNull(value: unknown) {
  const text = String(value || "").trim();

  return text || null;
}

function vleresimOseNull(
  value: unknown,
  fieldName: string
) {
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

async function merrKandidatin(
  candidateId: string,
  academyId: string
) {
  return prisma.scoutingCandidate.findFirst({
    where: {
      id: candidateId,
      academyId,
    },
  });
}

function serializoKandidatin(
  candidate: Awaited<
    ReturnType<typeof merrKandidatin>
  >
) {
  if (!candidate) {
    return null;
  }

  return {
    ...candidate,

    technicalRating:
      candidate.technicalRating === null
        ? null
        : Number(candidate.technicalRating),

    physicalRating:
      candidate.physicalRating === null
        ? null
        : Number(candidate.physicalRating),

    tacticalRating:
      candidate.tacticalRating === null
        ? null
        : Number(candidate.tacticalRating),

    mentalRating:
      candidate.mentalRating === null
        ? null
        : Number(candidate.mentalRating),

    overallRating:
      candidate.overallRating === null
        ? null
        : Number(candidate.overallRating),
  };
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: {
      candidateId: string;
    };
  }
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

  const candidate =
    await prisma.scoutingCandidate.findFirst({
      where: {
        id: params.candidateId,
        academyId:
          membership.academyId,
      },

      include: {
        observations: {
          orderBy: {
            observedAt: "desc",
          },
        },
      },
    });

  if (!candidate) {
    return NextResponse.json(
      {
        error:
          "Kandidati nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
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

      observations:
        candidate.observations.map(
          (observation) => ({
            ...observation,

            technicalRating:
              observation.technicalRating ===
              null
                ? null
                : Number(
                    observation.technicalRating
                  ),

            physicalRating:
              observation.physicalRating ===
              null
                ? null
                : Number(
                    observation.physicalRating
                  ),

            tacticalRating:
              observation.tacticalRating ===
              null
                ? null
                : Number(
                    observation.tacticalRating
                  ),

            mentalRating:
              observation.mentalRating ===
              null
                ? null
                : Number(
                    observation.mentalRating
                  ),

            overallRating:
              observation.overallRating ===
              null
                ? null
                : Number(
                    observation.overallRating
                  ),
          })
        ),
    },
  });
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      candidateId: string;
    };
  }
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

  const existing =
    await merrKandidatin(
      params.candidateId,
      membership.academyId
    );

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Kandidati nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body =
    await request.json();

  const firstName =
    String(
      body.firstName ??
        existing.firstName
    ).trim();

  const lastName =
    String(
      body.lastName ??
        existing.lastName
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

  const sport =
    String(
      body.sport ??
        existing.sport
    ).trim();

  const status =
    String(
      body.status ??
        existing.status
    ).trim();

  const priority =
    String(
      body.priority ??
        existing.priority
    ).trim();

  const gender =
    String(
      body.gender ??
        existing.gender
    ).trim();

  if (
    !SPORT_ALLOWED.includes(
      sport as (typeof SPORT_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Sporti nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !STATUS_ALLOWED.includes(
      status as (typeof STATUS_ALLOWED)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi nuk është i vlefshëm.",
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
        error:
          "Prioriteti nuk është i vlefshëm.",
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
        error:
          "Gjinia nuk është e vlefshme.",
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
      body.technicalRating ===
      undefined
        ? existing.technicalRating ===
          null
          ? null
          : Number(
              existing.technicalRating
            )
        : vleresimOseNull(
            body.technicalRating,
            "Vlerësimi teknik"
          );

    physicalRating =
      body.physicalRating ===
      undefined
        ? existing.physicalRating ===
          null
          ? null
          : Number(
              existing.physicalRating
            )
        : vleresimOseNull(
            body.physicalRating,
            "Vlerësimi fizik"
          );

    tacticalRating =
      body.tacticalRating ===
      undefined
        ? existing.tacticalRating ===
          null
          ? null
          : Number(
              existing.tacticalRating
            )
        : vleresimOseNull(
            body.tacticalRating,
            "Vlerësimi taktik"
          );

    mentalRating =
      body.mentalRating ===
      undefined
        ? existing.mentalRating ===
          null
          ? null
          : Number(
              existing.mentalRating
            )
        : vleresimOseNull(
            body.mentalRating,
            "Vlerësimi mental"
          );

    overallRating =
      body.overallRating ===
      undefined
        ? existing.overallRating ===
          null
          ? null
          : Number(
              existing.overallRating
            )
        : vleresimOseNull(
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

  let dateOfBirth =
    existing.dateOfBirth;

  if (
    body.dateOfBirth !==
    undefined
  ) {
    if (
      body.dateOfBirth ===
        null ||
      body.dateOfBirth === ""
    ) {
      dateOfBirth = null;
    } else {
      const parsed =
        new Date(
          body.dateOfBirth
        );

      if (
        Number.isNaN(
          parsed.getTime()
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

      dateOfBirth = parsed;
    }
  }

  const candidate =
    await prisma.scoutingCandidate.update({
      where: {
        id: existing.id,
      },

      data: {
        firstName,
        lastName,

        dateOfBirth,

        gender:
          gender as (typeof GENDER_ALLOWED)[number],

        sport:
          sport as (typeof SPORT_ALLOWED)[number],

        position:
          body.position ===
          undefined
            ? existing.position
            : tekstOseNull(
                body.position
              ),

        currentClub:
          body.currentClub ===
          undefined
            ? existing.currentClub
            : tekstOseNull(
                body.currentClub
              ),

        nationality:
          body.nationality ===
          undefined
            ? existing.nationality
            : tekstOseNull(
                body.nationality
              ),

        city:
          body.city ===
          undefined
            ? existing.city
            : tekstOseNull(
                body.city
              ),

        email:
          body.email ===
          undefined
            ? existing.email
            : tekstOseNull(
                body.email
              ),

        phone:
          body.phone ===
          undefined
            ? existing.phone
            : tekstOseNull(
                body.phone
              ),

        guardianName:
          body.guardianName ===
          undefined
            ? existing.guardianName
            : tekstOseNull(
                body.guardianName
              ),

        guardianPhone:
          body.guardianPhone ===
          undefined
            ? existing.guardianPhone
            : tekstOseNull(
                body.guardianPhone
              ),

        guardianEmail:
          body.guardianEmail ===
          undefined
            ? existing.guardianEmail
            : tekstOseNull(
                body.guardianEmail
              ),

        photo:
          body.photo ===
          undefined
            ? existing.photo
            : tekstOseNull(
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
          body.strengths ===
          undefined
            ? existing.strengths
            : tekstOseNull(
                body.strengths
              ),

        weaknesses:
          body.weaknesses ===
          undefined
            ? existing.weaknesses
            : tekstOseNull(
                body.weaknesses
              ),

        notes:
          body.notes ===
          undefined
            ? existing.notes
            : tekstOseNull(
                body.notes
              ),
      },
    });

  return NextResponse.json({
    candidate:
      serializoKandidatin(
        candidate
      ),
  });
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: {
      candidateId: string;
    };
  }
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

  const candidate =
    await merrKandidatin(
      params.candidateId,
      membership.academyId
    );

  if (!candidate) {
    return NextResponse.json(
      {
        error:
          "Kandidati nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.scoutingCandidate.delete({
    where: {
      id: candidate.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}