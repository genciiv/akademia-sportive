import { redirect } from "next/navigation";
import {
  Bell,
  BellRing,
  Megaphone,
  Sparkles,
} from "lucide-react";

import { AthleteNotificationList } from "@/components/sportist/athlete-notification-list";
import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

export default async function AthleteNotificationsPage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/njoftimet"
      );
    }

    redirect("/");
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: access.playerId,
        academyId:
          access.academyId,
      },

      select: {
        teams: {
          where: {
            isActive: true,
          },

          select: {
            team: {
              select: {
                id: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (!player) {
    redirect("/");
  }

  const activeTeamIds =
    player.teams
      .filter(
        ({ team }) =>
          team.status === "ACTIVE"
      )
      .map(
        ({ team }) =>
          team.id
      );

  const now = new Date();

  const notifications =
    await prisma.notification.findMany({
      where: {
        academyId:
          access.academyId,

        status: "ACTIVE",

        AND: [
          {
            OR: [
              {
                expiresAt: null,
              },
              {
                expiresAt: {
                  gte: now,
                },
              },
            ],
          },

          {
            OR: [
              {
                audience: "ALL",
              },
              {
                audience: "TEAM",

                teamId: {
                  in: activeTeamIds,
                },
              },
            ],
          },
        ],
      },

      orderBy: {
        publishedAt: "desc",
      },

      take: 50,

      select: {
        id: true,
        title: true,
        message: true,
        href: true,
        audience: true,
        priority: true,
        publishedAt: true,

        team: {
          select: {
            id: true,
            name: true,
          },
        },

        notificationReads: {
          where: {
            userId:
              access.userId,
          },

          select: {
            id: true,
          },
        },
      },
    });

  const items =
    notifications.map(
      (notification) => ({
        id:
          notification.id,

        title:
          notification.title,

        message:
          notification.message,

        href:
          notification.href,

        audience:
          notification.audience,

        priority:
          notification.priority,

        publishedAt:
          notification.publishedAt.toISOString(),

        team:
          notification.team,

        isRead:
          notification
            .notificationReads
            .length > 0,
      })
    );

  const unreadCount =
    items.filter(
      (item) =>
        !item.isRead
    ).length;

  const urgentCount =
    items.filter(
      (item) =>
        item.priority ===
        "URGENT"
    ).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-violet-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-blue-700">
              <Sparkles size={13} />
              Qendra e njoftimeve
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Njoftimet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Të gjitha njoftimet që akademia publikon për ty ose ekipet ku je aktiv.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                <BellRing size={14} />
                {unreadCount} të palexuara
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                <Bell size={14} />
                {items.length} gjithsej
              </span>

              {urgentCount > 0 ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
                  <Megaphone size={14} />
                  {urgentCount} urgjente
                </span>
              ) : null}
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
            <BellRing size={28} />
          </div>
        </div>
      </section>

      <AthleteNotificationList
        initialNotifications={
          items
        }
      />
    </div>
  );
}