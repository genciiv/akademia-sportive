import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { UsersClient } from "./users-client";

export default async function PlatformAdminUsersPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/perdoruesit"
      );
    }

    redirect("/");
  }

  const users =
    await prisma.user.findMany({
      orderBy: {
        createdAt: "desc",
      },

      select: {
        id: true,
        name: true,
        firstName: true,
        lastName: true,
        email: true,
        emailVerified: true,
        phone: true,
        role: true,
        createdAt: true,

        memberships: {
          orderBy: {
            joinedAt: "desc",
          },

          select: {
            id: true,
            role: true,
            status: true,
            joinedAt: true,

            academy: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },

        _count: {
          select: {
            ownedAcademies: true,
            sessions: true,
          },
        },
      },
    });

  const serialized = users.map(
    (user) => ({
      ...user,

      createdAt:
        user.createdAt.toISOString(),

      memberships:
        user.memberships.map(
          (membership) => ({
            ...membership,

            joinedAt:
              membership.joinedAt.toISOString(),
          })
        ),
    })
  );

  return (
    <PlatformAdminShell>
      <UsersClient
        initialUsers={serialized}
      />
    </PlatformAdminShell>
  );
}