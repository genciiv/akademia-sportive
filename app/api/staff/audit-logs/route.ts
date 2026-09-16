import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.AUDIT_LOGS_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const auditLogs =
    await prisma.auditLog.findMany({
      where: {
        academyId: access.academyId,
      },

      orderBy: [
        { createdAt: "desc" },
        { id: "desc" },
      ],

      take: 100,

      select: {
        id: true,
        actorUserId: true,
        action: true,
        entityType: true,
        entityId: true,
        entityLabel: true,
        beforeData: true,
        afterData: true,
        metadata: true,
        createdAt: true,

        actorUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            name: true,
            email: true,
          },
        },
      },
    });

  return NextResponse.json({
    auditLogs,
  });
}