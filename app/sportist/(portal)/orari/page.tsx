import { redirect } from "next/navigation";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("sq-AL", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Tirane",
  }).format(value);
}

export default async function AthleteSchedulePage() {
  const access = await requireAthleteAccess();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje?next=/sportist/orari");
    }

    redirect("/");
  }

  const activeTeams = await prisma.teamPlayer.findMany({
    where: {
      playerId: access.playerId,
      isActive: true,

      team: {
        academyId: access.academyId,
        status: "ACTIVE",
      },
    },

    select: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },

    orderBy: {
      joinedAt: "asc",
    },
  });

  const activeTeamIds = activeTeams.map(({ team }) => team.id);

  const now = new Date();

  const [trainingSessions, matches] = await Promise.all([
    prisma.trainingSession.findMany({
      where: {
        academyId: access.academyId,

        teamId: {
          in: activeTeamIds,
        },

        startsAt: {
          gte: now,
        },

        status: "SCHEDULED",
      },

      orderBy: {
        startsAt: "asc",
      },

      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        location: true,

        team: {
          select: {
            id: true,
            name: true,
          },
        },

        facility: {
          select: {
            id: true,
            name: true,
          },
        },

        branch: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),

    prisma.match.findMany({
      where: {
        academyId: access.academyId,

        teamId: {
          in: activeTeamIds,
        },

        startsAt: {
          gte: now,
        },

        status: "SCHEDULED",
      },

      orderBy: {
        startsAt: "asc",
      },

      select: {
        id: true,
        startsAt: true,
        opponentName: true,
        isHome: true,
        competitionName: true,
        location: true,

        team: {
          select: {
            id: true,
            name: true,
          },
        },

        facility: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const scheduleItems = [
    ...trainingSessions.map((session) => ({
      id: `training-${session.id}`,
      type: "TRAINING" as const,
      startsAt: session.startsAt,
      title: session.title,
      subtitle: session.team.name,
      location:
        session.facility?.name ||
        session.location ||
        session.branch?.name ||
        null,
    })),

    ...matches.map((match) => ({
      id: `match-${match.id}`,
      type: "MATCH" as const,
      startsAt: match.startsAt,

      title: match.isHome
        ? `${match.team.name} - ${match.opponentName}`
        : `${match.opponentName} - ${match.team.name}`,

      subtitle: match.competitionName || match.team.name,

      location: match.facility?.name || match.location || null,
    })),
  ].sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Portali i Sportistit
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">Orari im</h1>

        <p className="mt-2 text-sm text-slate-600">
          Seancat dhe ndeshjet e ardhshme të ekipeve të tua aktive.
        </p>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        {scheduleItems.length === 0 ? (
          <p className="text-sm text-slate-500">
            Nuk ka aktivitete të ardhshme në orarin tënd.
          </p>
        ) : (
          <div className="space-y-3">
            {scheduleItems.map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-600">
                        {item.type === "TRAINING" ? "Seancë" : "Ndeshje"}
                      </span>

                      <p className="font-semibold">{item.title}</p>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {item.subtitle}
                    </p>

                    {item.location ? (
                      <p className="mt-1 text-sm text-slate-500">
                        {item.location}
                      </p>
                    ) : null}
                  </div>

                  <p className="text-sm font-medium text-slate-700">
                    {formatDateTime(item.startsAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
