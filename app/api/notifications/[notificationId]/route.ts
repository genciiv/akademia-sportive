import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function merrAkademineAktive() {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    return null;
  }

  return prisma.academyMembership.findFirst({
    where: {
      userId: session.user.id,
      status: "ACTIVE",
    },
    select: {
      academyId: true,
    },
  });
}

export async function PATCH(
  request: Request,
  {
    params,
  }: {
    params: {
      notificationId: string;
    };
  }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const academyId = membership.academyId;
  const notificationId = params.notificationId;

  const existing =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        academyId,
      },
      select: {
        id: true,
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

  const body = await request.json();

  const title = String(body.title ?? "").trim();
  const message = String(body.message ?? "").trim();

  const audience =
    body.audience === "TEAM"
      ? "TEAM"
      : "ALL";

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
    params: {
      notificationId: string;
    };
  }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      {
        error: "Nuk je i autorizuar.",
      },
      {
        status: 401,
      }
    );
  }

  const academyId = membership.academyId;
  const notificationId = params.notificationId;

  const existing =
    await prisma.notification.findFirst({
      where: {
        id: notificationId,
        academyId,
      },
      select: {
        id: true,
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

  await prisma.notification.delete({
    where: {
      id: notificationId,
    },
  });

  return NextResponse.json({
    success: true,
  });
}