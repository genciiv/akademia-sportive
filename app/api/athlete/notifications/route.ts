import { NextResponse } from "next/server";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

async function getActiveTeamIds(
  playerId: string,
  academyId: string
) {
  const player =
    await prisma.player.findFirst({
      where: {
        id: playerId,
        academyId,
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
    return [];
  }

  return player.teams
    .filter(
      ({ team }) =>
        team.status === "ACTIVE"
    )
    .map(
      ({ team }) =>
        team.id
    );
}

export async function GET() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    return access.response;
  }

  const activeTeamIds =
    await getActiveTeamIds(
      access.playerId,
      access.academyId
    );

  const now = new Date();

  const notifications =
    await prisma.notification.findMany({
      where: {
        academyId:
          access.academyId,

        status: "ACTIVE",

        AND: [
          {
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
          },

          {
            OR: [
              {
                audience: "ALL",
              },
              {
                audience: "TEAM",

                teamId: {
                  in: activeTeamIds,
                },
              },
            ],
          },
        ],
      },

      orderBy: {
        publishedAt: "desc",
      },

      take: 20,

      select: {
        id: true,
        title: true,
        message: true,
        href: true,
        audience: true,
        priority: true,
        publishedAt: true,

        team: {
          select: {
            id: true,
            name: true,
          },
        },

        notificationReads: {
          where: {
            userId:
              access.userId,
          },

          select: {
            id: true,
          },
        },
      },
    });

  const items =
    notifications.map(
      (notification) => ({
        id: notification.id,
        title:
          notification.title,
        message:
          notification.message,
        href:
          notification.href,
        audience:
          notification.audience,
        priority:
          notification.priority,
        publishedAt:
          notification.publishedAt.toISOString(),
        team:
          notification.team,
        isRead:
          notification
            .notificationReads
            .length > 0,
      })
    );

  return NextResponse.json({
    unreadCount:
      items.filter(
        (item) =>
          !item.isRead
      ).length,

    notifications:
      items,
  });
}

export async function PATCH() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    return access.response;
  }

  const activeTeamIds =
    await getActiveTeamIds(
      access.playerId,
      access.academyId
    );

  const now = new Date();

  const notifications =
    await prisma.notification.findMany({
      where: {
        academyId:
          access.academyId,

        status: "ACTIVE",

        AND: [
          {
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
          },

          {
            OR: [
              {
                audience: "ALL",
              },
              {
                audience: "TEAM",

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

  if (
    notifications.length === 0
  ) {
    return NextResponse.json({
      ok: true,
      updated: 0,
    });
  }

  await prisma.notificationRead.createMany({
    data:
      notifications.map(
        (notification) => ({
          notificationId:
            notification.id,

          userId:
            access.userId,
        })
      ),

    skipDuplicates: true,
  });

  return NextResponse.json({
    ok: true,
    updated:
      notifications.length,
  });
}