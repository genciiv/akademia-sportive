import {
  redirect,
} from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

import { PlatformAccountClient } from "./account-client";

function formatSessionDate(value: Date) {
  const parts = new Intl.DateTimeFormat(
    "en-GB",
    {
      timeZone: "Europe/Tirane",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }
  ).formatToParts(value);

  const get = (type: string) =>
    parts.find(
      (part) => part.type === type
    )?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} · ${get("hour")}:${get("minute")}`;
}

export default async function PlatformAdminAccountPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin/llogaria"
      );
    }

    redirect("/");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: access.user.id,
      },

      select: {
        name: true,
        email: true,
        role: true,

        accounts: {
          select: {
            providerId: true,
          },
        },

        sessions: {
          where: {
            expiresAt: {
              gt: new Date(),
            },
          },

          orderBy: {
            updatedAt: "desc",
          },

          select: {
            id: true,
            createdAt: true,
            updatedAt: true,
            expiresAt: true,
            ipAddress: true,
            userAgent: true,
          },
        },
      },
    });

  if (!user) {
    redirect("/hyrje");
  }

  return (
    <PlatformAdminShell>
      <PlatformAccountClient
        initialName={user.name}
        email={user.email}
        role={user.role}
        providers={[
          ...new Set(
            user.accounts.map(
              (account) =>
                account.providerId
            )
          ),
        ]}
        sessions={user.sessions.map(
          (session) => ({
            ...session,

            createdAt:
              session.createdAt.toISOString(),

            updatedAtLabel:
              formatSessionDate(
                session.updatedAt
              ),

            expiresAtLabel:
              formatSessionDate(
                session.expiresAt
              ),
          })
        )}
      />
    </PlatformAdminShell>
  );
}