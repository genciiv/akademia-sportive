"use client";

import {
  BarChart3,
  Building2,
  CircleDollarSign,
  ClipboardList,
  CreditCard,
  ShieldCheck,
  TrendingUp,
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

const STATUS_TONES: Record<
  string,
  string
> = {
  Trial:
    "bg-blue-100 text-blue-700",
  Aktive:
    "bg-emerald-100 text-emerald-700",
  Pezulluar:
    "bg-amber-100 text-amber-700",
  Grace:
    "bg-violet-100 text-violet-700",
  Skaduar:
    "bg-orange-100 text-orange-700",
  Anuluar:
    "bg-slate-100 text-slate-600",
  "Në pritje":
    "bg-amber-100 text-amber-700",
  Kontaktuar:
    "bg-blue-100 text-blue-700",
  Aprovuar:
    "bg-emerald-100 text-emerald-700",
  Refuzuar:
    "bg-red-100 text-red-700",
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

  const activeAcademies =
    academyStatuses.find(
      (item) =>
        item.status === "ACTIVE"
    )?.value ?? 0;

  const activeSubscriptions =
    subscriptionStatuses.find(
      (item) =>
        item.status === "ACTIVE"
    )?.value ?? 0;

  const latestRevenue =
    monthlyRevenue.at(-1)?.value ?? 0;

  return (
    <div>
      <div className="mb-7 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/40 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              <BarChart3 size={13} />
              Analitika e platformës
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              Raportet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Pamje e konsoliduar e performancës, të ardhurave dhe gjendjes operative të platformës.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
            <ShieldCheck size={15} />
            Të dhëna të përditësuara
          </div>
        </div>
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
          icon={
            <TrendingUp size={17} />
          }
        >
          {monthlyRevenue.every(
            (item) =>
              item.value === 0
          ) ? (
            <EmptyChart
              text="Nuk ka ende të ardhura të regjistruara."
            />
          ) : (
            <div className="h-[280px] w-full">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <AreaChart
                  data={
                    monthlyRevenue
                  }
                  margin={{
                    top: 14,
                    right: 12,
                    left: -8,
                    bottom: 0,
                  }}
                >
                  <defs>
                    <linearGradient
                      id="revenueFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="0%"
                        stopColor="#3b82f6"
                        stopOpacity={0.32}
                      />
                      <stop
                        offset="100%"
                        stopColor="#3b82f6"
                        stopOpacity={0.03}
                      />
                    </linearGradient>
                  </defs>

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

                  <Tooltip
                    content={
                      <RevenueTooltip />
                    }
                  />

                  <Area
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    fill="url(#revenueFill)"
                    dot={{
                      r: 3,
                      fill: "#3b82f6",
                      strokeWidth: 0,
                    }}
                    activeDot={{
                      r: 5,
                    }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Panel>

        <Panel
          title="Gjendja e akademive"
          subtitle="Akademitë sipas statusit"
          icon={
            <Building2 size={17} />
          }
        >
          <StatusBarChart
            data={academyData}
          />

          <StatusLegend
            data={academyData}
          />
        </Panel>

        <Panel
          title="Gjendja e abonimeve"
          subtitle="Cikli aktual i abonimeve"
          icon={
            <CreditCard size={17} />
          }
        >
          <StatusBarChart
            data={
              subscriptionData
            }
          />

          <StatusLegend
            data={
              subscriptionData
            }
          />
        </Panel>

        <Panel
          title="Aplikimet"
          subtitle="Statusi i kërkesave për platformën"
          icon={
            <ClipboardList
              size={17}
            />
          }
        >
          <StatusBarChart
            data={
              applicationData
            }
          />

          <StatusLegend
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
          subtitle="Historiku financiar"
          icon={
            <CreditCard size={17} />
          }
        />

        <Summary
          title="Të ardhura totale"
          value={formatMoney(
            stats.totalRevenue
          )}
          subtitle={`Muaji i fundit ${formatMoney(
            latestRevenue
          )}`}
          icon={
            <CircleDollarSign
              size={17}
            />
          }
        />

        <Summary
          title="Akademi aktive"
          value={String(
            activeAcademies
          )}
          subtitle={`${stats.academies} gjithsej`}
          icon={
            <Building2 size={17} />
          }
        />

        <Summary
          title="Abonime aktive"
          value={String(
            activeSubscriptions
          )}
          subtitle="Cikli aktual"
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
    <div className="h-[250px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 12,
            right: 10,
            left: -20,
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

          <Tooltip
            content={
              <StatusTooltip />
            }
          />

          <Bar
            dataKey="value"
            fill="#6366f1"
            radius={[
              8,
              8,
              0,
              0,
            ]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function RevenueTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
  }>;
  label?: string;
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-950">
        {formatMoney(
          Number(
            payload[0]?.value ?? 0
          )
        )}
      </p>
    </div>
  );
}

function StatusTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    value?: number;
  }>;
  label?: string;
}) {
  if (
    !active ||
    !payload?.length
  ) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-950">
        {payload[0]?.value ?? 0}
      </p>
    </div>
  );
}

function StatusLegend({
  data,
}: {
  data: Array<{
    label: string;
    value: number;
  }>;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-4">
      {data.map((item) => (
        <div
          key={item.label}
          className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5"
        >
          <span
            className={[
              "rounded-full px-2 py-0.5 text-[9px] font-bold",
              STATUS_TONES[
                item.label
              ] ??
                "bg-slate-100 text-slate-600",
            ].join(" ")}
          >
            {item.label}
          </span>

          <span className="text-xs font-bold text-slate-700">
            {item.value}
          </span>
        </div>
      ))}
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
  const tones: Record<
    string,
    string
  > = {
    Akademi:
      "border-violet-200 bg-gradient-to-br from-violet-100 via-violet-50/70 to-white",

    Përdorues:
      "border-blue-200 bg-gradient-to-br from-blue-100 via-blue-50/70 to-white",

    "Aplikime në pritje":
      "border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50/70 to-white",

    "Të ardhura":
      "border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50/70 to-white",
  };

  return (
    <div
      className={[
        "rounded-[24px] border p-5 shadow-sm",
        tones[title] ??
          "border-slate-200 bg-white",
      ].join(" ")}
    >
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/80 text-slate-800 shadow-sm">
        {icon}
      </div>

      <p className="mt-4 text-[11px] font-bold uppercase tracking-wide text-slate-500">
        {title}
      </p>

      <p className="mt-1 text-2xl font-black tracking-tight text-slate-950">
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
  icon,
  children,
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-violet-700">
          {icon}
        </div>

        <div>
          <h2 className="text-sm font-bold text-slate-900">
            {title}
          </h2>

          <p className="mt-1 text-xs text-slate-400">
            {subtitle}
          </p>
        </div>
      </div>

      {children}
    </section>
  );
}

function Summary({
  title,
  value,
  subtitle,
  icon,
}: {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-[22px] border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-slate-400">
          {title}
        </p>

        <p className="mt-1 text-sm font-black text-slate-950">
          {value}
        </p>

        <p className="mt-1 text-[10px] text-slate-400">
          {subtitle}
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
    <div className="flex h-[250px] items-center justify-center rounded-2xl bg-slate-50/40 text-center">
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