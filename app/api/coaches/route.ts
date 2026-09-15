import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const STATUSET = [
  "ACTIVE",
  "INACTIVE",
  "SUSPENDED",
  "LEFT",
] as const;

type CoachStatusValue =
  (typeof STATUSET)[number];

const COACHING_ROLES = [
  "HEAD_COACH",
  "COACH",
  "ASSISTANT_COACH",
] as const;

function staffStatusFromCoach(
  status: CoachStatusValue
) {
  if (status === "ACTIVE") {
    return "ACTIVE" as const;
  }

  if (status === "LEFT") {
    return "LEFT" as const;
  }

  return "INACTIVE" as const;
}

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.COACHES_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const teamScope =
    await getActiveTeamScope(access);

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId:
          access.academyId,
        isActive: true,
      },
    });

  const coaches =
    await prisma.coach.findMany({
      where: {
        academyId:
          access.academyId,
              ...(teamScope.isScoped
          ? {
              teams: {
                some: {
                  isActive: true,
                  teamId: {
                    in: teamScope.teamIds,
                  },
                },
              },
            }
          : {}),
      },

      include: {
        teams: {
          where: {
            isActive: true,

                        ...(teamScope.isScoped
              ? {
                  teamId: {
                    in: teamScope.teamIds,
                  },
                }
              : {}),
...(activeSeason
              ? {
                  team: {
                    academyId:
                      access.academyId,
                    season:
                      activeSeason.name,
                    status:
                      "ACTIVE",
                  },
                }
              : {}),
          },

          include: {
            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },

        staff: {
          select: {
            id: true,
            role: true,
            status: true,
            membershipId: true,
          },
        },
      },

      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    });

  return NextResponse.json({
    coaches,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.COACHES_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  let body: Record<
    string,
    unknown
  >;

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Të dhënat e dërguara nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const firstName =
    String(
      body.firstName || ""
    ).trim();

  const lastName =
    String(
      body.lastName || ""
    ).trim();

  const email =
    String(
      body.email || ""
    )
      .trim()
      .toLowerCase() ||
    null;

  const phone =
    String(
      body.phone || ""
    ).trim() ||
    null;

  const status =
    String(
      body.status || "ACTIVE"
    ).trim() as CoachStatusValue;

  if (
    !firstName ||
    !lastName
  ) {
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
    !STATUSET.includes(
      status
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Statusi i zgjedhur nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  let dateOfBirth: Date | null =
    null;

  if (body.dateOfBirth) {
    dateOfBirth =
      new Date(
        String(
          body.dateOfBirth
        )
      );

    if (
      Number.isNaN(
        dateOfBirth.getTime()
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Datëlindja nuk është e vlefshme.",
        },
        {
          status: 400,
        }
      );
    }
  }

  const existingStaff =
    email
      ? await prisma.academyStaff.findFirst({
          where: {
            academyId:
              access.academyId,

            email: {
              equals: email,
              mode: "insensitive",
            },
          },

          include: {
            coachProfile: {
              select: {
                id: true,
              },
            },
          },
        })
      : null;

  if (
    existingStaff?.coachProfile
  ) {
    return NextResponse.json(
      {
        error:
          "Ekziston tashmë një trajner me këtë adresë elektronike.",
      },
      {
        status: 409,
      }
    );
  }

  if (
    existingStaff &&
    !COACHING_ROLES.includes(
      existingStaff.role as
        (typeof COACHING_ROLES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Kjo adresë elektronike i përket një anëtari ekzistues të stafit me një rol tjetër.",
      },
      {
        status: 409,
      }
    );
  }

  const result =
    await prisma.$transaction(
      async (tx) => {
        const staff =
          existingStaff
            ? await tx.academyStaff.update({
                where: {
                  id:
                    existingStaff.id,
                },

                data: {
                  firstName,
                  lastName,
                  email,
                  phone,

                  status:
                    staffStatusFromCoach(
                      status
                    ),
                },
              })
            : await tx.academyStaff.create({
                data: {
                  academyId:
                    access.academyId,

                  firstName,
                  lastName,
                  email,
                  phone,

                  role: "COACH",

                  status:
                    staffStatusFromCoach(
                      status
                    ),
                },
              });

        const coach =
          await tx.coach.create({
            data: {
              academyId:
                access.academyId,

              staffId:
                staff.id,

              firstName,
              lastName,
              email,
              phone,

              dateOfBirth,

              specialization:
                String(
                  body.specialization ||
                    ""
                ).trim() ||
                null,

              license:
                String(
                  body.license ||
                    ""
                ).trim() ||
                null,

              notes:
                String(
                  body.notes || ""
                ).trim() ||
                null,

              status,
            },

            include: {
              staff: true,
            },
          });

        return {
          staff,
          coach,
        };
      }
    );

  return NextResponse.json(
    result,
    {
      status: 201,
    }
  );
}
