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


  const [tactics, teams] =
    await Promise.all([
      prisma.tactic.findMany({
        where: {
          academyId: access.academyId,

          ...(teamScope.isScoped
            ? {
                OR: [
                  {
                    targetTeams: {
                      none: {},
                    },
                  },
                  {
                    targetTeams: {
                      some: {
                        teamId: {
                          in: teamScope.teamIds,
                        },
                      },
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

          targetTeams: {
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
            tactic.targetTeams.length > 0 &&
            tactic.targetTeams.every(
              (target) =>
                teamScope.teamIds.includes(
                  target.teamId
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

  const teamIds = Array.isArray(body.teamIds)
    ? Array.from(
        new Set(
          body.teamIds
            .map((value) =>
              String(value).trim()
            )
            .filter(Boolean)
        )
      )
    : [];

  const isActive =
    body.isActive === undefined
      ? true
      : Boolean(body.isActive);

  const visibleToPlayers =
    body.visibleToPlayers === undefined
      ? false
      : Boolean(
          body.visibleToPlayers
        );

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
    teamIds.length === 0
  ) {
    return NextResponse.json(
      {
        error:
          "Duhet të zgjedhësh të paktën një nga ekipet që menaxhon.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    teamScope.isScoped &&
    teamIds.some(
      (teamId) =>
        !teamScope.teamIds.includes(teamId)
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke akses tek një ose më shumë ekipe të zgjedhura.",
      },
      {
        status: 403,
      }
    );
  }

  const selectedTeams =
    teamIds.length === 0
      ? []
      : await prisma.team.findMany({
          where: {
            id: {
              in: teamIds,
            },
            academyId:
              access.academyId,
            status: "ACTIVE",
          },

          select: {
            id: true,
            sport: true,
          },
        });

  if (
    selectedTeams.length !==
    teamIds.length
  ) {
    return NextResponse.json(
      {
        error:
          "Një ose më shumë ekipe të zgjedhura nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const selectedSports =
    new Set(
      selectedTeams.map(
        (team) => String(team.sport)
      )
    );

  if (selectedSports.size > 1) {
    return NextResponse.json(
      {
        error:
          "Të gjitha ekipet e zgjedhura duhet të jenë të të njëjtit sport.",
      },
      {
        status: 400,
      }
    );
  }

  if (selectedTeams.length > 0) {
    sport = String(
      selectedTeams[0].sport
    );
  }

  const tactic =
    await prisma.tactic.create({
      data: {
        academyId:
          access.academyId,

        teamId:
          teamIds[0] ?? null,

        targetTeams: {
          create: teamIds.map(
            (teamId) => ({
              teamId,
            })
          ),
        },

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
        visibleToPlayers,

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

        targetTeams: {
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
