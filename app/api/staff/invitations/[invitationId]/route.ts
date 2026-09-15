import { NextResponse } from "next/server";

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

  await prisma.academyInvitation.update({
    where: {
      id: invitation.id,
    },
    data: {
      revokedAt: new Date(),
    },
  });

  return NextResponse.json({
    message:
      "Ftesa u revokua me sukses.",
  });
}