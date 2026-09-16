import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import {
  AUDIT_ACTIONS,
  writeAuditLog,
} from "@/lib/audit-log";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const INVITATION_DURATION_DAYS = 7;

type RouteContext = {
  params: {
    invitationId: string;
  };
};

export async function POST(
  _request: Request,
  { params }: RouteContext
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_INVITE
    );

  if (!access.ok) {
    return access.response;
  }

  const invitation =
    await prisma.academyInvitation.findFirst({
      where: {
        id: params.invitationId,
        academyId:
          access.academyId,
        acceptedAt: null,
        revokedAt: null,
      },
      select: {
        id: true,
        academyId: true,
        staffId: true,
        email: true,
        role: true,
      },
    });

  if (!invitation) {
    return NextResponse.json(
      {
        error:
          "Ftesa nuk u gjet ose nuk është më aktive.",
      },
      {
        status: 404,
      }
    );
  }

  if (invitation.role === "OWNER") {
    return NextResponse.json(
      {
        error:
          "Ftesa e pronarit nuk mund të ridërgohet.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    invitation.role === "ADMIN" &&
    access.role !== "OWNER"
  ) {
    return NextResponse.json(
      {
        error:
          "Vetëm pronari mund të ridërgojë ftesën e një administratori.",
      },
      {
        status: 403,
      }
    );
  }

  const now = new Date();

  const token =
    randomBytes(32).toString(
      "hex"
    );

  const expiresAt =
    new Date(
      now.getTime() +
        INVITATION_DURATION_DAYS *
          24 *
          60 *
          60 *
          1000
    );

  const newInvitation =
    await prisma.$transaction(
      async (tx) => {
        await tx.academyInvitation.update({
          where: {
            id: invitation.id,
          },
          data: {
            revokedAt: now,
          },
        });

        const created =
          await tx.academyInvitation.create({
            data: {
              academyId:
                invitation.academyId,
              staffId:
                invitation.staffId,
              email:
                invitation.email,
              role:
                invitation.role,
              token,
              expiresAt,
              invitedByUserId:
                access.session.user.id,
            },
            select: {
              id: true,
              expiresAt: true,
            },
          });

        await writeAuditLog({
          tx,
          academyId:
            access.academyId,
          actorUserId:
            access.session.user.id,
          action:
            AUDIT_ACTIONS.STAFF_INVITATION_RESENT,
          entityType:
            "STAFF_INVITATION",
          entityId:
            created.id,
          entityLabel:
            invitation.email,
          beforeData: {
            invitationId:
              invitation.id,
            status:
              "REVOKED",
          },
          afterData: {
            invitationId:
              created.id,
            role:
              String(
                invitation.role
              ),
            expiresAt:
              created.expiresAt.toISOString(),
            status:
              "PENDING",
          },
          metadata: {
            previousInvitationId:
              invitation.id,
            ...(invitation.staffId
              ? {
                  staffId:
                    invitation.staffId,
                }
              : {}),
          },
        });

        return created;
      }
    );

  return NextResponse.json(
    {
      message:
        "Ftesa u ridërgua me sukses.",
      invitation: {
        id:
          newInvitation.id,
        invitePath:
          `/ftesa/${token}`,
        expiresAt:
          newInvitation.expiresAt,
      },
    },
    {
      status: 201,
    }
  );
}