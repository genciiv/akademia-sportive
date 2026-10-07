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
  const text =
    String(value ?? "").trim();

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

export async function GET(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      tacticId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TACTICS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const {
    tacticId,
  } = await params;

  const teamScope =
    await getActiveTeamScope(access);

  const tactic =
    await prisma.tactic.findFirst({
      where: {
        id: tacticId,
        academyId:
          access.academyId,

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
    });

  if (!tactic) {
    return NextResponse.json(
      {
        error:
          "Taktika nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  return NextResponse.json({
    tactic,
    canManage:
      access.permissions.includes(
        PERMISSIONS.TACTICS_MANAGE
      ) &&
      (!teamScope.isScoped ||
        Boolean(
          tactic.teamId &&
            teamScope.teamIds.includes(
              tactic.teamId
            )
        )),
  });
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      tacticId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TACTICS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const {
    tacticId,
  } = await params;

  const teamScope =
    await getActiveTeamScope(access);

  const existing =
    await prisma.tactic.findFirst({
      where: {
        id: tacticId,
        academyId:
          access.academyId,
      },

      include: {
        targetTeams: true,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Taktika nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const existingTeamIds =
    existing.targetTeams.map(
      (target) => target.teamId
    );

  if (
    teamScope.isScoped &&
    (
      existingTeamIds.length === 0 ||
      existingTeamIds.some(
        (teamId) =>
          !teamScope.teamIds.includes(teamId)
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje të modifikosh këtë taktikë.",
      },
      {
        status: 403,
      }
    );
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
    String(
      body.name ??
        existing.name
    ).trim();

  const formation =
    body.formation === undefined
      ? existing.formation
      : optionalText(
          body.formation
        );

  const phase =
    String(
      body.phase ??
        existing.phase
    ).trim();

  let sport =
    body.sport === undefined
      ? existing.sport
      : optionalText(
          body.sport
        );

  const objective =
    body.objective === undefined
      ? existing.objective
      : optionalText(
          body.objective
        );

  const description =
    body.description === undefined
      ? existing.description
      : optionalText(
          body.description
        );

  const notes =
    body.notes === undefined
      ? existing.notes
      : optionalText(
          body.notes
        );

  const teamIds =
    body.teamIds === undefined
      ? existingTeamIds
      : Array.isArray(body.teamIds)
        ? Array.from(
            new Set(
              body.teamIds
                .map((value) =>
                  String(value).trim()
                )
                .filter(Boolean)
            )
          )
        : existingTeamIds;

  const isActive =
    body.isActive === undefined
      ? existing.isActive
      : Boolean(
          body.isActive
        );

  const visibleToPlayers =
    body.visibleToPlayers === undefined
      ? existing.visibleToPlayers
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
    await prisma.tactic.update({
      where: {
        id: existing.id,
      },

      data: {
        name,
        formation,

        phase:
          phase as
            (typeof TACTIC_PHASES)[number],

        sport,
        objective,
        description,
        notes,
        teamId:
          teamIds[0] ?? null,

        targetTeams: {
          deleteMany: {},
          create: teamIds.map(
            (teamId) => ({
              teamId,
            })
          ),
        },

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

  return NextResponse.json({
    tactic,
  });
}

export async function DELETE(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      tacticId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TACTICS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const {
    tacticId,
  } = await params;

  const teamScope =
    await getActiveTeamScope(access);

  const existing =
    await prisma.tactic.findFirst({
      where: {
        id: tacticId,
        academyId:
          access.academyId,
      },

      select: {
        id: true,
        teamId: true,

        targetTeams: {
          select: {
            teamId: true,
          },
        },
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Taktika nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const existingTeamIds =
    existing.targetTeams.map(
      (target) => target.teamId
    );

  if (
    teamScope.isScoped &&
    (
      existingTeamIds.length === 0 ||
      existingTeamIds.some(
        (teamId) =>
          !teamScope.teamIds.includes(teamId)
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje të fshish këtë taktikë.",
      },
      {
        status: 403,
      }
    );
  }

  await prisma.tactic.delete({
    where: {
      id: existing.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}