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
        const role =
          String(
            record.role
          ) as AcademyRoleName;

        const membership =
          record.membership;

        const usableMembership =
          membership &&
          membership.status !==
            "REMOVED"
            ? membership
            : null;

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