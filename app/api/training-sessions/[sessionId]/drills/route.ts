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

async function merrSeancen(
  sessionId: string,
  academyId: string
) {
  return prisma.trainingSession.findFirst({
    where: {
      id: sessionId,
      academyId,
    },
    select: {
      id: true,
      title: true,
    },
  });
}

export async function GET(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const trainingSession = await merrSeancen(
    params.sessionId,
    membership.academyId
  );

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const sessionDrills =
    await prisma.trainingSessionDrill.findMany({
      where: {
        trainingSessionId: trainingSession.id,
      },
      include: {
        drill: {
          select: {
            id: true,
            name: true,
            category: true,
            sport: true,
            objective: true,
            durationMin: true,
            difficulty: true,
            equipment: true,
            description: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        order: "asc",
      },
    });

  const usedDrillIds = sessionDrills.map(
    (item) => item.drillId
  );

  const availableDrills = await prisma.drill.findMany({
    where: {
      academyId: membership.academyId,
      isActive: true,
      id: {
        notIn: usedDrillIds,
      },
    },
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      category: true,
      sport: true,
      objective: true,
      durationMin: true,
      difficulty: true,
      equipment: true,
    },
  });

  const totalDurationMin = sessionDrills.reduce(
    (total, item) =>
      total +
      (item.durationMin ??
        item.drill.durationMin ??
        0),
    0
  );

  return NextResponse.json({
    trainingSession,
    sessionDrills,
    availableDrills,
    statistics: {
      totalDrills: sessionDrills.length,
      totalDurationMin,
    },
  });
}

export async function POST(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const trainingSession = await merrSeancen(
    params.sessionId,
    membership.academyId
  );

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const drillId = String(body.drillId || "").trim();
  const notes = String(body.notes || "").trim() || null;

  const durationMin =
    body.durationMin === "" ||
    body.durationMin === null ||
    body.durationMin === undefined
      ? null
      : Number(body.durationMin);

  if (!drillId) {
    return NextResponse.json(
      { error: "Ushtrimi është i detyrueshëm." },
      { status: 400 }
    );
  }

  if (
    durationMin !== null &&
    (!Number.isInteger(durationMin) ||
      durationMin <= 0)
  ) {
    return NextResponse.json(
      {
        error:
          "Kohëzgjatja duhet të jetë numër i plotë pozitiv.",
      },
      { status: 400 }
    );
  }

  const drill = await prisma.drill.findFirst({
    where: {
      id: drillId,
      academyId: membership.academyId,
      isActive: true,
    },
  });

  if (!drill) {
    return NextResponse.json(
      {
        error:
          "Ushtrimi nuk u gjet ose nuk është aktiv.",
      },
      { status: 404 }
    );
  }

  const existing =
    await prisma.trainingSessionDrill.findUnique({
      where: {
        trainingSessionId_drillId: {
          trainingSessionId: trainingSession.id,
          drillId: drill.id,
        },
      },
    });

  if (existing) {
    return NextResponse.json(
      {
        error:
          "Ky ushtrim është shtuar tashmë në këtë seancë.",
      },
      { status: 409 }
    );
  }

  const lastItem =
    await prisma.trainingSessionDrill.findFirst({
      where: {
        trainingSessionId: trainingSession.id,
      },
      orderBy: {
        order: "desc",
      },
      select: {
        order: true,
      },
    });

  const nextOrder = (lastItem?.order || 0) + 1;

  const sessionDrill =
    await prisma.trainingSessionDrill.create({
      data: {
        trainingSessionId: trainingSession.id,
        drillId: drill.id,
        order: nextOrder,
        durationMin:
          durationMin ?? drill.durationMin,
        notes,
      },
      include: {
        drill: true,
      },
    });

  return NextResponse.json(
    { sessionDrill },
    { status: 201 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const trainingSession = await merrSeancen(
    params.sessionId,
    membership.academyId
  );

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const sessionDrillId = String(
    body.sessionDrillId || ""
  ).trim();

  const notes = String(body.notes || "").trim() || null;

  const durationMin =
    body.durationMin === "" ||
    body.durationMin === null ||
    body.durationMin === undefined
      ? null
      : Number(body.durationMin);

  const order =
    body.order === undefined ||
    body.order === null ||
    body.order === ""
      ? null
      : Number(body.order);

  if (!sessionDrillId) {
    return NextResponse.json(
      {
        error:
          "Lidhja e ushtrimit me seancën është e detyrueshme.",
      },
      { status: 400 }
    );
  }

  if (
    durationMin !== null &&
    (!Number.isInteger(durationMin) ||
      durationMin <= 0)
  ) {
    return NextResponse.json(
      {
        error:
          "Kohëzgjatja duhet të jetë numër i plotë pozitiv.",
      },
      { status: 400 }
    );
  }

  if (
    order !== null &&
    (!Number.isInteger(order) || order <= 0)
  ) {
    return NextResponse.json(
      {
        error:
          "Renditja duhet të jetë numër i plotë pozitiv.",
      },
      { status: 400 }
    );
  }

  const existing =
    await prisma.trainingSessionDrill.findFirst({
      where: {
        id: sessionDrillId,
        trainingSessionId: trainingSession.id,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Ushtrimi nuk u gjet në këtë seancë.",
      },
      { status: 404 }
    );
  }

  const sessionDrill =
    await prisma.trainingSessionDrill.update({
      where: {
        id: existing.id,
      },
      data: {
        durationMin,
        notes,
        ...(order !== null
          ? {
              order,
            }
          : {}),
      },
      include: {
        drill: true,
      },
    });

  return NextResponse.json({
    sessionDrill,
  });
}

export async function DELETE(
  request: Request,
  { params }: { params: { sessionId: string } }
) {
  const membership = await merrAkademineAktive();

  if (!membership) {
    return NextResponse.json(
      { error: "Nuk je i autorizuar." },
      { status: 401 }
    );
  }

  const trainingSession = await merrSeancen(
    params.sessionId,
    membership.academyId
  );

  if (!trainingSession) {
    return NextResponse.json(
      { error: "Seanca nuk u gjet." },
      { status: 404 }
    );
  }

  const body = await request.json();

  const sessionDrillId = String(
    body.sessionDrillId || ""
  ).trim();

  if (!sessionDrillId) {
    return NextResponse.json(
      {
        error:
          "Lidhja e ushtrimit me seancën është e detyrueshme.",
      },
      { status: 400 }
    );
  }

  const existing =
    await prisma.trainingSessionDrill.findFirst({
      where: {
        id: sessionDrillId,
        trainingSessionId: trainingSession.id,
      },
    });

  if (!existing) {
    return NextResponse.json(
      {
        error:
          "Ushtrimi nuk u gjet në këtë seancë.",
      },
      { status: 404 }
    );
  }

  await prisma.trainingSessionDrill.delete({
    where: {
      id: existing.id,
    },
  });

  const remaining =
    await prisma.trainingSessionDrill.findMany({
      where: {
        trainingSessionId: trainingSession.id,
      },
      orderBy: {
        order: "asc",
      },
      select: {
        id: true,
      },
    });

  if (remaining.length > 0) {
    await prisma.$transaction(
      remaining.map((item, index) =>
        prisma.trainingSessionDrill.update({
          where: {
            id: item.id,
          },
          data: {
            order: index + 1,
          },
        })
      )
    );
  }

  return NextResponse.json({
    success: true,
  });
}