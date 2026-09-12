import { randomBytes } from "crypto";
import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  ACADEMY_ROLES,
  PERMISSIONS,
  ROLE_LABELS,
  type AcademyRoleName,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

const INVITATION_DURATION_DAYS = 7;

function isAcademyRole(
  value: unknown
): value is AcademyRoleName {
  return Object.values(
    ACADEMY_ROLES
  ).includes(
    value as AcademyRoleName
  );
}

function normalizeEmail(
  value: unknown
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

export async function GET() {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_VIEW
    );

  if (!access.ok) {
    return access.response;
  }

  const now = new Date();

  const invitations =
    await prisma.academyInvitation.findMany({
      where: {
        academyId:
          access.academyId,
        acceptedAt: null,
        revokedAt: null,
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        createdAt: true,

        invitedByUser: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

  return NextResponse.json({
    invitations:
      invitations.map(
        (invitation) => {
          const role =
            String(
              invitation.role
            ) as AcademyRoleName;

          const isExpired =
            invitation.expiresAt <=
            now;

          return {
            id: invitation.id,
            email:
              invitation.email,
            role,
            roleLabel:
              ROLE_LABELS[role] ??
              "Anëtar",
            expiresAt:
              invitation.expiresAt,
            createdAt:
              invitation.createdAt,
            invitePath:
              `/ftesa/${invitation.token}`,
            status:
              isExpired
                ? "EXPIRED"
                : "PENDING",
            statusLabel:
              isExpired
                ? "Skaduar"
                : "Në pritje",
            invitedBy:
              invitation.invitedByUser,
          };
        }
      ),
  });
}

export async function POST(
  request: Request
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_INVITE
    );

  if (!access.ok) {
    return access.response;
  }

  let body: {
    email?: unknown;
    role?: unknown;
  };

  try {
    body =
      await request.json();
  } catch {
    return NextResponse.json(
      {
        error:
          "Të dhënat e dërguara nuk janë të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const email =
    normalizeEmail(
      body.email
    );

  if (!isValidEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Vendos një adresë elektronike të vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (!isAcademyRole(body.role)) {
    return NextResponse.json(
      {
        error:
          "Roli i zgjedhur nuk është i vlefshëm.",
      },
      {
        status: 400,
      }
    );
  }

  const role = body.role;

  if (role === "OWNER") {
    return NextResponse.json(
      {
        error:
          "Roli Pronar nuk mund të caktohet përmes një ftese.",
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
          email,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

  if (existingMembership) {
    return NextResponse.json(
      {
        error:
          "Ky përdorues është tashmë pjesë e stafit të akademisë.",
      },
      {
        status: 409,
      }
    );
  }

  const now = new Date();

  const existingInvitation =
    await prisma.academyInvitation.findFirst({
      where: {
        academyId:
          access.academyId,
        email,
        acceptedAt: null,
        revokedAt: null,
        expiresAt: {
          gt: now,
        },
      },
      select: {
        id: true,
      },
    });

  if (existingInvitation) {
    return NextResponse.json(
      {
        error:
          "Ekziston tashmë një ftesë aktive për këtë adresë elektronike.",
      },
      {
        status: 409,
      }
    );
  }

  await prisma.academyInvitation.updateMany({
    where: {
      academyId:
        access.academyId,
      email,
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

  const expiresAt =
    new Date(
      now.getTime() +
        INVITATION_DURATION_DAYS *
          24 *
          60 *
          60 *
          1000
    );

  const token =
    randomBytes(32).toString(
      "hex"
    );

  const invitation =
    await prisma.academyInvitation.create({
      data: {
        academyId:
          access.academyId,
        email,
        role,
        token,
        expiresAt,
        invitedByUserId:
          access.session.user.id,
      },
      select: {
        id: true,
        email: true,
        role: true,
        token: true,
        expiresAt: true,
        createdAt: true,
      },
    });

  return NextResponse.json(
    {
      invitation: {
        id: invitation.id,
        email:
          invitation.email,
        role,
        roleLabel:
          ROLE_LABELS[role] ??
          "Anëtar",
        expiresAt:
          invitation.expiresAt,
        createdAt:
          invitation.createdAt,
        status:
          "PENDING",
        statusLabel:
          "Në pritje",
        invitePath:
          `/ftesa/${token}`,
      },
      message:
        "Ftesa u krijua me sukses.",
    },
    {
      status: 201,
    }
  );
}