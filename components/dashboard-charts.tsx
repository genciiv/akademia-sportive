"use client";

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

type PerformanceItem = {
  emri: string;
  vlera: number;
};

type AttendanceItem = {
  emri: string;
  prezent: number;
  mungon: number;
};

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{
    name?: string;
    value?: number;
    color?: string;
  }>;
  label?: string;
}) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2.5 shadow-lg backdrop-blur">
      {label ? (
        <p className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      ) : null}

      <div className="space-y-1">
        {payload.map((item, index) => (
          <div
            key={`${item.name ?? "value"}-${index}`}
            className="flex items-center justify-between gap-4 text-xs"
          >
            <span className="font-medium text-slate-500">
              {item.name === "vlera"
                ? "Vlerësimi"
                : item.name === "prezent"
                  ? "Prezent"
                  : item.name === "mungon"
                    ? "Mungon"
                    : item.name}
            </span>

            <span className="font-bold text-slate-950">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PerformanceChart({
  data,
}: {
  data: PerformanceItem[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl bg-violet-50/40 text-sm text-slate-400">
        Nuk ka ende të dhëna performance.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{
            top: 12,
            right: 8,
            left: -24,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient
              id="performanceGradient"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor="#8b5cf6"
                stopOpacity={0.28}
              />
              <stop
                offset="100%"
                stopColor="#8b5cf6"
                stopOpacity={0.03}
              />
            </linearGradient>
          </defs>

          <CartesianGrid
            stroke="#eef2f7"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="emri"
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            dy={8}
          />

          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            domain={[0, 10]}
          />

          <Tooltip
            content={<ChartTooltip />}
            cursor={{
              stroke: "#c4b5fd",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />

          <Area
            type="monotone"
            dataKey="vlera"
            name="vlera"
            stroke="#7c3aed"
            strokeWidth={3}
            fill="url(#performanceGradient)"
            activeDot={{
              r: 5,
              fill: "#7c3aed",
              stroke: "#ffffff",
              strokeWidth: 3,
            }}
            dot={{
              r: 3,
              fill: "#ffffff",
              stroke: "#7c3aed",
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceChart({
  data,
}: {
  data: AttendanceItem[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center rounded-2xl bg-emerald-50/40 text-sm text-slate-400">
        Nuk ka ende të dhëna pjesëmarrjeje.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{
            top: 12,
            right: 8,
            left: -24,
            bottom: 0,
          }}
          barCategoryGap="28%"
        >
          <CartesianGrid
            stroke="#eef2f7"
            strokeDasharray="4 4"
            vertical={false}
          />

          <XAxis
            dataKey="emri"
            tickLine={false}
            axisLine={false}
            tick={{
              fontSize: 10,
              fill: "#94a3b8",
            }}
            dy={8}
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
            content={<ChartTooltip />}
            cursor={{
              fill: "#f8fafc",
            }}
          />

          <Bar
            dataKey="prezent"
            name="prezent"
            stackId="a"
            fill="#10b981"
            radius={[6, 6, 0, 0]}
          />

          <Bar
            dataKey="mungon"
            name="mungon"
            stackId="a"
            fill="#fbbf24"
            radius={[6, 6, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}