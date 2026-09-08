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

async function merrVezhgimin(
  candidateId: string,
  observationId: string,
  academyId: string
) {
  return prisma.scoutingObservation.findFirst({
    where: {
      id: observationId,
      candidateId,
      candidate: {
        academyId,
      },
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

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      candidateId: string;
      observationId: string;
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

  const existing = await merrVezhgimin(
    params.candidateId,
    params.observationId,
    membership.academyId
  );

  if (!existing) {
    return NextResponse.json(
      {
        error: "Vëzhgimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const body = await request.json();

  let observedAt = existing.observedAt;

  if (body.observedAt !== undefined) {
    const parsed = new Date(body.observedAt);

    if (Number.isNaN(parsed.getTime())) {
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

    observedAt = parsed;
  }

  let technicalRating: number | null;
  let physicalRating: number | null;
  let tacticalRating: number | null;
  let mentalRating: number | null;
  let overallRating: number | null;

  try {
    technicalRating =
      body.technicalRating === undefined
        ? existing.technicalRating === null
          ? null
          : Number(existing.technicalRating)
        : vleresimOseNull(
            body.technicalRating,
            "Vlerësimi teknik"
          );

    physicalRating =
      body.physicalRating === undefined
        ? existing.physicalRating === null
          ? null
          : Number(existing.physicalRating)
        : vleresimOseNull(
            body.physicalRating,
            "Vlerësimi fizik"
          );

    tacticalRating =
      body.tacticalRating === undefined
        ? existing.tacticalRating === null
          ? null
          : Number(existing.tacticalRating)
        : vleresimOseNull(
            body.tacticalRating,
            "Vlerësimi taktik"
          );

    mentalRating =
      body.mentalRating === undefined
        ? existing.mentalRating === null
          ? null
          : Number(existing.mentalRating)
        : vleresimOseNull(
            body.mentalRating,
            "Vlerësimi mental"
          );

    overallRating =
      body.overallRating === undefined
        ? existing.overallRating === null
          ? null
          : Number(existing.overallRating)
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

  const observation =
    await prisma.scoutingObservation.update({
      where: {
        id: existing.id,
      },
      data: {
        observedAt,

        eventName:
          body.eventName === undefined
            ? existing.eventName
            : tekstOseNull(body.eventName),

        location:
          body.location === undefined
            ? existing.location
            : tekstOseNull(body.location),

        observerName:
          body.observerName === undefined
            ? existing.observerName
            : tekstOseNull(body.observerName),

        technicalRating,
        physicalRating,
        tacticalRating,
        mentalRating,
        overallRating,

        strengths:
          body.strengths === undefined
            ? existing.strengths
            : tekstOseNull(body.strengths),

        weaknesses:
          body.weaknesses === undefined
            ? existing.weaknesses
            : tekstOseNull(body.weaknesses),

        notes:
          body.notes === undefined
            ? existing.notes
            : tekstOseNull(body.notes),
      },
    });

  return NextResponse.json({
    observation:
      serializoVezhgimin(observation),
  });
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: {
      candidateId: string;
      observationId: string;
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

  const observation = await merrVezhgimin(
    params.candidateId,
    params.observationId,
    membership.academyId
  );

  if (!observation) {
    return NextResponse.json(
      {
        error: "Vëzhgimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.scoutingObservation.delete({
    where: {
      id: observation.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}