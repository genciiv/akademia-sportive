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

type RouteContext = {
  params: {
    membershipId: string;
  };
};

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktiv",
  INVITED: "Ftesë në pritje",
  SUSPENDED: "Pezulluar",
  REMOVED: "Hequr",
};

function isAcademyRole(
  value: unknown
): value is AcademyRoleName {
  return Object.values(
    ACADEMY_ROLES
  ).includes(
    value as AcademyRoleName
  );
}

async function getTargetMembership(
  academyId: string,
  membershipId: string
) {
  return prisma.academyMembership.findFirst({
    where: {
      id: membershipId,
      academyId,
    },
    select: {
      id: true,
      userId: true,
      role: true,
      status: true,
      joinedAt: true,

      user: {
        select: {
          id: true,
          name: true,
          firstName: true,
          lastName: true,
          email: true,
          image: true,
        },
      },

      coachProfile: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          status: true,
        },
      },
    },
  });
}

export async function PATCH(
  request: Request,
  { params }: RouteContext
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_UPDATE
    );

  if (!access.ok) {
    return access.response;
  }

  const target =
    await getTargetMembership(
      access.academyId,
      params.membershipId
    );

  if (!target) {
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

  const targetRole =
    String(
      target.role
    ) as AcademyRoleName;

  if (targetRole === "OWNER") {
    return NextResponse.json(
      {
        error:
          "Roli dhe statusi i pronarit nuk mund të ndryshohen këtu.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    target.id ===
    access.membership.id
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk mund të ndryshosh rolin ose statusin tënd.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    targetRole === "ADMIN" &&
    access.role !== "OWNER"
  ) {
    return NextResponse.json(
      {
        error:
          "Vetëm pronari mund të menaxhojë një administrator.",
      },
      {
        status: 403,
      }
    );
  }

  let body: {
    role?: unknown;
    status?: unknown;
  };

  try {
    body = await request.json();
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

  const data: {
    role?: AcademyRoleName;
    status?: "ACTIVE" | "SUSPENDED";
  } = {};

  if (body.role !== undefined) {
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

    if (body.role === "OWNER") {
      return NextResponse.json(
        {
          error:
            "Roli Pronar nuk mund të caktohet nga menaxhimi i stafit.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      body.role === "ADMIN" &&
      access.role !== "OWNER"
    ) {
      return NextResponse.json(
        {
          error:
            "Vetëm pronari mund të caktojë administratorë.",
        },
        {
          status: 403,
        }
      );
    }

    data.role = body.role;
  }

  if (body.status !== undefined) {
    if (
      body.status !== "ACTIVE" &&
      body.status !== "SUSPENDED"
    ) {
      return NextResponse.json(
        {
          error:
            "Statusi mund të jetë vetëm Aktiv ose Pezulluar.",
        },
        {
          status: 400,
        }
      );
    }

    data.status = body.status;
  }

  if (
    data.role === undefined &&
    data.status === undefined
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk u dërgua asnjë ndryshim.",
      },
      {
        status: 400,
      }
    );
  }

  const updated =
    await prisma.academyMembership.update({
      where: {
        id: target.id,
      },
      data,
      select: {
        id: true,
        role: true,
        status: true,
        joinedAt: true,

        user: {
          select: {
            id: true,
            name: true,
            firstName: true,
            lastName: true,
            email: true,
            image: true,
          },
        },

        coachProfile: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            status: true,
          },
        },
      },
    });

  const role =
    String(
      updated.role
    ) as AcademyRoleName;

  const status =
    String(
      updated.status
    );

  return NextResponse.json({
    staffMember: {
      id: updated.id,

      role,
      roleLabel:
        ROLE_LABELS[role] ??
        "Anëtar",

      status,
      statusLabel:
        STATUS_LABELS[status] ??
        status,

      joinedAt:
        updated.joinedAt,

      isCurrentUser: false,
      isOwner: false,

      user: updated.user,

      coachProfile:
        updated.coachProfile,
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext
) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_REMOVE
    );

  if (!access.ok) {
    return access.response;
  }

  const target =
    await getTargetMembership(
      access.academyId,
      params.membershipId
    );

  if (!target) {
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

  const targetRole =
    String(
      target.role
    ) as AcademyRoleName;

  if (targetRole === "OWNER") {
    return NextResponse.json(
      {
        error:
          "Pronari i akademisë nuk mund të hiqet nga stafi.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    target.id ===
    access.membership.id
  ) {
    return NextResponse.json(
      {
        error:
          "Nuk mund të heqësh veten nga stafi.",
      },
      {
        status: 403,
      }
    );
  }

  if (
    targetRole === "ADMIN" &&
    access.role !== "OWNER"
  ) {
    return NextResponse.json(
      {
        error:
          "Vetëm pronari mund të heqë një administrator.",
      },
      {
        status: 403,
      }
    );
  }

  await prisma.academyMembership.update({
    where: {
      id: target.id,
    },
    data: {
      status: "REMOVED",
    },
  });

  return NextResponse.json({
    message:
      "Anëtari i stafit u hoq me sukses.",
  });
}