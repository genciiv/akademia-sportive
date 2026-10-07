import { redirect } from "next/navigation";
import {
  CalendarCheck2,
  CheckCircle2,
  CircleAlert,
  Clock3,
  ShieldCheck,
  Sparkles,
  TimerReset,
  XCircle,
} from "lucide-react";

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
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "ABSENT":
      return "border-rose-200 bg-rose-50 text-rose-700";
    case "LATE":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "EXCUSED":
      return "border-blue-200 bg-blue-50 text-blue-700";
    default:
      return "border-slate-200 bg-slate-100 text-slate-700";
  }
}

function attendanceIcon(status: string) {
  switch (status) {
    case "PRESENT":
      return CheckCircle2;
    case "ABSENT":
      return XCircle;
    case "LATE":
      return TimerReset;
    case "EXCUSED":
      return ShieldCheck;
    default:
      return CircleAlert;
  }
}

function percentage(
  value: number,
  total: number
) {
  if (total === 0) {
    return 0;
  }

  return Math.round(
    (value / total) * 100
  );
}

export default async function AthleteAttendancePage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/prezenca"
      );
    }

    redirect("/");
  }

  const attendances =
    await prisma.trainingAttendance.findMany({
      where: {
        playerId:
          access.playerId,

        trainingSession: {
          academyId:
            access.academyId,
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

  const stats =
    attendances.reduce(
      (
        current,
        attendance
      ) => {
        switch (
          attendance.status
        ) {
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
      }
    );

  const total =
    attendances.length;

  const attendanceRate =
    percentage(
      stats.present +
        stats.late +
        stats.excused,
      total
    );

  const summary = [
    {
      key: "present",
      label: "Prezent",
      value: stats.present,
      percentage: percentage(
        stats.present,
        total
      ),
      icon: CheckCircle2,
      iconClass:
        "bg-emerald-100 text-emerald-700",
      cardClass:
        "border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40",
    },
    {
      key: "absent",
      label: "Mungesë",
      value: stats.absent,
      percentage: percentage(
        stats.absent,
        total
      ),
      icon: XCircle,
      iconClass:
        "bg-rose-100 text-rose-700",
      cardClass:
        "border-rose-100 bg-gradient-to-br from-rose-50 via-white to-rose-50/40",
    },
    {
      key: "late",
      label: "Me vonesë",
      value: stats.late,
      percentage: percentage(
        stats.late,
        total
      ),
      icon: TimerReset,
      iconClass:
        "bg-amber-100 text-amber-700",
      cardClass:
        "border-amber-100 bg-gradient-to-br from-amber-50 via-white to-amber-50/40",
    },
    {
      key: "excused",
      label: "E justifikuar",
      value: stats.excused,
      percentage: percentage(
        stats.excused,
        total
      ),
      icon: ShieldCheck,
      iconClass:
        "bg-blue-100 text-blue-700",
      cardClass:
        "border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/40",
    },
  ];

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-emerald-700">
              <Sparkles size={13} />
              Prezenca ime
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Prezenca
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Ndiq historikun tënd të pjesëmarrjes në seancat stërvitore dhe shiko përmbledhjen e prezencës.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                <CalendarCheck2 size={14} />
                {total} regjistrime
              </span>

              <span className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
                <CheckCircle2 size={14} />
                {attendanceRate}% pjesëmarrje
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
            <CalendarCheck2 size={28} />
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-[22px] border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/30 p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
              <CalendarCheck2 size={18} />
            </span>

            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-500">
              TOTAL
            </span>
          </div>

          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
            Regjistrime
          </p>

          <p className="mt-1 text-3xl font-black text-slate-950">
            {total}
          </p>

          <p className="mt-2 text-xs text-slate-500">
            Seanca me prezencë të regjistruar.
          </p>
        </div>

        {summary.map(
          (item) => {
            const Icon =
              item.icon;

            return (
              <div
                key={item.key}
                className={[
                  "rounded-[22px] border p-5 shadow-sm",
                  item.cardClass,
                ].join(" ")}
              >
                <div className="flex items-start justify-between">
                  <span
                    className={[
                      "flex h-10 w-10 items-center justify-center rounded-xl",
                      item.iconClass,
                    ].join(" ")}
                  >
                    <Icon size={18} />
                  </span>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-black text-slate-600 shadow-sm">
                    {item.percentage}%
                  </span>
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-400">
                  {item.label}
                </p>

                <p className="mt-1 text-3xl font-black text-slate-950">
                  {item.value}
                </p>

                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white">
                  <div
                    className={[
                      "h-full rounded-full",
                      item.key ===
                      "present"
                        ? "bg-emerald-500"
                        : item.key ===
                            "absent"
                          ? "bg-rose-500"
                          : item.key ===
                              "late"
                            ? "bg-amber-500"
                            : "bg-blue-500",
                    ].join(" ")}
                    style={{
                      width: `${item.percentage}%`,
                    }}
                  />
                </div>
              </div>
            );
          }
        )}
      </section>

      <section className="rounded-[26px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-blue-600">
              Historiku
            </p>

            <h2 className="mt-1 text-lg font-black text-slate-950">
              Historiku i prezencës
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Të gjitha prezencat e regjistruara për llogarinë tënde të sportistit.
            </p>
          </div>

          <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600">
            {attendances.length} seanca
          </span>
        </div>

        {attendances.length ===
        0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
            <CalendarCheck2
              size={28}
              className="mx-auto text-slate-300"
            />

            <p className="mt-3 text-sm font-semibold text-slate-700">
              Ende nuk ka prezenca të regjistruara.
            </p>

            <p className="mt-1 text-xs text-slate-500">
              Prezencat e tua do të shfaqen këtu pasi akademia t&apos;i regjistrojë.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-3">
            {attendances.map(
              (attendance) => {
                const Icon =
                  attendanceIcon(
                    attendance.status
                  );

                return (
                  <div
                    key={
                      attendance.id
                    }
                    className="group flex flex-col gap-4 rounded-2xl border border-slate-100 bg-slate-50/70 p-4 transition hover:border-blue-200 hover:bg-blue-50/30 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex min-w-0 items-start gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 shadow-sm">
                        <CalendarCheck2
                          size={18}
                        />
                      </span>

                      <div className="min-w-0">
                        <p className="font-bold text-slate-950">
                          {
                            attendance
                              .trainingSession
                              .title
                          }
                        </p>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1.5">
                            <ShieldCheck
                              size={13}
                            />
                            {
                              attendance
                                .trainingSession
                                .team
                                .name
                            }
                          </span>

                          <span className="inline-flex items-center gap-1.5">
                            <Clock3
                              size={13}
                            />
                            {formatDateTime(
                              attendance
                                .trainingSession
                                .startsAt
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={[
                        "inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-bold",
                        attendanceClass(
                          attendance.status
                        ),
                      ].join(" ")}
                    >
                      <Icon size={14} />

                      {attendanceLabel(
                        attendance.status
                      )}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        )}
      </section>
    </div>
  );
}