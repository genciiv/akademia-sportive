import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessMatch,
} from "@/lib/academy-resource-scope";
import { PERMISSIONS, type Permission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const FORMATIONS = {
  "4-3-3": [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LCM",
    "CM",
    "RCM",
    "LW",
    "ST",
    "RW",
  ],
  "4-4-2": [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LM",
    "LCM",
    "RCM",
    "RM",
    "LST",
    "RST",
  ],
  "4-2-3-1": [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LDM",
    "RDM",
    "LW",
    "CAM",
    "RW",
    "ST",
  ],
  "3-5-2": [
    "GK",
    "LCB",
    "CB",
    "RCB",
    "LWB",
    "LCM",
    "CM",
    "RCM",
    "RWB",
    "LST",
    "RST",
  ],
  "5-3-2": [
    "GK",
    "LWB",
    "LCB",
    "CB",
    "RCB",
    "RWB",
    "LCM",
    "CM",
    "RCM",
    "LST",
    "RST",
  ],
  "4-5-1": [
    "GK",
    "LB",
    "LCB",
    "RCB",
    "RB",
    "LM",
    "LCM",
    "CM",
    "RCM",
    "RM",
    "ST",
  ],
  "3-4-3": [
    "GK",
    "LCB",
    "CB",
    "RCB",
    "LM",
    "LCM",
    "RCM",
    "RM",
    "LW",
    "ST",
    "RW",
  ],
} as const;

type FormationName = keyof typeof FORMATIONS;

type Assignment = {
  playerId: string;
  slot: string;
};

async function getMatch(
  matchId: string,
  academyId: string
) {
  return prisma.match.findFirst({
    where: {
      id: matchId,
      academyId,
    },
    select: {
      id: true,
      academyId: true,
      teamId: true,
      opponentName: true,
      lineupFormation: true,
      lineupPublishedAt: true,
      team: {
        select: {
          id: true,
          name: true,
          sport: true,
        },
      },
    },
  });
}

async function requireMatchAccess(
  matchId: string,
  permission: Permission
) {
  const access =
    await requireAcademyPermission(
      permission
    );

  if (!access.ok) {
    return {
      ok: false as const,
      response: access.response,
    };
  }

  const match = await getMatch(
    matchId,
    access.academyId
  );

  if (!match) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "Ndeshja nuk u gjet." },
        { status: 404 }
      ),
    };
  }

  const hasAccess =
    await canAccessMatch(
      access,
      match.id
    );

  if (!hasAccess) {
    return {
      ok: false as const,
      response: NextResponse.json(
        {
          error:
            "Nuk ke leje për të aksesuar këtë ndeshje.",
        },
        { status: 403 }
      ),
    };
  }

  return {
    ok: true as const,
    access,
    match,
  };
}

export async function GET(
  _request: Request,
  { params }: {
    params: Promise<{ matchId: string }>;
  }
) {
  const { matchId } = await params;

  const result =
    await requireMatchAccess(
      matchId,
      PERMISSIONS.MATCHES_VIEW
    );

  if (!result.ok) {
    return result.response;
  }

  const squad =
    await prisma.matchPlayer.findMany({
      where: {
        matchId: result.match.id,
      },
      select: {
        id: true,
        playerId: true,
        role: true,
        lineupSlot: true,
        jerseyNumber: true,
        position: true,
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            position: true,
            jerseyNumber: true,
          },
        },
      },
      orderBy: [
        { role: "asc" },
        {
          player: {
            firstName: "asc",
          },
        },
      ],
    });

  return NextResponse.json({
    match: {
      id: result.match.id,
      teamId: result.match.teamId,
      teamName: result.match.team.name,
      opponentName:
        result.match.opponentName,
      sport: result.match.team.sport,
      formation:
        result.match.lineupFormation,
      publishedAt:
        result.match.lineupPublishedAt,
    },
    formations: FORMATIONS,
    squad,
  });
}

