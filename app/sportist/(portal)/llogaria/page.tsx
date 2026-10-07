import { redirect } from "next/navigation";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

import { AthleteAccountClient } from "./account-client";

function formatSessionDate(value: Date) {
  const parts =
    new Intl.DateTimeFormat(
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

  const get = (
    type: string
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? "";

  return `${get("day")}/${get("month")}/${get("year")} · ${get("hour")}:${get("minute")}`;
}

export default async function AthleteAccountPage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/llogaria"
      );
    }

    redirect("/");
  }

  const user =
    await prisma.user.findUnique({
      where: {
        id: access.userId,
      },

      select: {
        name: true,
        email: true,

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

  const athleteName =
    `${access.player.firstName} ${access.player.lastName}`.trim();

  return (
    <AthleteAccountClient
      initialName={
        user.name ||
        athleteName
      }
      email={user.email}
      athleteName={
        athleteName
      }
      academyName={
        access.academy.name
      }
      providers={[
        ...new Set(
          user.accounts.map(
            (account) =>
              account.providerId
          )
        ),
      ]}
      sessions={
        user.sessions.map(
          (session) => ({
            id: session.id,

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

            ipAddress:
              session.ipAddress,

            userAgent:
              session.userAgent,
          })
        )
      }
    />
  );
}