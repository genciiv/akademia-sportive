import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  canAccessTeam,
} from "@/lib/academy-resource-scope";
import {
  AUDIT_ACTIONS,
  writeAuditLog,
} from "@/lib/audit-log";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  {
    params,
  }: {
    params: Promise<{
      requestId: string;
    }>;
  }
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.MATCHES_CREATE
    );

  if (!access.ok) {
    return access.response;
  }

  if (access.academy.status !== "ACTIVE") {
    return NextResponse.json(
      {
        error:
          "Vetem akademite aktive mund te pranojne kerkesa per ndeshje.",
      },
      { status: 403 }
    );
  }

  const { requestId } = await params;

  const matchRequest =
    await prisma.interAcademyMatchRequest.findFirst({
      where: {
        id: requestId,
        opponentAcademyId: access.academyId,
      },
      include: {
        requesterAcademy: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        requesterTeam: {
          select: {
            id: true,
            academyId: true,
            name: true,
            sport: true,
            ageGroup: true,
            status: true,
          },
        },
        opponentAcademy: {
          select: {
            id: true,
            name: true,
            status: true,
          },
        },
        opponentTeam: {
          select: {
            id: true,
            academyId: true,
            name: true,
            sport: true,
            ageGroup: true,
            status: true,
          },
        },
        interAcademyMatch: {
          select: {
            id: true,
          },
        },
      },
    });

  if (!matchRequest) {
    return NextResponse.json(
      {
        error:
          "Kerkesa per ndeshje nuk u gjet.",
      },
      { status: 404 }
    );
  }

  if (matchRequest.status !== "PENDING") {
    return NextResponse.json(
      {
        error:
          "Vetem nje kerkese ne pritje mund te pranohet.",
      },
      { status: 409 }
    );
  }

  if (matchRequest.interAcademyMatch) {
    return NextResponse.json(
      {
        error:
          "Kjo kerkese ka tashme nje ndeshje inter-akademi.",
      },
      { status: 409 }
    );
  }

  if (
    matchRequest.requesterAcademy.status !== "ACTIVE" ||
    matchRequest.opponentAcademy.status !== "ACTIVE"
  ) {
    return NextResponse.json(
      {
        error:
          "Te dy akademite duhet te jene aktive.",
      },
      { status: 409 }
    );
  }

  if (
    matchRequest.requesterTeam.status !== "ACTIVE" ||
    matchRequest.opponentTeam.status !== "ACTIVE"
  ) {
    return NextResponse.json(
      {
        error:
          "Te dy ekipet duhet te jene aktive.",
      },
      { status: 409 }
    );
  }

  if (
    matchRequest.requesterTeam.academyId !==
      matchRequest.requesterAcademyId ||
    matchRequest.opponentTeam.academyId !==
      matchRequest.opponentAcademyId
  ) {
    return NextResponse.json(
      {
        error:
          "Ekipet nuk perputhen me akademite e kerkeses.",
      },
      { status: 409 }
    );
  }

  if (
    matchRequest.requesterTeam.sport !==
    matchRequest.opponentTeam.sport
  ) {
    return NextResponse.json(
      {
        error:
          "Ekipet duhet te jene te te njejtit sport.",
      },
      { status: 409 }
    );
  }

  if (matchRequest.startsAt <= new Date()) {
    return NextResponse.json(
      {
        error:
          "Nuk mund te pranohet nje kerkese per nje ndeshje qe ka filluar ose ka kaluar.",
      },
      { status: 409 }
    );
  }

  const hasTeamAccess =
    await canAccessTeam(
      access,
      matchRequest.opponentTeamId
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje per te menaxhuar ekipin marres.",
      },
      { status: 403 }
    );
  }

  try {
    const interAcademyMatch =
      await prisma.$transaction(
        async (tx) => {
          const accepted =
            await tx.interAcademyMatchRequest.updateMany({
              where: {
                id: matchRequest.id,
                opponentAcademyId:
                  access.academyId,
                status: "PENDING",
              },
              data: {
                status: "ACCEPTED",
                acceptedAt: new Date(),
              },
            });

          if (accepted.count !== 1) {
            throw new Error(
              "INTER_ACADEMY_REQUEST_NOT_PENDING"
            );
          }

          const homeAcademy =
            matchRequest.requesterIsHome
              ? matchRequest.requesterAcademy
              : matchRequest.opponentAcademy;

          const awayAcademy =
            matchRequest.requesterIsHome
              ? matchRequest.opponentAcademy
              : matchRequest.requesterAcademy;

          const homeTeam =
            matchRequest.requesterIsHome
              ? matchRequest.requesterTeam
              : matchRequest.opponentTeam;

          const awayTeam =
            matchRequest.requesterIsHome
              ? matchRequest.opponentTeam
              : matchRequest.requesterTeam;

          const homeMatch =
            await tx.match.create({
              data: {
                academyId:
                  homeAcademy.id,
                teamId:
                  homeTeam.id,
                opponentName:
                  awayAcademy.name,
                matchType:
                  matchRequest.matchType,
                status:
                  "SCHEDULED",
                startsAt:
                  matchRequest.startsAt,
                endsAt:
                  matchRequest.endsAt,
                location:
                  matchRequest.location,
                isHome:
                  true,
                competitionName:
                  matchRequest.competitionName,
                round:
                  matchRequest.round,
              },
            });

          const awayMatch =
            await tx.match.create({
              data: {
                academyId:
                  awayAcademy.id,
                teamId:
                  awayTeam.id,
                opponentName:
                  homeAcademy.name,
                matchType:
                  matchRequest.matchType,
                status:
                  "SCHEDULED",
                startsAt:
                  matchRequest.startsAt,
                endsAt:
                  matchRequest.endsAt,
                location:
                  matchRequest.location,
                isHome:
                  false,
                competitionName:
                  matchRequest.competitionName,
                round:
                  matchRequest.round,
              },
            });

          const canonical =
            await tx.interAcademyMatch.create({
              data: {
                requestId:
                  matchRequest.id,

                homeAcademyId:
                  homeAcademy.id,
                awayAcademyId:
                  awayAcademy.id,

                homeTeamId:
                  homeTeam.id,
                awayTeamId:
                  awayTeam.id,

                homeMatchId:
                  homeMatch.id,
                awayMatchId:
                  awayMatch.id,

                status:
                  "SCHEDULED",

                startsAt:
                  matchRequest.startsAt,
                endsAt:
                  matchRequest.endsAt,

                location:
                  matchRequest.location,
              },
              include: {
                homeAcademy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                awayAcademy: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
                homeTeam: {
                  select: {
                    id: true,
                    name: true,
                    sport: true,
                    ageGroup: true,
                  },
                },
                awayTeam: {
                  select: {
                    id: true,
                    name: true,
                    sport: true,
                    ageGroup: true,
                  },
                },
                homeMatch: true,
                awayMatch: true,
              },
            });

          await writeAuditLog({
            academyId:
              access.academyId,
            actorUserId:
              access.session.user.id,
            action:
              AUDIT_ACTIONS.INTER_ACADEMY_MATCH_REQUEST_ACCEPTED,
            entityType:
              "InterAcademyMatchRequest",
            entityId:
              matchRequest.id,
            entityLabel:
              `${matchRequest.requesterTeam.name} vs ${matchRequest.opponentTeam.name}`,
            beforeData: {
              status: "PENDING",
            },
            afterData: {
              status: "ACCEPTED",
              interAcademyMatchId:
                canonical.id,
              homeMatchId:
                homeMatch.id,
              awayMatchId:
                awayMatch.id,
            },
            metadata: {
              requesterAcademyId:
                matchRequest.requesterAcademyId,
              opponentAcademyId:
                matchRequest.opponentAcademyId,
            },
            tx,
          });

          return canonical;
        }
      );

    return NextResponse.json(
      {
        interAcademyMatch,
      },
      { status: 201 }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      error.message ===
        "INTER_ACADEMY_REQUEST_NOT_PENDING"
    ) {
      return NextResponse.json(
        {
          error:
            "Kerkesa eshte ndryshuar dhe nuk eshte me ne pritje.",
        },
        { status: 409 }
      );
    }

    throw error;
  }
}