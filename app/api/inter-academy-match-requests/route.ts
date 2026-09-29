import { NextResponse } from "next/server";

import { requireAcademyPermission } from "@/lib/academy-permissions";
import {
  canAccessTeam,
  getActiveTeamScope,
} from "@/lib/academy-resource-scope";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { createInterAcademyNotification } from "@/lib/inter-academy-notifications";
import {
  AUDIT_ACTIONS,
  writeAuditLog,
} from "@/lib/audit-log";

const MATCH_TYPES = [
  "FRIENDLY",
  "LEAGUE",
  "CUP",
  "TOURNAMENT",
  "OTHER",
] as const;

export async function GET() {
  const access = await requireAcademyPermission(
    PERMISSIONS.MATCHES_VIEW
  );

  if (!access.ok) {
    return access.response;
  }

  const teamScope = await getActiveTeamScope(access);

  const [sent, received] = await Promise.all([
    prisma.interAcademyMatchRequest.findMany({
      where: {
        requesterAcademyId: access.academyId,
        ...(teamScope.isScoped
          ? {
              requesterTeamId: {
                in: teamScope.teamIds,
              },
            }
          : {}),
      },
      include: {
        requesterAcademy: {
          select: {
            id: true,
            name: true,
          },
        },
        requesterTeam: {
          select: {
            id: true,
            name: true,
            sport: true,
            ageGroup: true,
          },
        },
        opponentAcademy: {
          select: {
            id: true,
            name: true,
          },
        },
        opponentTeam: {
          select: {
            id: true,
            name: true,
            sport: true,
            ageGroup: true,
          },
        },
        interAcademyMatch: {
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),

    prisma.interAcademyMatchRequest.findMany({
      where: {
        opponentAcademyId: access.academyId,
        ...(teamScope.isScoped
          ? {
              opponentTeamId: {
                in: teamScope.teamIds,
              },
            }
          : {}),
      },
      include: {
        requesterAcademy: {
          select: {
            id: true,
            name: true,
          },
        },
        requesterTeam: {
          select: {
            id: true,
            name: true,
            sport: true,
            ageGroup: true,
          },
        },
        opponentAcademy: {
          select: {
            id: true,
            name: true,
          },
        },
        opponentTeam: {
          select: {
            id: true,
            name: true,
            sport: true,
            ageGroup: true,
          },
        },
        interAcademyMatch: {
          select: {
            id: true,
            status: true,
            homeScore: true,
            awayScore: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
  ]);

  return NextResponse.json({
    sent,
    received,
  });
}
export async function POST(request: Request) {
  const access = await requireAcademyPermission(
    PERMISSIONS.MATCHES_CREATE
  );

  if (!access.ok) {
    return access.response;
  }

  const body = await request.json();

  const requesterTeamId = String(
    body.requesterTeamId || ""
  ).trim();

  const opponentAcademyId = String(
    body.opponentAcademyId || ""
  ).trim();

  const opponentTeamId = String(
    body.opponentTeamId || ""
  ).trim();

  const startsAt = String(
    body.startsAt || ""
  ).trim();

  const endsAt = String(
    body.endsAt || ""
  ).trim();

  const location =
    String(body.location || "").trim() || null;

  const competitionName =
    String(body.competitionName || "").trim() || null;

  const round =
    String(body.round || "").trim() || null;

  const message =
    String(body.message || "").trim() || null;

  const matchType = String(
    body.matchType || "FRIENDLY"
  );

  const requesterIsHome =
    body.requesterIsHome === undefined
      ? true
      : Boolean(body.requesterIsHome);

  if (!requesterTeamId) {
    return NextResponse.json(
      {
        error:
          "Ekipi dërgues është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  if (!opponentAcademyId) {
    return NextResponse.json(
      {
        error:
          "Akademia kundërshtare është e detyrueshme.",
      },
      { status: 400 }
    );
  }

  if (!opponentTeamId) {
    return NextResponse.json(
      {
        error:
          "Ekipi kundërshtar është i detyrueshëm.",
      },
      { status: 400 }
    );
  }

  if (!startsAt) {
    return NextResponse.json(
      {
        error:
          "Data dhe ora e ndeshjes janë të detyrueshme.",
      },
      { status: 400 }
    );
  }

  if (opponentAcademyId === access.academyId) {
    return NextResponse.json(
      {
        error:
          "Nuk mund të dërgosh kërkesë inter-akademi te akademia jote.",
      },
      { status: 400 }
    );
  }

  if (
    !MATCH_TYPES.includes(
      matchType as (typeof MATCH_TYPES)[number]
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Lloji i ndeshjes nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const startsAtDate = new Date(startsAt);

  if (Number.isNaN(startsAtDate.getTime())) {
    return NextResponse.json(
      {
        error:
          "Data dhe ora e ndeshjes nuk janë të vlefshme.",
      },
      { status: 400 }
    );
  }

  if (startsAtDate <= new Date()) {
    return NextResponse.json(
      {
        error:
          "Ndeshja duhet të planifikohet në të ardhmen.",
      },
      { status: 400 }
    );
  }

  let endsAtDate: Date | null = null;

  if (endsAt) {
    endsAtDate = new Date(endsAt);

    if (Number.isNaN(endsAtDate.getTime())) {
      return NextResponse.json(
        {
          error:
            "Data dhe ora e përfundimit nuk janë të vlefshme.",
        },
        { status: 400 }
      );
    }

    if (endsAtDate <= startsAtDate) {
      return NextResponse.json(
        {
          error:
            "Ora e përfundimit duhet të jetë pas fillimit.",
        },
        { status: 400 }
      );
    }
  }

  if (access.academy.status !== "ACTIVE") {
    return NextResponse.json(
      {
        error:
          "Vetëm akademitë aktive mund të dërgojnë kërkesa për ndeshje.",
      },
      { status: 403 }
    );
  }

  const requesterTeam = await prisma.team.findFirst({
    where: {
      id: requesterTeamId,
      academyId: access.academyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      sport: true,
      ageGroup: true,
    },
  });

  if (!requesterTeam) {
    return NextResponse.json(
      {
        error:
          "Ekipi dërgues nuk u gjet ose nuk është aktiv.",
      },
      { status: 404 }
    );
  }

  const hasTeamAccess = await canAccessTeam(
    access,
    requesterTeam.id
  );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të përdorur këtë ekip.",
      },
      { status: 403 }
    );
  }

  const opponentAcademy = await prisma.academy.findFirst({
    where: {
      id: opponentAcademyId,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      status: true,
    },
  });

  if (!opponentAcademy) {
    return NextResponse.json(
      {
        error:
          "Akademia kundërshtare nuk u gjet ose nuk është aktive.",
      },
      { status: 404 }
    );
  }

  const opponentTeam = await prisma.team.findFirst({
    where: {
      id: opponentTeamId,
      academyId: opponentAcademy.id,
      status: "ACTIVE",
    },
    select: {
      id: true,
      name: true,
      sport: true,
      ageGroup: true,
    },
  });

  if (!opponentTeam) {
    return NextResponse.json(
      {
        error:
          "Ekipi kundërshtar nuk u gjet ose nuk është aktiv.",
      },
      { status: 404 }
    );
  }

  if (requesterTeam.sport !== opponentTeam.sport) {
    return NextResponse.json(
      {
        error:
          "Ekipet duhet të jenë të të njëjtit sport.",
      },
      { status: 400 }
    );
  }

  const existingPendingRequest =
    await prisma.interAcademyMatchRequest.findFirst({
      where: {
        requesterAcademyId: access.academyId,
        requesterTeamId: requesterTeam.id,
        opponentAcademyId: opponentAcademy.id,
        opponentTeamId: opponentTeam.id,
        status: "PENDING",
        startsAt: startsAtDate,
      },
      select: {
        id: true,
      },
    });

  if (existingPendingRequest) {
    return NextResponse.json(
      {
        error:
          "Ekziston tashmë një kërkesë në pritje për këto ekipe dhe këtë orar.",
      },
      { status: 409 }
    );
  }

  const matchRequest = await prisma.$transaction(
    async (tx) => {
      const created =
        await tx.interAcademyMatchRequest.create({
          data: {
            requesterAcademyId: access.academyId,
            requesterTeamId: requesterTeam.id,
            opponentAcademyId: opponentAcademy.id,
            opponentTeamId: opponentTeam.id,
            startsAt: startsAtDate,
            endsAt: endsAtDate,
            location,
            requesterIsHome,
            matchType: matchType as
              | "FRIENDLY"
              | "LEAGUE"
              | "CUP"
              | "TOURNAMENT"
              | "OTHER",
            competitionName,
            round,
            message,
            createdByUserId: access.session.user.id,
          },
          include: {
            requesterAcademy: {
              select: {
                id: true,
                name: true,
              },
            },
            requesterTeam: {
              select: {
                id: true,
                name: true,
                sport: true,
                ageGroup: true,
              },
            },
            opponentAcademy: {
              select: {
                id: true,
                name: true,
              },
            },
            opponentTeam: {
              select: {
                id: true,
                name: true,
                sport: true,
                ageGroup: true,
              },
            },
          },
        });

      await writeAuditLog({
        academyId: access.academyId,
        actorUserId: access.session.user.id,
        action:
          AUDIT_ACTIONS.INTER_ACADEMY_MATCH_REQUEST_CREATED,
        entityType: "InterAcademyMatchRequest",
        entityId: created.id,
        entityLabel:
          `${requesterTeam.name} vs ${opponentTeam.name}`,
        afterData: {
          status: created.status,
          requesterAcademyId: access.academyId,
          requesterTeamId: requesterTeam.id,
          opponentAcademyId: opponentAcademy.id,
          opponentTeamId: opponentTeam.id,
          startsAt: created.startsAt.toISOString(),
          endsAt:
            created.endsAt?.toISOString() ?? null,
          requesterIsHome: created.requesterIsHome,
          matchType: created.matchType,
        },
        metadata: {
          opponentAcademyName:
            opponentAcademy.name,
          opponentTeamName:
            opponentTeam.name,
        },
        tx,
      });

      await createInterAcademyNotification(
        tx,
        {
          academyId: opponentAcademy.id,
          teamId: opponentTeam.id,
          href: "/ndeshjet/inter-akademi",
          title:
            "K\u00ebrkes\u00eb e re inter-akademi",
          message:
            `${created.requesterAcademy.name} ju ka d\u00ebrguar nj\u00eb k\u00ebrkes\u00eb p\u00ebr ndeshje: ${created.requesterTeam.name} vs ${created.opponentTeam.name}.`,
        }
      );

      return created;
    }
  );
  return NextResponse.json(
    {
      matchRequest,
    },
    { status: 201 }
  );
}
