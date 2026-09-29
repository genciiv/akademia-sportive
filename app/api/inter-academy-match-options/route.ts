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
      PERMISSIONS.MATCHES_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  const teamScope =
    await getActiveTeamScope(access);

  const [
    requesterTeams,
    opponentAcademies,
  ] = await Promise.all([
    prisma.team.findMany({
      where: {
        academyId:
          access.academyId,
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

    prisma.academy.findMany({
      where: {
        id: {
          not: access.academyId,
        },
        status: "ACTIVE",
      },

      select: {
        id: true,
        name: true,
        city: true,

        teams: {
          where: {
            status: "ACTIVE",
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
        },
      },

      orderBy: {
        name: "asc",
      },
    }),
  ]);

  return NextResponse.json({
    requesterTeams,
    opponentAcademies,
  });
}