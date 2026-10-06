import Link from "next/link";
import {
  ArrowRight,
  Building2,
  ClipboardList,
  CreditCard,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";

import { PlatformAdminShell } from "@/components/platform-admin-shell";
import { getPlatformAdminAccess } from "@/lib/platform-admin";
import { prisma } from "@/lib/prisma";

export default async function PlatformAdminPage() {
  const access =
    await getPlatformAdminAccess();

  if (!access.ok) {
    if (access.status === 401) {
      redirect(
        "/hyrje?next=/platform-admin"
      );
    }

    redirect("/");
  }

  const [
    academies,
    users,
    pendingApplications,
    applications,
    trialAcademies,
    activeSubscriptions,
  ] = await Promise.all([
    prisma.academy.count(),

    prisma.user.count(),

    prisma.academyApplication.count({
      where: {
        status: "PENDING",
      },
    }),

    prisma.academyApplication.findMany({
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
      select: {
        id: true,
        academyName: true,
        contactName: true,
        city: true,
        status: true,
        createdAt: true,
      },
    }),

    prisma.academy.count({
      where: {
        status: "TRIAL",
      },
    }),

    prisma.academySubscription.count({
      where: {
        status: "ACTIVE",
      },
    }),
  ]);

  return (
    <PlatformAdminShell>
      <div className="mb-7">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Përshëndetje,{" "}
              {access.user.name ||
                "Administrator"}!
            </h1>

            <p className="mt-1.5 text-sm text-slate-500">
              Ja një përmbledhje e platformës dhe
              aktivitetit të akademive.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3">
            <p className="text-xs font-medium text-slate-400">
              Roli
            </p>

            <p className="mt-0.5 text-sm font-bold text-slate-900">
              Platform Admin
            </p>

            <p className="mt-0.5 text-xs text-slate-500">
              {access.user.email}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          icon={<Building2 size={19} />}
          title="Akademi totale"
          value={academies}
          hint={`${trialAcademies} në trial`}
        />

        <StatCard
          icon={<ClipboardList size={19} />}
          title="Aplikime në pritje"
          value={pendingApplications}
          hint="Kërkojnë shqyrtim"
          accent
        />

        <StatCard
          icon={<UsersRound size={19} />}
          title="Përdorues"
          value={users}
          hint="Në gjithë platformën"
        />

        <StatCard
          icon={<CreditCard size={19} />}
          title="Abonime aktive"
          value={activeSubscriptions}
          hint="Jashtë trial-it"
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[1.1fr_.9fr]">
        <section className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/40 p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-sm font-black tracking-tight text-slate-950">
                Aplikimet e fundit
              </h2>

              <p className="mt-1 text-xs text-slate-400">
                Kërkesat më të fundit për hyrje në platformë.
              </p>
            </div>

            <Link
              href="/platform-admin/aplikimet"
              className="flex items-center gap-1 text-xs font-bold text-violet-700 transition hover:text-violet-900"
            >
              Shiko të gjitha
              <ArrowRight size={14} />
            </Link>
          </div>

          {applications.length === 0 ? (
            <div className="flex min-h-[250px] items-center justify-center text-sm text-slate-400">
              Nuk ka ende aplikime.
            </div>
          ) : (
            <div className="mt-5 space-y-2">
              {applications.map(
                (application) => (
                  <Link
                    key={application.id}
                    href="/platform-admin/aplikimet"
                    className="flex items-center justify-between gap-4 rounded-2xl border border-slate-100 bg-white px-4 py-3.5 transition hover:border-violet-200 hover:bg-violet-50/50 hover:shadow-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-bold text-slate-900">
                        {
                          application.academyName
                        }
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {
                          application.contactName
                        }
                        {application.city
                          ? ` · ${application.city}`
                          : ""}
                      </p>
                    </div>

                    <StatusBadge
                      status={
                        application.status
                      }
                    />
                  </Link>
                )
              )}
            </div>
          )}
        </section>

        <section className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-white via-white to-violet-50/40 p-5 shadow-sm sm:p-6">
          <h2 className="text-sm font-black tracking-tight text-slate-950">
            Gjendja e platformës
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            Përmbledhje e shpejtë e onboarding-ut.
          </p>

          <div className="mt-6 space-y-4">
            <Metric
              label="Akademi totale"
              value={academies}
            />

            <Metric
              label="Akademi në trial"
              value={trialAcademies}
            />

            <Metric
              label="Abonime aktive"
              value={activeSubscriptions}
            />

            <Metric
              label="Aplikime në pritje"
              value={pendingApplications}
            />
          </div>
        </section>
      </div>
    </PlatformAdminShell>
  );
}

function StatCard({
  icon,
  title,
  value,
  hint,
  accent = false,
}: {
  icon: React.ReactNode;
  title: string;
  value: number;
  hint: string;
  accent?: boolean;
}) {
  const tones = {
    "Akademi totale":
      "border-violet-200 bg-gradient-to-br from-violet-100 via-violet-50/70 to-white",
    "Aplikime në pritje":
      "border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50/70 to-white",
    "Përdorues":
      "border-sky-200 bg-gradient-to-br from-sky-100 via-sky-50/70 to-white",
    "Abonime aktive":
      "border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50/70 to-white",
  } as const;

  return (
    <div
      className={[
        "rounded-[24px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        tones[title as keyof typeof tones] ??
          "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-violet-700 shadow-sm ring-1 ring-slate-100">
        {icon}
      </div>

      <p className="mt-5 text-xs font-bold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-3xl font-black tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1.5 text-[11px] font-medium text-slate-400">
        {hint}
      </p>
    </div>
  );
}
function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const tones = {
    "Akademi totale":
      "border-violet-100 bg-violet-50/70 text-violet-700",
    "Akademi në trial":
      "border-amber-100 bg-amber-50/70 text-amber-700",
    "Abonime aktive":
      "border-emerald-100 bg-emerald-50/70 text-emerald-700",
    "Aplikime në pritje":
      "border-sky-100 bg-sky-50/70 text-sky-700",
  } as const;

  return (
    <div
      className={[
        "flex items-center justify-between rounded-2xl border px-4 py-4 transition hover:-translate-y-0.5 hover:shadow-sm",
        tones[label as keyof typeof tones] ??
          "border-slate-100 bg-slate-50",
      ].join(" ")}
    >
      <span className="text-sm font-semibold">
        {label}
      </span>

      <span className="flex h-8 min-w-8 items-center justify-center rounded-xl bg-white px-2 text-sm font-black text-slate-950 shadow-sm">
        {value}
      </span>
    </div>
  );
}
function StatusBadge({
  status,
}: {
  status:
    | "PENDING"
    | "CONTACTED"
    | "APPROVED"
    | "REJECTED";
}) {
  const values = {
    PENDING: {
      label: "Në pritje",
      style:
        "bg-slate-100 text-slate-600",
    },
    CONTACTED: {
      label: "Kontaktuar",
      style:
        "bg-amber-50 text-amber-700",
    },
    APPROVED: {
      label: "Aprovuar",
      style:
        "bg-emerald-50 text-emerald-700",
    },
    REJECTED: {
      label: "Refuzuar",
      style:
        "bg-red-50 text-red-700",
    },
  };

  const value = values[status];

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${value.style}`}
    >
      {value.label}
    </span>
  );
}