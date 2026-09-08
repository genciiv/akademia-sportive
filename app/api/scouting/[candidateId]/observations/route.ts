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

async function merrKandidatin(
  candidateId: string,
  academyId: string
) {
  return prisma.scoutingCandidate.findFirst({
    where: {
      id: candidateId,
      academyId,
    },
    select: {
      id: true,
    },
  });
}

function serializoVezhgimin<T extends {
  technicalRating: unknown;
  physicalRating: unknown;
  tacticalRating: unknown;
  mentalRating: unknown;
  overallRating: unknown;
}>(observation: T) {
  return {
    ...observation,

    technicalRating:
      observation.technicalRating === null
        ? null
        : Number(observation.technicalRating),

    physicalRating:
      observation.physicalRating === null
        ? null
        : Number(observation.physicalRating),

    tacticalRating:
      observation.tacticalRating === null
        ? null
        : Number(observation.tacticalRating),

    mentalRating:
      observation.mentalRating === null
        ? null
        : Number(observation.mentalRating),

    overallRating:
      observation.overallRating === null
        ? null
        : Number(observation.overallRating),
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

  const candidate = await merrKandidatin(
    params.candidateId,
    membership.academyId
  );

  if (!candidate) {
    return NextResponse.json(
      {
        error: "Kandidati nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const observations =
    await prisma.scoutingObservation.findMany({
      where: {
        candidateId: candidate.id,
      },
      orderBy: {
        observedAt: "desc",
      },
    });

  return NextResponse.json({
    observations: observations.map(
      serializoVezhgimin
    ),
  });
}

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: {
      candidateId: string;
    };
  }
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

  const candidate = await merrKandidatin(
    params.candidateId,
    membership.academyId
  );

  if (!candidate) {
    return NextResponse.json(
      {
        error: "Kandidati nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body = await request.json();

  let observedAt = new Date();

  if (body.observedAt) {
    observedAt = new Date(body.observedAt);

    if (
      Number.isNaN(
        observedAt.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Data e vëzhgimit nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }
  }

  let technicalRating: number | null;
  let physicalRating: number | null;
  let tacticalRating: number | null;
  let mentalRating: number | null;
  let overallRating: number | null;

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

  const observation =
    await prisma.scoutingObservation.create({
      data: {
        candidateId: candidate.id,
        observedAt,

        eventName:
          tekstOseNull(
            body.eventName
          ),

        location:
          tekstOseNull(
            body.location
          ),

        observerName:
          tekstOseNull(
            body.observerName
          ),

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
      observation:
        serializoVezhgimin(
          observation
        ),
    },
    {
      status: 201,
    }
  );
}