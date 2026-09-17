import { prisma } from "@/lib/prisma";

export type FacilityConflictSource =
  | "TRAINING"
  | "MATCH";

export type FacilityConflict = {
  source: FacilityConflictSource;
  id: string;
  title: string;
  startsAt: Date;
  endsAt: Date;
};

export type FacilityAvailabilityResult =
  | {
      ok: true;
      facility: {
        id: string;
        name: string;
      };
    }
  | {
      ok: false;
      status: 400 | 404 | 409;
      error: string;
      conflict?: FacilityConflict;
    };

type CheckFacilityAvailabilityInput = {
  academyId: string;
  facilityId: string;
  startsAt: Date;
  endsAt: Date;
  excludeTrainingSessionId?: string;
  excludeMatchId?: string;
};

export async function checkFacilityAvailability({
  academyId,
  facilityId,
  startsAt,
  endsAt,
  excludeTrainingSessionId,
  excludeMatchId,
}: CheckFacilityAvailabilityInput): Promise<FacilityAvailabilityResult> {
  if (endsAt <= startsAt) {
    return {
      ok: false,
      status: 400,
      error:
        "Ora e përfundimit duhet të jetë pas orës së fillimit.",
    };
  }

  const facility = await prisma.facility.findFirst({
    where: {
      id: facilityId,
      academyId,
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!facility) {
    return {
      ok: false,
      status: 404,
      error: "Ambienti nuk u gjet në këtë akademi.",
    };
  }

  if (facility.status === "MAINTENANCE") {
    return {
      ok: false,
      status: 409,
      error:
        "Ambienti është në mirëmbajtje dhe nuk mund të rezervohet.",
    };
  }

  if (facility.status !== "ACTIVE") {
    return {
      ok: false,
      status: 409,
      error:
        "Ambienti nuk është aktiv dhe nuk mund të rezervohet.",
    };
  }

  const [trainingConflict, matchConflict] =
    await Promise.all([
      prisma.trainingSession.findFirst({
        where: {
          academyId,
          facilityId,
          status: {
            not: "CANCELLED",
          },
          startsAt: {
            lt: endsAt,
          },
          endsAt: {
            gt: startsAt,
          },
          ...(excludeTrainingSessionId
            ? {
                id: {
                  not: excludeTrainingSessionId,
                },
              }
            : {}),
        },
        select: {
          id: true,
          title: true,
          startsAt: true,
          endsAt: true,
          team: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startsAt: "asc",
        },
      }),

      prisma.match.findFirst({
        where: {
          academyId,
          facilityId,
          status: {
            notIn: [
              "CANCELLED",
              "POSTPONED",
            ],
          },
          startsAt: {
            lt: endsAt,
          },
          endsAt: {
            gt: startsAt,
          },
          ...(excludeMatchId
            ? {
                id: {
                  not: excludeMatchId,
                },
              }
            : {}),
        },
        select: {
          id: true,
          opponentName: true,
          startsAt: true,
          endsAt: true,
          team: {
            select: {
              name: true,
            },
          },
        },
        orderBy: {
          startsAt: "asc",
        },
      }),
    ]);

  const conflicts: FacilityConflict[] = [];

  if (trainingConflict?.endsAt) {
    conflicts.push({
      source: "TRAINING",
      id: trainingConflict.id,
      title: `${trainingConflict.team.name} - ${trainingConflict.title}`,
      startsAt: trainingConflict.startsAt,
      endsAt: trainingConflict.endsAt,
    });
  }

  if (matchConflict?.endsAt) {
    conflicts.push({
      source: "MATCH",
      id: matchConflict.id,
      title: `${matchConflict.team.name} - ${matchConflict.opponentName}`,
      startsAt: matchConflict.startsAt,
      endsAt: matchConflict.endsAt,
    });
  }

  conflicts.sort(
    (a, b) =>
      a.startsAt.getTime() -
      b.startsAt.getTime()
  );

  const conflict = conflicts[0];

  if (conflict) {
    return {
      ok: false,
      status: 409,
      error:
        "Ambienti është i rezervuar në këtë interval.",
      conflict,
    };
  }

  return {
    ok: true,
    facility: {
      id: facility.id,
      name: facility.name,
    },
  };
}