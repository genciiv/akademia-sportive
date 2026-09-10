import { Dashboard } from "@/components/dashboard";
import { merrAkademineAktive } from "@/lib/academy-context";
import { prisma } from "@/lib/prisma";

function etiketaDates(date: Date) {
  const dita = String(date.getDate()).padStart(2, "0");
  const muaji = String(date.getMonth() + 1).padStart(2, "0");

  return `${dita}/${muaji}`;
}

export default async function Page() {
  const {
    session,
    membership,
    academy,
  } = await merrAkademineAktive();

  const tani = new Date();

  const [
    drillsCount,
    sessionsCount,
    playersCount,
    coachesCount,
    attendanceSessions,
    performanceMatches,
    upcomingSessions,
    upcomingMatches,
  ] = await Promise.all([
    prisma.drill.count({
      where: {
        academyId: academy.id,
      },
    }),

    prisma.trainingSession.count({
      where: {
        academyId: academy.id,
      },
    }),

    prisma.player.count({
      where: {
        academyId: academy.id,
        status: "ACTIVE",
      },
    }),

    prisma.coach.count({
      where: {
        academyId: academy.id,
        status: "ACTIVE",
      },
    }),

    prisma.trainingSession.findMany({
      where: {
        academyId: academy.id,
        attendances: {
          some: {},
        },
      },
      orderBy: {
        startsAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        startsAt: true,
        attendances: {
          select: {
            status: true,
          },
        },
      },
    }),

    prisma.match.findMany({
      where: {
        academyId: academy.id,
        performances: {
          some: {},
        },
      },
      orderBy: {
        startsAt: "desc",
      },
      take: 10,
      select: {
        id: true,
        startsAt: true,
        performances: {
          select: {
            coachRating: true,
          },
        },
      },
    }),

    prisma.trainingSession.findMany({
      where: {
        academyId: academy.id,
        startsAt: {
          gte: tani,
        },
        status: "SCHEDULED",
      },
      orderBy: {
        startsAt: "asc",
      },
      take: 8,
      select: {
        id: true,
        title: true,
        startsAt: true,
        endsAt: true,
        location: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    }),

    prisma.match.findMany({
      where: {
        academyId: academy.id,
        startsAt: {
          gte: tani,
        },
        status: {
          in: ["SCHEDULED", "POSTPONED"],
        },
      },
      orderBy: {
        startsAt: "asc",
      },
      take: 8,
      select: {
        id: true,
        opponentName: true,
        startsAt: true,
        location: true,
        status: true,
        team: {
          select: {
            name: true,
          },
        },
      },
    }),
  ]);

  const attendanceData = attendanceSessions
    .reverse()
    .map((trainingSession) => {
      const present =
        trainingSession.attendances.filter(
          (attendance) =>
            attendance.status === "PRESENT" ||
            attendance.status === "LATE"
        ).length;

      const absent =
        trainingSession.attendances.filter(
          (attendance) =>
            attendance.status === "ABSENT" ||
            attendance.status === "EXCUSED"
        ).length;

      return {
        emri: etiketaDates(trainingSession.startsAt),
        prezent: present,
        mungon: absent,
      };
    });

  const performanceData = performanceMatches
    .reverse()
    .map((match) => {
      const ratings = match.performances
        .map((performance) =>
          performance.coachRating === null
            ? null
            : Number(performance.coachRating)
        )
        .filter(
          (rating): rating is number =>
            rating !== null &&
            Number.isFinite(rating)
        );

      if (ratings.length === 0) {
        return null;
      }

      const average =
        ratings.reduce(
          (sum, rating) => sum + rating,
          0
        ) / ratings.length;

      return {
        emri: etiketaDates(match.startsAt),
        vlera: Number(average.toFixed(1)),
      };
    })
    .filter(
      (
        item
      ): item is {
        emri: string;
        vlera: number;
      } => item !== null
    );

  const activities = [
    ...upcomingSessions.map((trainingSession) => ({
      id: trainingSession.id,
      type: "TRAINING" as const,
      title: trainingSession.title,
      teamName: trainingSession.team.name,
      startsAt: trainingSession.startsAt.toISOString(),
      endsAt:
        trainingSession.endsAt?.toISOString() ?? null,
      location: trainingSession.location,
      status: "SCHEDULED",
    })),

    ...upcomingMatches.map((match) => ({
      id: match.id,
      type: "MATCH" as const,
      title: `Kundër ${match.opponentName}`,
      teamName: match.team.name,
      startsAt: match.startsAt.toISOString(),
      endsAt: null,
      location: match.location,
      status: match.status,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(a.startsAt).getTime() -
        new Date(b.startsAt).getTime()
    )
    .slice(0, 6);

  return (
    <Dashboard
      academyName={academy.name}
      userName={session.user.name}
      role={membership.role}
      stats={{
        drills: drillsCount,
        sessions: sessionsCount,
        players: playersCount,
        coaches: coachesCount,
      }}
      chartData={{
        performance: performanceData,
        attendance: attendanceData,
      }}
      activities={activities}
    />
  );
}