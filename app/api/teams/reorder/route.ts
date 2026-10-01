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

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.TEAMS_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const body =
    await request.json();

  const teamIds: string[] =
    Array.isArray(body.teamIds)
      ? body.teamIds.map(
          (id: unknown) =>
            String(id)
        )
      : [];

  if (
    teamIds.length === 0 ||
    new Set(teamIds).size !== teamIds.length
  ) {
    return NextResponse.json(
      {
        error:
          "Renditja e ekipeve nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const teamScope =
    await getActiveTeamScope(access);

  const accessibleTeams =
    await prisma.team.findMany({
      where: {
        academyId,

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
        sortOrder: true,
        name: true,
      },

      orderBy: [
        {
          sortOrder: "asc",
        },
        {
          name: "asc",
        },
      ],
    });

  const accessibleIds =
    new Set(
      accessibleTeams.map(
        (team) => team.id
      )
    );

  if (
    teamIds.length !== accessibleTeams.length ||
    teamIds.some(
      (teamId: string) =>
        !accessibleIds.has(teamId)
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të ndryshuar këtë renditje.",
      },
      {
        status: 403,
      }
    );
  }

  await prisma.$transaction(
    teamIds.map(
      (
        teamId: string,
        index: number
      ) =>
        prisma.team.update({
          where: {
            id: teamId,
          },

          data: {
            sortOrder: index,
          },
        })
    )
  );

  return NextResponse.json({
    success: true,
  });
}