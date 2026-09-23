import { redirect } from "next/navigation";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { prisma } from "@/lib/prisma";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("sq-AL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function attendanceLabel(status: string) {
  switch (status) {
    case "PRESENT":
      return "Prezent";
    case "ABSENT":
      return "Mungesë";
    case "LATE":
      return "Me vonesë";
    case "EXCUSED":
      return "E justifikuar";
    default:
      return status;
  }
}

function attendanceClass(status: string) {
  switch (status) {
    case "PRESENT":
      return "bg-emerald-50 text-emerald-700";
    case "ABSENT":
      return "bg-red-50 text-red-700";
    case "LATE":
      return "bg-amber-50 text-amber-700";
    case "EXCUSED":
      return "bg-blue-50 text-blue-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

function percentage(value: number, total: number) {
  if (total === 0) {
    return 0;
  }

  return Math.round((value / total) * 100);
}

export default async function AthleteAttendancePage() {
  const access = await requireAthleteAccess();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect("/hyrje?next=/sportist/prezenca");
    }

    redirect("/");
  }

  const attendances = await prisma.trainingAttendance.findMany({
    where: {
      playerId: access.playerId,

      trainingSession: {
        academyId: access.academyId,
      },
    },

    orderBy: {
      trainingSession: {
        startsAt: "desc",
      },
    },

    select: {
      id: true,
      status: true,

      trainingSession: {
        select: {
          id: true,
          title: true,
          startsAt: true,

          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  });

  const stats = attendances.reduce(
    (current, attendance) => {
      switch (attendance.status) {
        case "PRESENT":
          current.present++;
          break;
        case "ABSENT":
          current.absent++;
          break;
        case "LATE":
          current.late++;
          break;
        case "EXCUSED":
          current.excused++;
          break;
      }

      return current;
    },
    {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
    },
  );

  const total = attendances.length;

  const summary = [
    {
      label: "Prezent",
      value: stats.present,
      percentage: percentage(stats.present, total),
    },
    {
      label: "Mungesë",
      value: stats.absent,
      percentage: percentage(stats.absent, total),
    },
    {
      label: "Me vonesë",
      value: stats.late,
      percentage: percentage(stats.late, total),
    },
    {
      label: "E justifikuar",
      value: stats.excused,
      percentage: percentage(stats.excused, total),
    },
  ];

  return (
    <div className="space-y-6">
      <section>
        <p className="text-sm font-medium text-slate-500">
          Portali i Sportistit
        </p>

        <h1 className="mt-1 text-3xl font-bold tracking-tight">Prezenca ime</h1>

        <p className="mt-2 text-sm text-slate-600">
          Historiku yt i prezencës në seancat stërvitore.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Regjistrime</p>

          <p className="mt-2 text-2xl font-bold">{total}</p>
        </div>

        {summary.map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-slate-200 bg-white p-5"
          >
            <p className="text-sm text-slate-500">{item.label}</p>

            <div className="mt-2 flex items-end justify-between gap-3">
              <p className="text-2xl font-bold">{item.value}</p>

              <p className="text-sm font-medium text-slate-500">
                {item.percentage}%
              </p>
            </div>
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-semibold">Historiku i prezencës</h2>

          <p className="mt-1 text-sm text-slate-500">
            Të gjitha prezencat e regjistruara për llogarinë tënde të
            sportistit.
          </p>
        </div>

        {attendances.length === 0 ? (
          <p className="mt-5 text-sm text-slate-500">
            Ende nuk ka prezenca të regjistruara.
          </p>
        ) : (
          <div className="mt-5 space-y-3">
            {attendances.map((attendance) => (
              <div
                key={attendance.id}
                className="flex flex-col gap-3 rounded-lg border border-slate-100 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-semibold text-slate-950">
                    {attendance.trainingSession.title}
                  </p>

                  <p className="mt-1 text-sm text-slate-500">
                    {attendance.trainingSession.team.name}
                    {" · "}
                    {formatDateTime(attendance.trainingSession.startsAt)}
                  </p>
                </div>

                <span
                  className={[
                    "w-fit rounded-full px-3 py-1.5 text-xs font-semibold",
                    attendanceClass(attendance.status),
                  ].join(" ")}
                >
                  {attendanceLabel(attendance.status)}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
