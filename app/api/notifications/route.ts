import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.NOTIFICATIONS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;


  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId,
        isActive: true,
      },
    });

  const teamScope =
    await getActiveTeamScope(access);

  const [notifications, teams] = await Promise.all([
    prisma.notification.findMany({
      where: {
        academyId,
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
      orderBy: {
        publishedAt: "desc",
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.team.findMany({
      where: {
        academyId,
        ...(teamScope.isScoped
          ? {
              id: {
                in: teamScope.teamIds,
              },
            }
          : {}),
        status: "ACTIVE",
        ...(activeSeason
          ? {
              season: activeSeason.name,
            }
          : {}),
      },
      orderBy: {
        name: "asc",
      },
      select: {
        id: true,
        name: true,
      },
    }),
  ]);

  const now = new Date();

  return NextResponse.json({
    notifications,
    teams,
    summary: {
      total: notifications.length,

      active: notifications.filter(
        (notification) =>
          notification.status === "ACTIVE" &&
          (!notification.expiresAt ||
            notification.expiresAt >= now)
      ).length,

      important: notifications.filter(
        (notification) =>
          notification.priority === "IMPORTANT"
      ).length,

      urgent: notifications.filter(
        (notification) =>
          notification.priority === "URGENT"
      ).length,
    },
  });
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.NOTIFICATIONS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;


  const activeSeason =
    await prisma.academySeason.findFirst({
      where: {
        academyId,
        isActive: true,
      },
    });


  const teamScope =
    await getActiveTeamScope(access);

  const body = await request.json();

  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? "").trim();

  const audience =
    body.audience === "TEAM"
      ? "TEAM"
      : "ALL";
  if (
    teamScope.isScoped &&
    audience === "ALL"
  ) {
    return NextResponse.json(
      {
        error:
          "Njoftimi duhet të lidhet me një ekip që menaxhon.",
      },
      { status: 403 }
    );
  }

  const priority =
    body.priority === "IMPORTANT" ||
    body.priority === "URGENT"
      ? body.priority
      : "NORMAL";

  const teamId =
    String(body.teamId ?? "").trim() || null;

  const expiresAt =
    body.expiresAt
      ? new Date(body.expiresAt)
      : null;

  if (!title) {
    return NextResponse.json(
      {
        error: "Titulli është i detyrueshëm.",
      },
      {
        status: 400,
      }
    );
  }

  if (!message) {
    return NextResponse.json(
      {
        error: "Përmbajtja e njoftimit është e detyrueshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    expiresAt &&
    Number.isNaN(expiresAt.getTime())
  ) {
    return NextResponse.json(
      {
        error: "Data e skadimit nuk është e vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (audience === "TEAM") {
    if (!teamId) {
      return NextResponse.json(
        {
          error: "Duhet të zgjidhësh një ekip.",
        },
        {
          status: 400,
        }
      );
    }

    const team = await prisma.team.findFirst({
      where: {
        id: teamId,
        academyId,
        ...(activeSeason
          ? {
              season: activeSeason.name,
              status: "ACTIVE",
            }
          : {}),
      },
      select: {
        id: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          error: "Ekipi nuk u gjet.",
        },
        {
          status: 404,
        }
      );
    }
    const hasTeamAccess =
      await canAccessTeam(
        access,
        team.id
      );

    if (!hasTeamAccess) {
      return NextResponse.json(
        {
          error:
            "Nuk ke leje për të aksesuar këtë ekip.",
        },
        { status: 403 }
      );
    }
  }

  const notification =
    await prisma.notification.create({
      data: {
        academyId,
        title,
        message,
        audience,
        priority,
        teamId:
          audience === "TEAM"
            ? teamId
            : null,
        expiresAt,
      },
      include: {
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  return NextResponse.json(
    {
      notification,
    },
    {
      status: 201,
    }
  );
}
