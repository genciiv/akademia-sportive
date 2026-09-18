"use client";

import {
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  UsersRound,
} from "lucide-react";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type StatusItem = {
  status: string;
  value: number;
};

type RevenueItem = {
  label: string;
  value: number;
};

type Props = {
  stats: {
    academies: number;
    users: number;
    pendingApplications: number;
    payments: number;
    totalRevenue: number;
  };

  academyStatuses: StatusItem[];
  subscriptionStatuses: StatusItem[];
  applicationStatuses: StatusItem[];
  monthlyRevenue: RevenueItem[];
};

const ACADEMY_LABELS: Record<
  string,
  string
> = {
  TRIAL: "Trial",
  ACTIVE: "Aktive",
  SUSPENDED: "Pezulluar",
};

const SUBSCRIPTION_LABELS: Record<
  string,
  string
> = {
  TRIALING: "Trial",
  ACTIVE: "Aktive",
  GRACE_PERIOD: "Grace",
  EXPIRED: "Skaduar",
  CANCELLED: "Anuluar",
};

const APPLICATION_LABELS: Record<
  string,
  string
> = {
  PENDING: "Në pritje",
  CONTACTED: "Kontaktuar",
  APPROVED: "Aprovuar",
  REJECTED: "Refuzuar",
};

export function PlatformReportsClient({
  stats,
  academyStatuses,
  subscriptionStatuses,
  applicationStatuses,
  monthlyRevenue,
}: Props) {
  const academyData =
    academyStatuses.map(
      (item) => ({
        label:
          ACADEMY_LABELS[
            item.status
          ] ?? item.status,
        value: item.value,
      })
    );

  const subscriptionData =
    subscriptionStatuses.map(
      (item) => ({
        label:
          SUBSCRIPTION_LABELS[
            item.status
          ] ?? item.status,
        value: item.value,
      })
    );

  const applicationData =
    applicationStatuses.map(
      (item) => ({
        label:
          APPLICATION_LABELS[
            item.status
          ] ?? item.status,
        value: item.value,
      })
    );

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Raportet
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Pamje e përgjithshme e
          performancës dhe gjendjes së
          platformës.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Akademi"
          value={String(
            stats.academies
          )}
          hint="Në platformë"
          icon={
            <Building2 size={18} />
          }
        />

        <Stat
          title="Përdorues"
          value={String(
            stats.users
          )}
          hint="Llogari totale"
          icon={
            <UsersRound size={18} />
          }
        />

        <Stat
          title="Aplikime në pritje"
          value={String(
            stats.pendingApplications
          )}
          hint="Për shqyrtim"
          icon={
            <ClipboardList
              size={18}
            />
          }
        />

        <Stat
          title="Të ardhura"
          value={formatMoney(
            stats.totalRevenue
          )}
          hint={`${stats.payments} pagesa`}
          icon={
            <CircleDollarSign
              size={18}
            />
          }
        />
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-2">
        <Panel
          title="Të ardhurat e platformës"
          subtitle="6 muajt e fundit · ALL"
        >
          {monthlyRevenue.every(
            (item) =>
              item.value === 0
          ) ? (
            <EmptyChart
              text="Nuk ka ende të ardhura të regjistruara."
            />
          ) : (
            <div className="h-[260px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={
                    monthlyRevenue
                  }
                  margin={{
                    top: 10,
                    right: 8,
                    left: -12,
                    bottom: 0,
                  }}
                >
                  <CartesianGrid
                    stroke="#eef2f7"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{
                      fontSize: 10,
                      fill: "#94a3b8",
                    }}
                  />

                  <Tooltip />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="#dbeafe"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Gjendja e akademive"
          subtitle="Akademitë sipas statusit"
        >
          <StatusBarChart
            data={academyData}
          />
        </Panel>

        <Panel
          title="Gjendja e abonimeve"
          subtitle="Cikli aktual i abonimeve"
        >
          <StatusBarChart
            data={
              subscriptionData
            }
          />
        </Panel>

        <Panel
          title="Aplikimet"
          subtitle="Statusi i kërkesave për platformën"
        >
          <StatusBarChart
            data={
              applicationData
            }
          />
        </Panel>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Summary
          title="Pagesa"
          value={String(
            stats.payments
          )}
          icon={
            <CreditCard size={17} />
          }
        />

        <Summary
          title="Të ardhura totale"
          value={formatMoney(
            stats.totalRevenue
          )}
          icon={
            <CircleDollarSign
              size={17}
            />
          }
        />

        <Summary
          title="Akademi aktive"
          value={String(
            academyStatuses.find(
              (item) =>
                item.status ===
                "ACTIVE"
            )?.value ?? 0
          )}
          icon={
            <Building2 size={17} />
          }
        />

        <Summary
          title="Abonime aktive"
          value={String(
            subscriptionStatuses.find(
              (item) =>
                item.status ===
                "ACTIVE"
            )?.value ?? 0
          )}
          icon={
            <BarChart3 size={17} />
          }
        />
      </div>
    </div>
  );
}

function StatusBarChart({
  data,
}: {
  data: Array<{
    label: string;
    value: number;
  }>;
}) {
  if (
    data.every(
      (item) =>
        item.value === 0
    )
  ) {
    return (
      <EmptyChart text="Nuk ka ende të dhëna." />
    );
  }

  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 8,
            left: -24,
            bottom: 0,
          }}
        >
          <CartesianGrid
            stroke="#eef2f7"
            vertical={false}
          />

          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
          />

          <YAxis
            allowDecimals={false}
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
          />

          <Tooltip />

          <Bar
            dataKey="value"
            fill="#2f80c9"
            radius={[
              6,
              6,
              0,
              0,
            ]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function Stat({
  title,
  value,
  hint,
  icon,
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        {icon}
      </div>

      <p className="mt-4 text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
        {value}
      </p>

      <p className="mt-1.5 text-[11px] text-slate-400">
        {hint}
      </p>
    </div>
  );
}

function Panel({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_8px_18px_rgba(15,23,42,0.04)]">
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      </div>

      {children}
    </section>
  );
}

function Summary({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <div>
        <p className="text-[11px] text-slate-400">
          {title}
        </p>

        <p className="mt-0.5 text-sm font-bold text-slate-950">
          {value}
        </p>
      </div>
    </div>
  );
}

function EmptyChart({
  text,
}: {
  text: string;
}) {
  return (
    <div className="flex h-[260px] items-center justify-center text-center">
      <div>
        <BarChart3 className="mx-auto h-8 w-8 text-slate-300" />

        <p className="mt-3 text-sm font-semibold text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}

function formatMoney(
  value: number
) {
  if (
    !Number.isFinite(value)
  ) {
    return "0 ALL";
  }

  const rounded =
    Math.round(value * 100) / 100;

  const text =
    String(rounded).replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );

  return `${text} ALL`;
}