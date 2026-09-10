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

export function PerformanceChart({
  data,
}: {
  data: PerformanceItem[];
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        Nuk ka ende të dhëna performance.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <AreaChart
          data={data}
          margin={{
            top: 10,
            right: 6,
            left: -28,
            bottom: 0,
          }}
        >
          <CartesianGrid
            stroke="#eef2f7"
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

          <Tooltip />

          <Area
            type="monotone"
            dataKey="vlera"
            stroke="#3b82f6"
            strokeWidth={3}
            fill="#dbeafe"
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
      <div className="flex h-[220px] items-center justify-center text-sm text-slate-400">
        Nuk ka ende të dhëna pjesëmarrjeje.
      </div>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer
        width="100%"
        height="100%"
      >
        <BarChart
          data={data}
          margin={{
            top: 10,
            right: 6,
            left: -28,
            bottom: 0,
          }}
        >
          <CartesianGrid
            stroke="#eef2f7"
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
            dataKey="prezent"
            stackId="a"
            fill="#2f80c9"
          />

          <Bar
            dataKey="mungon"
            stackId="a"
            fill="#f59e0b"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}