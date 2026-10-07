import { NextResponse } from "next/server";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

export async function POST(
  _request: Request,
  {
    params,
  }: {
    params: Promise<{
      notificationId: string;
    }>;
  }
) {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    return access.response;
  }

  const {
    notificationId,
  } = await params;

  const player =
    await prisma.player.findFirst({
      where: {
        id: access.playerId,
        academyId:
          access.academyId,
      },

      select: {
        teams: {
          where: {
            isActive: true,
          },

          select: {
            team: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (!player) {
    return NextResponse.json(
      {
        error:
          "Sportisti nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  const activeTeamIds =
    player.teams
      .filter(
        ({ team }) =>
          team.status === "ACTIVE"
      )
      .map(
        ({ team }) =>
          team.id
      );

  const now = new Date();

  const notification =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,

        academyId:
          access.academyId,

        status: "ACTIVE",

        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gte: now,
            },
          },
        ],

        AND: [
          {
            OR: [
              {
                audience:
                  "ALL",
              },
              {
                audience:
                  "TEAM",

                teamId: {
                  in: activeTeamIds,
                },
              },
            ],
          },
        ],
      },

      select: {
        id: true,
      },
    });

  if (!notification) {
    return NextResponse.json(
      {
        error:
          "Njoftimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  await prisma.notificationRead.upsert({
    where: {
      notificationId_userId: {
        notificationId:
          notification.id,

        userId:
          access.userId,
      },
    },

    update: {},

    create: {
      notificationId:
        notification.id,

      userId:
        access.userId,
    },
  });

  return NextResponse.json({
    ok: true,
  });
}