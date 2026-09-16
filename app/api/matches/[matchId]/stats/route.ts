import { NextResponse } from "next/server";
import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessMatch,
} from "@/lib/academy-resource-scope";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ matchId: string }> }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.MATCHES_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const { academyId } = access;

  const match =
    await prisma.match.findFirst({
      where: {
        id: (await params).matchId,
        academyId:
          academyId,
      },
      select: {
        id: true,
        opponentName: true,
        startsAt: true,
        status: true,
        ourScore: true,
        opponentScore: true,
        team: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!match) {
    return NextResponse.json(
      {
        error: "Ndeshja nuk u gjet.",
      },
      { status: 404 }
    );
  }
  const hasMatchAccess =
    await canAccessMatch(
      access,
      match.id
    );

  if (!hasMatchAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje për të aksesuar këtë ndeshje.",
      },
      { status: 403 }
    );
  }

  const [matchPlayers, events] =
    await Promise.all([
      prisma.matchPlayer.findMany({
        where: {
          matchId: match.id,
          player: {
            academyId:
              academyId,
          },
        },
        include: {
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
          {
            role: "asc",
          },
          {
            player: {
              firstName: "asc",
            },
          },
          {
            player: {
              lastName: "asc",
            },
          },
        ],
      }),

      prisma.matchEvent.findMany({
        where: {
          matchId: match.id,
        },
        select: {
          id: true,
          playerId: true,
          type: true,
          minute: true,
          extraMinute: true,
        },
      }),
    ]);

  const playerStatistics =
    matchPlayers.map(
      (matchPlayer) => {
        const playerEvents =
          events.filter(
            (event) =>
              event.playerId ===
              matchPlayer.playerId
          );

        const goals =
          playerEvents.filter(
            (event) =>
              event.type === "GOAL"
          ).length;

        const assists =
          playerEvents.filter(
            (event) =>
              event.type === "ASSIST"
          ).length;

        const yellowCards =
          playerEvents.filter(
            (event) =>
              event.type ===
              "YELLOW_CARD"
          ).length;

        const redCards =
          playerEvents.filter(
            (event) =>
              event.type ===
              "RED_CARD"
          ).length;

        const substitutionsIn =
          playerEvents.filter(
            (event) =>
              event.type ===
              "SUBSTITUTION_IN"
          ).length;

        const substitutionsOut =
          playerEvents.filter(
            (event) =>
              event.type ===
              "SUBSTITUTION_OUT"
          ).length;

        return {
          matchPlayerId:
            matchPlayer.id,

          playerId:
            matchPlayer.playerId,

          player:
            matchPlayer.player,

          role:
            matchPlayer.role,

          jerseyNumber:
            matchPlayer.jerseyNumber,

          position:
            matchPlayer.position,

          minutesPlayed:
            matchPlayer.minutesPlayed,

          started:
            matchPlayer.role ===
            "STARTER",

          enteredFromBench:
            substitutionsIn > 0,

          substitutedOut:
            substitutionsOut > 0,

          goals,
          assists,
          yellowCards,
          redCards,
          substitutionsIn,
          substitutionsOut,

          totalEvents:
            playerEvents.length,
        };
      }
    );

  const totals = {
    players:
      playerStatistics.length,

    starters:
      playerStatistics.filter(
        (player) =>
          player.role === "STARTER"
      ).length,

    substitutes:
      playerStatistics.filter(
        (player) =>
          player.role === "SUBSTITUTE"
      ).length,

    minutesPlayed:
      playerStatistics.reduce(
        (total, player) =>
          total +
          player.minutesPlayed,
        0
      ),

    goals:
      playerStatistics.reduce(
        (total, player) =>
          total + player.goals,
        0
      ),

    assists:
      playerStatistics.reduce(
        (total, player) =>
          total + player.assists,
        0
      ),

    yellowCards:
      playerStatistics.reduce(
        (total, player) =>
          total +
          player.yellowCards,
        0
      ),

    redCards:
      playerStatistics.reduce(
        (total, player) =>
          total +
          player.redCards,
        0
      ),
  };

  return NextResponse.json({
    match,
    playerStatistics,
    totals,
  });
}
