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
  ROLE_LABELS,
  type AcademyRoleName,
} from "@/lib/permissions";
import { sendStaffInvitationEmail } from "@/lib/invitation-email";
import { prisma } from "@/lib/prisma";

const INVITATION_DURATION_DAYS = 7;

type RouteContext = {
  params: Promise<{
    staffId: string;
  }>;
};

function normalizeEmail(
  value: string | null
) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isValidEmail(
  email: string
) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
}

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

  const staff =
    await prisma.academyStaff.findFirst({
      where: {
        id: (await params).staffId,
        academyId:
          access.academyId,
        status: {
          not: "LEFT",
        },
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        membershipId: true,
      },
    });

  if (!staff) {
    return NextResponse.json(
      {
        error:
          "Anëtari i stafit nuk u gjet.",
      },
      {
        status: 404,
      }
    );
  }

  if (staff.membershipId) {
    const linkedMembership =
      await prisma.academyMembership.findFirst({
        where: {
          id: staff.membershipId,
          academyId:
            access.academyId,
        },
        select: {
          id: true,
          status: true,
        },
      });

    if (
      linkedMembership &&
      linkedMembership.status !== "REMOVED"
    ) {
      return NextResponse.json(
        {
          error:
            "Ky anëtar i stafit ka tashmë akses në platformë.",
        },
        {
          status: 409,
        }
      );
    }
  }

  const email =
    normalizeEmail(
      staff.email
    );

  if (!isValidEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Anëtari i stafit duhet të ketë një adresë elektronike të vlefshme para se të ftohet.",
      },
      {
        status: 400,
      }
    );
  }

  const role =
    String(
      staff.role
    ) as AcademyRoleName;

  const entityLabel =
    [
      staff.firstName,
      staff.lastName,
    ]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    email ||
    staff.id;

  if (role === "OWNER") {
    return NextResponse.json(
      {
        error:
          "Pronari nuk ftohet nga ky veprim.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    role === "ADMIN" &&
    access.role !== "OWNER"
  ) {
    return NextResponse.json(
      {
        error:
          "Vetëm pronari mund të ftojë një administrator.",
      },
      {
        status: 403,
      }
    );
  }

  const existingMembership =
    await prisma.academyMembership.findFirst({
      where: {
        academyId:
          access.academyId,

        status: {
          not: "REMOVED",
        },

        user: {
          email: {
            equals: email,
            mode: "insensitive",
          },
        },
      },

      select: {
        id: true,
      },
    });

  if (existingMembership) {
    await prisma.$transaction(
      async (tx) => {
        await tx.academyStaff.update({
          where: {
            id: staff.id,
          },

          data: {
            membershipId:
              existingMembership.id,
          },
        });

        await tx.coach.updateMany({
          where: {
            staffId: staff.id,
          },

          data: {
            membershipId:
              existingMembership.id,
          },
        });

        await writeAuditLog({
          tx,
          academyId:
            access.academyId,
          actorUserId:
            access.session.user.id,
          action:
            AUDIT_ACTIONS.STAFF_ACCOUNT_LINKED,
          entityType:
            "STAFF_PROFILE",
          entityId:
            staff.id,
          entityLabel,
          beforeData: {
            membershipId:
              staff.membershipId,
          },
          afterData: {
            membershipId:
              existingMembership.id,
          },
          metadata: {
            email,
            role,
          },
        });
      }
    );

    return NextResponse.json({
      message:
        "Llogaria ekzistuese u lidh me anëtarin e stafit.",
      accessLinked: true,
    });
  }

  const now = new Date();

  const existingInvitation =
    await prisma.academyInvitation.findFirst({
      where: {
        academyId:
          access.academyId,

        staffId:
          staff.id,

        acceptedAt: null,
        revokedAt: null,

        expiresAt: {
          gt: now,
        },
      },

      select: {
        id: true,
        token: true,
        expiresAt: true,
      },
    });

  if (existingInvitation) {
    const emailDelivery =
      await sendStaffInvitationEmail({
        email,
        staffName: entityLabel,
        academyName:
          access.academy.name,
        roleLabel:
          ROLE_LABELS[role] ??
          "Anëtar",
        invitationToken:
          existingInvitation.token,
        expiresAt:
          existingInvitation.expiresAt,
      });
    return NextResponse.json({
      emailDelivery,
      message:
        "Ekziston tashmë një ftesë aktive për këtë anëtar të stafit.",

      invitation: {
        id:
          existingInvitation.id,

        invitePath:
          `/ftesa/${existingInvitation.token}`,

        expiresAt:
          existingInvitation.expiresAt,
      },
    });
  }

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

  const invitation =
    await prisma.$transaction(
      async (tx) => {
        await tx.academyInvitation.updateMany({
          where: {
            academyId:
              access.academyId,

            staffId:
              staff.id,

            acceptedAt: null,
            revokedAt: null,

            expiresAt: {
              lte: now,
            },
          },

          data: {
            revokedAt: now,
          },
        });

        const created =
          await tx.academyInvitation.create({
            data: {
              academyId:
                access.academyId,

              staffId:
                staff.id,

              email,
              role:
                staff.role,

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
            AUDIT_ACTIONS.STAFF_INVITATION_CREATED,
          entityType:
            "STAFF_INVITATION",
          entityId:
            created.id,
          entityLabel,
          afterData: {
            email,
            role,
            status:
              "PENDING",
            expiresAt:
              created.expiresAt.toISOString(),
          },
          metadata: {
            staffId:
              staff.id,
          },
        });

        return created;
      }
    );

  const emailDelivery =
    await sendStaffInvitationEmail({
      email,
      staffName: entityLabel,
      academyName:
        access.academy.name,
      roleLabel:
        ROLE_LABELS[role] ??
        "Anëtar",
      invitationToken: token,
      expiresAt:
        invitation.expiresAt,
    });
  return NextResponse.json(
    {
      emailDelivery,
      message:
        "Ftesa u krijua me sukses.",

      invitation: {
        id:
          invitation.id,

        email,

        role,
        roleLabel:
          ROLE_LABELS[role] ??
          "Anëtar",

        invitePath:
          `/ftesa/${token}`,

        expiresAt:
          invitation.expiresAt,
      },
    },
    {
      status: 201,
    }
  );
}