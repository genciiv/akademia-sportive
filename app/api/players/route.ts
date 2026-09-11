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

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PLAYERS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const {
    academyId,
  } = access;

  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId,
        isActive: true,
      },
    });

  const teamScope =
    await getActiveTeamScope(access);

  const players =
    await prisma.player.findMany({
      where: {
        academyId,

        ...(activeSeason ||
        teamScope.isScoped
          ? {
              teams: {
                some: {
                  isActive: true,

                  ...(teamScope.isScoped
                    ? {
                        teamId: {
                          in:
                            teamScope.teamIds,
                        },
                      }
                    : {}),

                  ...(activeSeason
                    ? {
                        team: {
                          academyId,
                          season:
                            activeSeason.name,
                          status:
                            "ACTIVE",
                        },
                      }
                    : {}),
                },
              },
            }
          : {}),
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
    players,
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.PLAYERS_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  const {
    academyId,
  } = access;

  /*
   * Krijimi i sportistit është academy-level.
   * Lidhja me ekipin do të trajtohet nga roster-i.
   *
   * Roleve të kufizuara sipas ekipit nuk u japim
   * PLAYERS_CREATE në matricën aktuale.
   */

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

  const player =
    await prisma.player.create({
      data: {
        academyId,
        firstName,
        lastName,

        dateOfBirth:
          body.dateOfBirth
            ? new Date(
                body.dateOfBirth
              )
            : null,

        gender:
          body.gender ||
          "NOT_SPECIFIED",

        email:
          body.email || null,

        phone:
          body.phone || null,

        guardianName:
          body.guardianName || null,

        guardianPhone:
          body.guardianPhone || null,

        guardianEmail:
          body.guardianEmail || null,

        position:
          body.position || null,

        jerseyNumber:
          body.jerseyNumber !==
            undefined &&
          body.jerseyNumber !== null &&
          body.jerseyNumber !== ""
            ? Number(
                body.jerseyNumber
              )
            : null,

        notes:
          body.notes || null,

        status:
          body.status ||
          "ACTIVE",
      },
    });

  return NextResponse.json(
    {
      player,
    },
    {
      status: 201,
    }
  );
}