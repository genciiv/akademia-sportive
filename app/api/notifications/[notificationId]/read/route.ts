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
    await requireAcademyPermission(
      PERMISSIONS.NOTIFICATIONS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { notificationId } =
    await params;

  const teamScope =
    await getActiveTeamScope(access);

  const notification =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        academyId: access.academyId,
        ...(teamScope.isScoped
          ? {
              OR: [
                {
                  audience: "ALL",
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
      select: {
        id: true,
      },
    });

  if (!notification) {
    return NextResponse.json(
      {
        error:
          "Njoftimi nuk u gjet ose nuk ke leje ta aksesosh.",
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
          access.session.user.id,
      },
    },
    update: {
      readAt: new Date(),
    },
    create: {
      notificationId:
        notification.id,
      userId:
        access.session.user.id,
    },
  });

  return NextResponse.json({
    success: true,
  });
}