export async function PATCH(
  request: Request,
  { params }: {
    params: Promise<{ matchId: string }>;
  }
) {
  const { matchId } = await params;

  const result =
    await requireMatchAccess(
      matchId,
      PERMISSIONS.MATCH_SQUAD_MANAGE
    );

  if (!result.ok) {
    return result.response;
  }

  if (result.match.team.sport !== "FOOTBALL") {
    return NextResponse.json(
      {
        error:
          "Formation Board është i disponueshëm vetëm për futboll.",
      },
      { status: 400 }
    );
  }

  const body = await request.json();

  const action = String(
    body.action || "SAVE"
  ).trim();

  if (action === "UNPUBLISH") {
    await prisma.match.update({
      where: {
        id: result.match.id,
      },
      data: {
        lineupPublishedAt: null,
      },
    });

    return NextResponse.json({
      success: true,
      publishedAt: null,
    });
  }

  if (action === "PUBLISH") {
    if (!result.match.lineupFormation) {
      return NextResponse.json(
        {
          error:
            "Ruaj formacionin përpara publikimit.",
        },
        { status: 400 }
      );
    }

    const formation =
      result.match.lineupFormation as FormationName;

    if (!FORMATIONS[formation]) {
      return NextResponse.json(
        {
          error:
            "Formacioni i ruajtur nuk është i vlefshëm.",
        },
        { status: 400 }
      );
    }

    const starters =
      await prisma.matchPlayer.findMany({
        where: {
          matchId: result.match.id,
          role: "STARTER",
        },
        select: {
          playerId: true,
          lineupSlot: true,
        },
      });

    const expectedSlots =
      FORMATIONS[formation];

    const usedSlots = new Set(
      starters
        .map((item) => item.lineupSlot)
        .filter(
          (slot): slot is string =>
            Boolean(slot)
        )
    );

    const complete =
      starters.length === expectedSlots.length &&
      expectedSlots.every(
        (slot) => usedSlots.has(slot)
      );

    if (!complete) {
      return NextResponse.json(
        {
          error:
            "Plotëso të 11 pozicionet e formacionit përpara publikimit.",
        },
        { status: 400 }
      );
    }

    const publishedAt = new Date();

    await prisma.match.update({
      where: {
        id: result.match.id,
      },
      data: {
        lineupPublishedAt: publishedAt,
      },
    });

    return NextResponse.json({
      success: true,
      publishedAt,
    });
  }

  if (action !== "SAVE") {
    return NextResponse.json(
      {
        error:
          "Veprimi i formacionit nuk është i vlefshëm.",
      },
      { status: 400 }
    );
  }

  const formation = String(
    body.formation || ""
  ).trim() as FormationName;

  if (!FORMATIONS[formation]) {
    return NextResponse.json(
      {
        error:
          "Zgjidh një formacion të vlefshëm.",
      },
      { status: 400 }
    );
  }

  if (!Array.isArray(body.assignments)) {
    return NextResponse.json(
      {
        error:
          "Pozicionet e formacionit nuk janë të vlefshme.",
      },
      { status: 400 }
    );
  }

  const assignments: Assignment[] =
    body.assignments.map(
      (item: unknown) => {
        const value =
          item as Record<string, unknown>;

        return {
          playerId: String(
            value.playerId || ""
          ).trim(),
          slot: String(
            value.slot || ""
          ).trim(),
        };
      }
    );

  if (assignments.length > 11) {
    return NextResponse.json(
      {
        error:
          "Formacioni nuk mund të ketë më shumë se 11 titullarë.",
      },
      { status: 400 }
    );
  }

  if (
    assignments.some(
      (item) =>
        !item.playerId ||
        !FORMATIONS[formation].includes(
          item.slot as never
        )
    )
  ) {
    return NextResponse.json(
      {
        error:
          "Një ose më shumë pozicione nuk janë të vlefshme për këtë formacion.",
      },
      { status: 400 }
    );
  }

  const playerIds =
    assignments.map(
      (item) => item.playerId
    );

  const slots =
    assignments.map(
      (item) => item.slot
    );

  if (
    new Set(playerIds).size !==
      playerIds.length ||
    new Set(slots).size !== slots.length
  ) {
    return NextResponse.json(
      {
        error:
          "I njëjti sportist ose pozicion nuk mund të përdoret dy herë.",
      },
      { status: 400 }
    );
  }

  const teamPlayers =
    playerIds.length === 0
      ? []
      : await prisma.teamPlayer.findMany({
          where: {
            teamId: result.match.teamId,
            playerId: {
              in: playerIds,
            },
            isActive: true,
            player: {
              academyId:
                result.access.academyId,
              status: {
                not: "LEFT",
              },
            },
          },
          select: {
            playerId: true,
            player: {
              select: {
                position: true,
                jerseyNumber: true,
              },
            },
          },
        });

  if (teamPlayers.length !== playerIds.length) {
    return NextResponse.json(
      {
        error:
          "Një ose më shumë sportistë nuk janë pjesë aktive e ekipit.",
      },
      { status: 400 }
    );
  }

  const teamPlayerById = new Map(
    teamPlayers.map((item) => [
      item.playerId,
      item,
    ])
  );

  await prisma.$transaction(
    async (tx) => {
      await tx.match.update({
        where: {
          id: result.match.id,
        },
        data: {
          lineupFormation: formation,
          lineupPublishedAt: null,
        },
      });

      await tx.matchPlayer.updateMany({
        where: {
          matchId: result.match.id,
        },
        data: {
          role: "SUBSTITUTE",
          lineupSlot: null,
        },
      });

      for (const assignment of assignments) {
        const teamPlayer =
          teamPlayerById.get(
            assignment.playerId
          );

        if (!teamPlayer) {
          continue;
        }

        await tx.matchPlayer.upsert({
          where: {
            matchId_playerId: {
              matchId: result.match.id,
              playerId:
                assignment.playerId,
            },
          },
          create: {
            matchId: result.match.id,
            playerId:
              assignment.playerId,
            role: "STARTER",
            lineupSlot:
              assignment.slot,
            position:
              teamPlayer.player.position,
            jerseyNumber:
              teamPlayer.player.jerseyNumber,
          },
          update: {
            role: "STARTER",
            lineupSlot:
              assignment.slot,
          },
        });
      }
    }
  );

  const squad =
    await prisma.matchPlayer.findMany({
      where: {
        matchId: result.match.id,
      },
      select: {
        id: true,
        playerId: true,
        role: true,
        lineupSlot: true,
        jerseyNumber: true,
        position: true,
        player: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

  return NextResponse.json({
    success: true,
    formation,
    publishedAt: null,
    squad,
  });
}
