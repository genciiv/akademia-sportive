import { headers } from "next/headers";
import { NextResponse } from "next/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getRolePermissions,
  hasEveryPermission,
  hasAnyPermission,
  hasPermission,
  type Permission,
} from "@/lib/permissions";

type AcademyAccessSuccess = {
  ok: true;
  session: NonNullable<
    Awaited<ReturnType<typeof auth.api.getSession>>
  >;
  membership: {
    id: string;
    userId: string;
    academyId: string;
    role: string;
    status: string;
    joinedAt: Date;
  };
  academy: {
    id: string;
    name: string;
    slug: string;
    status: string;
  };
  academyId: string;
  role: string;
  permissions: readonly Permission[];
};

type AcademyAccessFailure = {
  ok: false;
  response: NextResponse;
};

export type AcademyAccessResult =
  | AcademyAccessSuccess
  | AcademyAccessFailure;

async function getAcademyAccessContext(): Promise<
  AcademyAccessResult
> {
  const session = await auth.api.getSession({
    headers: headers(),
  });

  if (!session?.user?.id) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: "Duhet të identifikohesh për të vazhduar.",
        },
        {
          status: 401,
        }
      ),
    };
  }

  const membership =
    await prisma.academyMembership.findFirst({
      where: {
        userId: session.user.id,
        status: "ACTIVE",
      },
      orderBy: {
        joinedAt: "asc",
      },
      select: {
        id: true,
        userId: true,
        academyId: true,
        role: true,
        status: true,
        joinedAt: true,
        academy: {
          select: {
            id: true,
            name: true,
            slug: true,
            status: true,
          },
        },
      },
    });

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Nuk ke anëtarësi aktive në një akademi.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  const role = String(membership.role);

  const permissions =
    getRolePermissions(role);

  return {
    ok: true,
    session,
    membership: {
      id: membership.id,
      userId: membership.userId,
      academyId: membership.academyId,
      role,
      status: String(membership.status),
      joinedAt: membership.joinedAt,
    },
    academy: {
      id: membership.academy.id,
      name: membership.academy.name,
      slug: membership.academy.slug,
      status: String(membership.academy.status),
    },
    academyId: membership.academyId,
    role,
    permissions,
  };
}

export async function requireAcademyPermission(
  permission: Permission
): Promise<AcademyAccessResult> {
  const access =
    await getAcademyAccessContext();

  if (!access.ok) {
    return access;
  }

  if (
    !hasPermission(
      access.role,
      permission
    )
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Nuk ke leje për të kryer këtë veprim.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return access;
}

export async function requireAnyAcademyPermission(
  permissions: readonly Permission[]
): Promise<AcademyAccessResult> {
  const access =
    await getAcademyAccessContext();

  if (!access.ok) {
    return access;
  }

  if (
    !hasAnyPermission(
      access.role,
      permissions
    )
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Nuk ke leje për të kryer këtë veprim.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return access;
}

export async function requireEveryAcademyPermission(
  permissions: readonly Permission[]
): Promise<AcademyAccessResult> {
  const access =
    await getAcademyAccessContext();

  if (!access.ok) {
    return access;
  }

  if (
    !hasEveryPermission(
      access.role,
      permissions
    )
  ) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error:
            "Nuk ke leje për të kryer këtë veprim.",
        },
        {
          status: 403,
        }
      ),
    };
  }

  return access;
}

export async function getCurrentAcademyAccess(): Promise<
  AcademyAccessResult
> {
  return getAcademyAccessContext();
}