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

type RouteContext = {
  params: {
    invitationId: string;
  };
};

export async function DELETE(
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
        role: true,
        email: true,
        staffId: true,
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
          "Ftesa e pronarit nuk mund të menaxhohet nga ky veprim.",
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
          "Vetëm pronari mund të menaxhojë ftesën e një administratori.",
      },
      {
        status: 403,
      }
    );
  }

  const revokedAt =
    new Date();

  await prisma.$transaction(
    async (tx) => {
      await tx.academyInvitation.update({
        where: {
          id: invitation.id,
        },
        data: {
          revokedAt,
        },
      });

      await writeAuditLog({
        tx,
        academyId:
          access.academyId,
        actorUserId:
          access.session.user.id,
        action:
          AUDIT_ACTIONS.STAFF_INVITATION_REVOKED,
        entityType:
          "STAFF_INVITATION",
        entityId:
          invitation.id,
        entityLabel:
          invitation.email,
        beforeData: {
          role:
            String(
              invitation.role
            ),
          status:
            "PENDING",
        },
        afterData: {
          role:
            String(
              invitation.role
            ),
          status:
            "REVOKED",
          revokedAt:
            revokedAt.toISOString(),
        },
        metadata: {
          ...(invitation.staffId
            ? {
                staffId:
                  invitation.staffId,
              }
            : {}),
        },
      });
    }
  );

  return NextResponse.json({
    message:
      "Ftesa u revokua me sukses.",
  });
}