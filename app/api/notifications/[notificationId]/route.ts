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

export async function PATCH(
  request: Request,
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
      PERMISSIONS.NOTIFICATIONS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const notificationId = (await params).notificationId;

  const existing =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        academyId,
      },
      select: {
        id: true,
        audience: true,
        teamId: true,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error: "Njoftimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }
  const teamScope =
    await getActiveTeamScope(access);

  if (
    teamScope.isScoped &&
    (
      existing.audience === "ALL" ||
      existing.teamId === null ||
      !teamScope.teamIds.includes(
        existing.teamId
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të menaxhuar këtë njoftim.",
      },
      { status: 403 }
    );
  }

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

  const status =
    body.status === "ARCHIVED"
      ? "ARCHIVED"
      : "ACTIVE";

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
    await prisma.notification.update({
      where: {
        id: notificationId,
      },
      data: {
        title,
        message,
        audience,
        priority,
        status,
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

  return NextResponse.json({
    notification,
  });
}

export async function DELETE(
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
      PERMISSIONS.NOTIFICATIONS_MANAGE
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const notificationId = (await params).notificationId;

  const existing =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        academyId,
      },
      select: {
        id: true,
        audience: true,
        teamId: true,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error: "Njoftimi nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }
  const teamScope =
    await getActiveTeamScope(access);

  if (
    teamScope.isScoped &&
    (
      existing.audience === "ALL" ||
      existing.teamId === null ||
      !teamScope.teamIds.includes(
        existing.teamId
      )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të menaxhuar këtë njoftim.",
      },
      { status: 403 }
    );
  }

  await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });

  return NextResponse.json({
    success: true,
  });
}
