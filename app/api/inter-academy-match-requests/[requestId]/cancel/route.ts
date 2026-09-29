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
import { createInterAcademyNotification } from "@/lib/inter-academy-notifications";

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
      PERMISSIONS.MATCHES_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const { requestId } = await params;

  const matchRequest =
    await prisma.interAcademyMatchRequest.findFirst({
      where: {
        id: requestId,
        requesterAcademyId: access.academyId,
      },
      include: {
        requesterTeam: {
          select: {
            id: true,
            name: true,
          },
        },
        opponentTeam: {
          select: {
            id: true,
            name: true,
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
          "Vetem nje kerkese ne pritje mund te anulohet.",
      },
      { status: 409 }
    );
  }

  const hasTeamAccess =
    await canAccessTeam(
      access,
      matchRequest.requesterTeamId
    );

  if (!hasTeamAccess) {
    return NextResponse.json(
      {
        error:
          "Nuk ke leje per te menaxhuar ekipin dergues.",
      },
      { status: 403 }
    );
  }

  try {
    const cancelledRequest =
      await prisma.$transaction(
        async (tx) => {
          const cancelled =
            await tx.interAcademyMatchRequest.updateMany({
              where: {
                id: matchRequest.id,
                requesterAcademyId:
                  access.academyId,
                status: "PENDING",
              },
              data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
              },
            });

          if (cancelled.count !== 1) {
            throw new Error(
              "INTER_ACADEMY_REQUEST_NOT_PENDING"
            );
          }

          const updated =
            await tx.interAcademyMatchRequest.findUnique({
              where: {
                id: matchRequest.id,
              },
            });

          if (!updated) {
            throw new Error(
              "INTER_ACADEMY_REQUEST_NOT_FOUND"
            );
          }

          await writeAuditLog({
            academyId:
              access.academyId,
            actorUserId:
              access.session.user.id,
            action:
              AUDIT_ACTIONS.INTER_ACADEMY_MATCH_REQUEST_CANCELLED,
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
              status: "CANCELLED",
              cancelledAt:
                updated.cancelledAt?.toISOString() ?? null,
            },
            metadata: {
              requesterAcademyId:
                matchRequest.requesterAcademyId,
              opponentAcademyId:
                matchRequest.opponentAcademyId,
            },
            tx,
          });

          await createInterAcademyNotification(
            tx,
            {
              academyId:
                matchRequest.opponentAcademyId,
              teamId:
                matchRequest.opponentTeamId,
              href: "/ndeshjet/inter-akademi",
              title:
                "K\u00ebrkesa inter-akademi u anulua",
              message:
                `Akademia d\u00ebrguese anuloi k\u00ebrkes\u00ebn p\u00ebr ndeshje: ${matchRequest.requesterTeam.name} vs ${matchRequest.opponentTeam.name}.`,
            }
          );

          return updated;
        }
      );

    return NextResponse.json({
      request: cancelledRequest,
    });
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

    if (
      error instanceof Error &&
      error.message ===
        "INTER_ACADEMY_REQUEST_NOT_FOUND"
    ) {
      return NextResponse.json(
        {
          error:
            "Kerkesa per ndeshje nuk u gjet.",
        },
        { status: 404 }
      );
    }

    throw error;
  }
}