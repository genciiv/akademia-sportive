import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import {
  ROLE_LABELS,
  type AcademyRoleName,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: {
    token: string;
  };
};

function normalizeEmail(
  email: string
) {
  return email
    .trim()
    .toLowerCase();
}

export async function GET(
  _request: Request,
  { params }: RouteContext
) {
  const invitation =
    await prisma.academyInvitation.findUnique({
      where: {
        token: params.token,
      },
      select: {
        id: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
        academy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

  if (!invitation) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë nuk ekziston.",
      },
      {
        status: 404,
      }
    );
  }

  if (invitation.revokedAt) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë është anuluar.",
      },
      {
        status: 410,
      }
    );
  }

  if (invitation.acceptedAt) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë është pranuar tashmë.",
      },
      {
        status: 410,
      }
    );
  }

  if (
    invitation.expiresAt <=
    new Date()
  ) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë ka skaduar.",
      },
      {
        status: 410,
      }
    );
  }

  const role =
    String(
      invitation.role
    ) as AcademyRoleName;

  return NextResponse.json({
    invitation: {
      email:
        invitation.email,
      role,
      roleLabel:
        ROLE_LABELS[role] ??
        "Anëtar",
      expiresAt:
        invitation.expiresAt,
      academy: {
        id:
          invitation.academy.id,
        name:
          invitation.academy.name,
      },
    },
  });
}

export async function POST(
  _request: Request,
  { params }: RouteContext
) {
  const session =
    await auth.api.getSession({
      headers: headers(),
    });

  if (!session?.user?.id) {
    return NextResponse.json(
      {
        error:
          "Duhet të identifikohesh për të pranuar ftesën.",
      },
      {
        status: 401,
      }
    );
  }

  const invitation =
    await prisma.academyInvitation.findUnique({
      where: {
        token: params.token,
      },
      select: {
        id: true,
        academyId: true,
        email: true,
        role: true,
        expiresAt: true,
        acceptedAt: true,
        revokedAt: true,
      },
    });

  if (!invitation) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë nuk ekziston.",
      },
      {
        status: 404,
      }
    );
  }

  if (invitation.revokedAt) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë është anuluar.",
      },
      {
        status: 410,
      }
    );
  }

  if (invitation.acceptedAt) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë është pranuar tashmë.",
      },
      {
        status: 410,
      }
    );
  }

  if (
    invitation.expiresAt <=
    new Date()
  ) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë ka skaduar.",
      },
      {
        status: 410,
      }
    );
  }

  const sessionEmail =
    normalizeEmail(
      session.user.email || ""
    );

  const invitationEmail =
    normalizeEmail(
      invitation.email
    );

  if (
    !sessionEmail ||
    sessionEmail !==
      invitationEmail
  ) {
    return NextResponse.json(
      {
        error:
          "Kjo ftesë është dërguar për një adresë tjetër elektronike.",
      },
      {
        status: 403,
      }
    );
  }

  const existingMembership =
    await prisma.academyMembership.findUnique({
      where: {
        userId_academyId: {
          userId:
            session.user.id,
          academyId:
            invitation.academyId,
        },
      },
      select: {
        id: true,
        status: true,
      },
    });

  const result =
    await prisma.$transaction(
      async (tx) => {
        let membership;

        if (existingMembership) {
          membership =
            await tx.academyMembership.update({
              where: {
                id:
                  existingMembership.id,
              },
              data: {
                role:
                  invitation.role,
                status: "ACTIVE",
              },
              select: {
                id: true,
                role: true,
                status: true,
              },
            });
        } else {
          membership =
            await tx.academyMembership.create({
              data: {
                userId:
                  session.user.id,
                academyId:
                  invitation.academyId,
                role:
                  invitation.role,
                status:
                  "ACTIVE",
              },
              select: {
                id: true,
                role: true,
                status: true,
              },
            });
        }

        await tx.academyInvitation.update({
          where: {
            id:
              invitation.id,
          },
          data: {
            acceptedAt:
              new Date(),
          },
        });

        return membership;
      }
    );

  return NextResponse.json({
    message:
      "Ftesa u pranua me sukses.",
    membership: {
      id: result.id,
      role:
        String(
          result.role
        ),
      status:
        String(
          result.status
        ),
    },
  });
}