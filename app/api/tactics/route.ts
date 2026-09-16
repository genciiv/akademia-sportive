import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  Prisma,
} from "@/lib/generated/prisma/client";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const TACTIC_PHASES = [
  "ATTACK",
  "DEFENSE",
  "ATTACK_TRANSITION",
  "DEFENSE_TRANSITION",
  "SET_PIECE",
] as const;

const SPORTS = [
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

const MAX_NAME_LENGTH = 120;
const MAX_FORMATION_LENGTH = 40;
const MAX_OBJECTIVE_LENGTH = 500;
const MAX_DESCRIPTION_LENGTH = 4000;
const MAX_NOTES_LENGTH = 4000;

function optionalText(
  value: unknown
): string | null {
  const text = String(value ?? "").trim();

  return text || null;
}

function normalizeBoardData(
  value: unknown
):
  | {
      ok: true;
      value:
        | Prisma.InputJsonValue
        | typeof Prisma.DbNull
        | undefined;
    }
  | {
      ok: false;
    } {
  if (value === undefined) {
    return {
      ok: true,
      value: undefined,
    };
  }

  if (value === null) {
    return {
      ok: true,
      value: Prisma.DbNull,
    };
  }

  if (
    typeof value !== "object" ||
    Array.isArray(value)
  ) {
    return {
      ok: false,
    };
  }

  return {
    ok: true,
    value:
      value as Prisma.InputJsonValue,
  };
}

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TACTICS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const teamScope =
    await getActiveTeamScope(access);

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId: access.academyId,
        isActive: true,
      },
      select: {
        name: true,
      },
    });

  const [tactics, teams] =
    await Promise.all([
      prisma.tactic.findMany({
        where: {
          academyId: access.academyId,

          ...(teamScope.isScoped
            ? {
                OR: [
                  {
                    teamId: null,
                  },
                  {
                    teamId: {
                      in: teamScope.teamIds,
                    },
                  },
                ],
              }
            : {}),
        },

        include: {
          team: {
            select: {
              id: true,
              name: true,
              sport: true,
              ageGroup: true,
              status: true,
            },
          },
        },

        orderBy: [
          {
            isActive: "desc",
          },
          {
            updatedAt: "desc",
          },
        ],
      }),

      prisma.team.findMany({
        where: {
          academyId: access.academyId,
          status: "ACTIVE",

          ...(teamScope.isScoped
            ? {
                id: {
                  in: teamScope.teamIds,
                },
              }
            : {}),

          ...(activeSeason
            ? {
                season: activeSeason.name,
              }
            : {}),
        },

        select: {
          id: true,
          name: true,
          sport: true,
          ageGroup: true,
        },

        orderBy: {
          name: "asc",
        },
      }),
    ]);

  const hasManagePermission =
    access.permissions.includes(
      PERMISSIONS.TACTICS_MANAGE
    );

  return NextResponse.json({
    tactics: tactics.map(
      (tactic) => ({
        ...tactic,

        canManage:
          hasManagePermission &&
          (
            !teamScope.isScoped ||
            Boolean(
              tactic.teamId &&
              teamScope.teamIds.includes(
                tactic.teamId
              )
            )
          ),
      })
    ),

    teams,

    canManage:
      hasManagePermission,

    isTeamScoped:
      teamScope.isScoped,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TACTICS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const rawBody =
    await request.json();

  const body =
    rawBody &&
    typeof rawBody === "object" &&
    !Array.isArray(rawBody)
      ? (rawBody as Record<
          string,
          unknown
        >)
      : {};

  const name =
    String(body.name ?? "").trim();

  const formation =
    optionalText(body.formation);

  const phase =
    String(
      body.phase ?? "ATTACK"
    ).trim();

  let sport =
    optionalText(body.sport);

  const objective =
    optionalText(body.objective);

  const description =
    optionalText(body.description);

  const notes =
    optionalText(body.notes);

  const teamId =
    optionalText(body.teamId);

  const isActive =
    body.isActive === undefined
      ? true
      : Boolean(body.isActive);

  const boardDataResult =
    normalizeBoardData(
      body.boardData
    );

  if (!name) {
    return NextResponse.json(
      {
        error:
          "Emri i taktikës është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    name.length >
    MAX_NAME_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Emri i taktikës nuk mund të kalojë ${MAX_NAME_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    formation &&
    formation.length >
      MAX_FORMATION_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Formacioni nuk mund të kalojë ${MAX_FORMATION_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    objective &&
    objective.length >
      MAX_OBJECTIVE_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Objektivi nuk mund të kalojë ${MAX_OBJECTIVE_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    description &&
    description.length >
      MAX_DESCRIPTION_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Përshkrimi nuk mund të kalojë ${MAX_DESCRIPTION_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    notes &&
    notes.length >
      MAX_NOTES_LENGTH
  ) {
    return NextResponse.json(
      {
        error:
          `Shënimet nuk mund të kalojnë ${MAX_NOTES_LENGTH} karaktere.`,
      },
      {
        status: 400,
      }
    );
  }

  if (
    !TACTIC_PHASES.includes(
      phase as
        (typeof TACTIC_PHASES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Faza taktike nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    sport &&
    !SPORTS.includes(
      sport as
        (typeof SPORTS)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Sporti i zgjedhur nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (!boardDataResult.ok) {
    return NextResponse.json(
      {
        error:
          "Diagrami taktik nuk është në format të vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const teamScope =
    await getActiveTeamScope(access);

  if (
    teamScope.isScoped &&
    !teamId
  ) {
    return NextResponse.json(
      {
        error:
          "Duhet të zgjedhësh një nga ekipet që menaxhon.",
      },
      {
        status: 403,
      }
    );
  }

  let team:
    | {
        id: string;
        sport: string;
      }
    | null = null;

  if (teamId) {
    if (
      teamScope.isScoped &&
      !teamScope.teamIds.includes(
        teamId
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Nuk ke akses tek ekipi i zgjedhur.",
        },
        {
          status: 403,
        }
      );
    }

    team =
      await prisma.team.findFirst({
        where: {
          id: teamId,
          academyId:
            access.academyId,
          status: "ACTIVE",
        },

        select: {
          id: true,
          sport: true,
        },
      });

    if (!team) {
      return NextResponse.json(
        {
          error:
            "Ekipi i zgjedhur nuk është i vlefshëm.",
        },
        {
          status: 400,
        }
      );
    }

    sport = String(
      team.sport
    );
  }

  const tactic =
    await prisma.tactic.create({
      data: {
        academyId:
          access.academyId,

        teamId:
          team?.id ?? null,

        name,
        formation,

        phase:
          phase as
            (typeof TACTIC_PHASES)[number],

        sport,
        objective,
        description,
        notes,
        isActive,

        ...(boardDataResult.value ===
        undefined
          ? {}
          : {
              boardData:
                boardDataResult.value,
            }),
      },

      include: {
        team: {
          select: {
            id: true,
            name: true,
            sport: true,
            ageGroup: true,
          },
        },
      },
    });

  return NextResponse.json(
    {
      tactic,
    },
    {
      status: 201,
    }
  );
}