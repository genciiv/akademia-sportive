"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const performance = [
  { emri: "14/05", vlera: 62 }, { emri: "17/05", vlera: 64 }, { emri: "20/05", vlera: 66 },
  { emri: "23/05", vlera: 82 }, { emri: "27/05", vlera: 76 }, { emri: "30/05", vlera: 79 },
  { emri: "03/06", vlera: 77 }, { emri: "06/06", vlera: 81 }, { emri: "10/06", vlera: 84 },
  { emri: "13/06", vlera: 68 }, { emri: "17/06", vlera: 71 }, { emri: "20/06", vlera: 85 }
];

const attendance = [
  { emri: "20/05", prezent: 24, mungon: 0 }, { emri: "23/05", prezent: 18, mungon: 6 },
  { emri: "27/05", prezent: 18, mungon: 6 }, { emri: "30/05", prezent: 24, mungon: 0 },
  { emri: "03/06", prezent: 22, mungon: 2 }, { emri: "06/06", prezent: 18, mungon: 6 },
  { emri: "10/06", prezent: 22, mungon: 2 }, { emri: "13/06", prezent: 24, mungon: 0 },
  { emri: "17/06", prezent: 24, mungon: 0 }, { emri: "20/06", prezent: 23, mungon: 1 }
];

export function PerformanceChart() {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={performance} margin={{ top: 10, right: 6, left: -28, bottom: 0 }}>
          <defs>
            <linearGradient id="plot" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="emri" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[50, 90]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Area type="monotone" dataKey="vlera" stroke="#3b82f6" strokeWidth={3} fill="url(#plot)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function AttendanceChart() {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={attendance} margin={{ top: 10, right: 6, left: -28, bottom: 0 }}>
          <CartesianGrid stroke="#eef2f7" vertical={false} />
          <XAxis dataKey="emri" tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 10, fill: "#94a3b8" }} domain={[0, 24]} />
          <Tooltip contentStyle={{ borderRadius: 12, border: "1px solid #e2e8f0", fontSize: 12 }} />
          <Bar dataKey="prezent" stackId="a" fill="#2f80c9" radius={[4,4,0,0]} />
          <Bar dataKey="mungon" stackId="a" fill="#f59e0b" radius={[4,4,0,0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
