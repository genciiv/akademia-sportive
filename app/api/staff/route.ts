import { NextResponse } from "next/server";

import {
  requireAcademyPermission,
} from "@/lib/academy-permissions";
import {
  PERMISSIONS,
  ROLE_LABELS,
  type AcademyRoleName,
} from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { checkPlanLimit } from "@/lib/plan-limits";

const STAFF_STATUS_LABELS: Record<
  string,
  string
> = {
  ACTIVE: "Aktiv",
  INACTIVE: "Joaktiv",
  LEFT: "Larguar",
};

const ACCESS_STATUS_LABELS: Record<
  string,
  string
> = {
  ACTIVE: "Akses aktiv",
  INVITED:
    "Ftesë në pritje",
  SUSPENDED:
    "Akses i pezulluar",
  REMOVED: "Pa akses",
  NO_ACCESS: "Pa llogari",
};


const CREATABLE_STAFF_ROLES = new Set<AcademyRoleName>([
  "ADMIN",
  "SPORTS_DIRECTOR",
  "HEAD_COACH",
  "COACH",
  "ASSISTANT_COACH",
  "FINANCE",
  "RECEPTIONIST",
  "MEMBER",
]);

function normalizeEmail(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  const access =
    await requireAcademyPermission(
      PERMISSIONS.STAFF_INVITE
    );

  if (!access.ok) {
    return access.response;
  }

  const body = await request
    .json()
    .catch(() => null);

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      {
        error:
          "T\u00eb dh\u00ebnat e an\u00ebtarit nuk jan\u00eb t\u00eb vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  const firstName = String(
    body.firstName ?? ""
  ).trim();

  const lastName = String(
    body.lastName ?? ""
  ).trim();

  const email = normalizeEmail(
    body.email
  );

  const phone = String(
    body.phone ?? ""
  ).trim();

  const role = String(
    body.role ?? ""
  ).trim() as AcademyRoleName;

  if (
    !firstName ||
    firstName.length > 80 ||
    !lastName ||
    lastName.length > 80
  ) {
    return NextResponse.json(
      {
        error:
          "Emri dhe mbiemri jan\u00eb t\u00eb detyruesh\u00ebm dhe duhet t\u00eb jen\u00eb deri n\u00eb 80 karaktere.",
      },
      {
        status: 400,
      }
    );
  }

  if (
    !email ||
    email.length > 320 ||
    !isValidEmail(email)
  ) {
    return NextResponse.json(
      {
        error:
          "Vendos nj\u00eb adres\u00eb elektronike t\u00eb vlefshme.",
      },
      {
        status: 400,
      }
    );
  }

  if (phone.length > 50) {
    return NextResponse.json(
      {
        error:
          "Numri i telefonit \u00ebsht\u00eb shum\u00eb i gjat\u00eb.",
      },
      {
        status: 400,
      }
    );
  }

  if (!CREATABLE_STAFF_ROLES.has(role)) {
    return NextResponse.json(
      {
        error:
          "Roli i stafit nuk \u00ebsht\u00eb i vlefsh\u00ebm.",
      },
      {
        status: 400,
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
          "Vet\u00ebm pronari mund t\u00eb shtoj\u00eb nj\u00eb administrator.",
      },
      {
        status: 403,
      }
    );
  }

  const duplicate =
    await prisma.academyStaff.findFirst({
      where: {
        academyId:
          access.academyId,

        email: {
          equals: email,
          mode: "insensitive",
        },
      },

      select: {
        id: true,
        status: true,
      },
    });

  if (duplicate) {
    return NextResponse.json(
      {
        error:
          duplicate.status === "LEFT"
            ? "Ky email i p\u00ebrket nj\u00eb profili stafi t\u00eb larguar. Riaktivizo profilin ekzistues n\u00eb vend q\u00eb t\u00eb krijosh nj\u00eb t\u00eb ri."
            : "Ekziston tashm\u00eb nj\u00eb an\u00ebtar stafi me k\u00ebt\u00eb email.",
      },
      {
        status: 409,
      }
    );
  }

  const planLimit =
    await checkPlanLimit(
      access.academyId,
      "staff"
    );

  if (!planLimit.allowed) {
    const error =
      planLimit.reason === "LIMIT_REACHED"
        ? "Ke arritur kufirin prej " +
          planLimit.limit +
          " an\u00ebtar\u00ebsh stafi p\u00ebr planin " +
          planLimit.planCode +
          "."
        : planLimit.reason === "NO_SUBSCRIPTION"
          ? "Akademia nuk ka nj\u00eb abonim aktiv."
          : "Abonimi i akademis\u00eb nuk lejon shtimin e stafit n\u00eb k\u00ebt\u00eb moment.";

    return NextResponse.json(
      {
        error,

        limit: {
          current:
            planLimit.current,
          maximum:
            planLimit.limit,
          planCode:
            planLimit.planCode,
          subscriptionStatus:
            planLimit.subscriptionStatus,
        },
      },
      {
        status:
          planLimit.reason === "LIMIT_REACHED"
            ? 409
            : 403,
      }
    );
  }

  const staff =
    await prisma.academyStaff.create({
      data: {
        academyId:
          access.academyId,
        firstName,
        lastName,
        email,
        phone:
          phone || null,
        role,
        status: "ACTIVE",
      },

      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
      },
    });

  return NextResponse.json(
    {
      message:
        "An\u00ebtari i stafit u shtua me sukses.",
      staff,
    },
    {
      status: 201,
    }
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

  const records =
    await prisma.academyStaff.findMany({
      where: {
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
        phone: true,
        role: true,
        status: true,
        createdAt: true,

        membership: {
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

      orderBy: [
        {
          lastName: "asc",
        },
        {
          firstName: "asc",
        },
      ],
    });

  const staff =
    records.map(
      (record) => {
        const membership =
          record.membership;

        const usableMembership =
          membership &&
          membership.status !==
            "REMOVED"
            ? membership
            : null;

        const role =
          String(
            usableMembership?.role ??
              record.role
          ) as AcademyRoleName;

        const accessStatus =
          usableMembership
            ? String(
                usableMembership.status
              )
            : "NO_ACCESS";

        const fallbackUser = {
          id: record.id,
          name: [
            record.firstName,
            record.lastName,
          ]
            .filter(Boolean)
            .join(" "),
          firstName:
            record.firstName,
          lastName:
            record.lastName,
          email:
            record.email || "",
          image: null,
        };

        return {
          id: record.id,

          membershipId:
            usableMembership?.id ??
            null,

          role,
          roleLabel:
            ROLE_LABELS[role] ??
            "Anëtar",

          status:
            record.status ===
            "ACTIVE"
              ? "ACTIVE"
              : "SUSPENDED",

          statusLabel:
            STAFF_STATUS_LABELS[
              String(
                record.status
              )
            ] ??
            String(
              record.status
            ),

          accessStatus,

          accessStatusLabel:
            ACCESS_STATUS_LABELS[
              accessStatus
            ] ??
            accessStatus,

          joinedAt:
            usableMembership
              ?.joinedAt ??
            record.createdAt,

          isCurrentUser:
            usableMembership?.id ===
            access.membership.id,

          isOwner:
            role === "OWNER",

          user:
            usableMembership?.user ??
            fallbackUser,

          coachProfile:
            record.coachProfile,
        };
      }
    );

  return NextResponse.json({
    academy: {
      id:
        access.academy.id,
      name:
        access.academy.name,
    },

    permissions:
      access.permissions,

    staff,
  });
}