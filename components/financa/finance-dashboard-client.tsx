"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  CircleDollarSign,
  Loader2,
  TrendingUp,
  UserRoundX,
  WalletCards,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

type FinanceResponse = {
  summary: {
    totalCollected: number;
    collectedThisMonth: number;
    totalCharges: number;
    totalOutstanding: number;
    paymentCount: number;
    playersWithDebt: number;
  };
  monthly: {
    year: number;
    month: number;
    totalLek: number;
  }[];
  recentPayments: {
    id: string;
    amountLek: number;
    paidAt: string;
    notes: string | null;
    player: {
      id: string;
      firstName: string;
      lastName: string;
    };
    charge: {
      id: string;
      title: string;
    };
  }[];
  debts: {
    id: string;
    title: string;
    player: {
      id: string;
      firstName: string;
      lastName: string;
    };
    amountLek: number;
    paidLek: number;
    remainingLek: number;
    dueDate: string | null;
    status: string;
  }[];
};

const MUAJT = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

function lek(value: number) {
  return `${new Intl.NumberFormat("sq-AL").format(value)} Lek`;
}

function dataShqip(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${date.getDate()} ${
    MUAJT[date.getMonth()]
  } ${date.getFullYear()}`;
}

export default function FinanceDashboardClient() {
  const [data, setData] =
    useState<FinanceResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  async function ngarko() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        "/api/finance",
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Financa nuk u ngarkua."
        );
      }

      setData(result);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ngarko();
  }, []);

  const chartData = useMemo(() => {
    if (!data) {
      return [];
    }

    return data.monthly.map(
      (item) => ({
        label: `${
          MUAJT[item.month - 1]
        } ${String(
          item.year
        ).slice(-2)}`,
        total: item.totalLek,
      })
    );
  }, [data]);

  return (
    <AppShell>
      <PageHeader
        title="Financa"
        description="Pasqyra reale e arkëtimeve dhe detyrimeve të akademisë."
      />

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white">
          <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <StatCard
              title="Arkëtime gjithsej"
              value={lek(
                data?.summary.totalCollected ?? 0
              )}
              icon={
                <Banknote className="h-5 w-5" />
              }
            />

            <StatCard
              title="Arkëtime këtë muaj"
              value={lek(
                data?.summary.collectedThisMonth ??
                  0
              )}
              icon={
                <TrendingUp className="h-5 w-5" />
              }
            />

            <StatCard
              title="Detyrime gjithsej"
              value={lek(
                data?.summary.totalCharges ?? 0
              )}
              icon={
                <WalletCards className="h-5 w-5" />
              }
            />

            <StatCard
              title="Për t'u arkëtuar"
              value={lek(
                data?.summary.totalOutstanding ??
                  0
              )}
              icon={
                <CircleDollarSign className="h-5 w-5" />
              }
            />

            <StatCard
              title="Pagesa të regjistruara"
              value={String(
                data?.summary.paymentCount ?? 0
              )}
              icon={
                <Banknote className="h-5 w-5" />
              }
            />

            <StatCard
              title="Sportistë me detyrim"
              value={String(
                data?.summary.playersWithDebt ?? 0
              )}
              icon={
                <UserRoundX className="h-5 w-5" />
              }
            />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="font-bold text-slate-950">
                Arkëtimet në 12 muajt e fundit
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Pagesat në dorë të regjistruara në sistem.
              </p>
            </div>

            <div className="mt-6 h-[320px]">
              <ResponsiveContainer
                width="100%"
                height="100%"
              >
                <BarChart
                  data={chartData}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tickFormatter={(value) =>
                      new Intl.NumberFormat(
                        "sq-AL",
                        {
                          notation: "compact",
                        }
                      ).format(
                        Number(value)
                      )
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      lek(Number(value)),
                      "Arkëtime",
                    ]}
                  />

                  <Bar
                    dataKey="total"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-bold text-slate-950">
                  Arkëtimet e fundit
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pagesat më të fundit të regjistruara.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {data?.recentPayments.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                    Nuk ka pagesa të regjistruara.
                  </div>
                ) : (
                  data?.recentPayments.map(
                    (payment) => (
                      <div
                        key={payment.id}
                        className="flex items-start justify-between gap-4 rounded-xl border border-slate-100 p-4"
                      >
                        <div>
                          <p className="font-bold text-slate-950">
                            {
                              payment.player
                                .firstName
                            }{" "}
                            {
                              payment.player
                                .lastName
                            }
                          </p>

                          <p className="mt-1 text-sm text-slate-600">
                            {
                              payment.charge
                                .title
                            }
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {dataShqip(
                              payment.paidAt
                            )}
                          </p>
                        </div>

                        <p className="font-bold text-emerald-700">
                          {lek(
                            payment.amountLek
                          )}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div>
                <h2 className="font-bold text-slate-950">
                  Detyrimet e hapura
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Sportistët me shuma të papaguara.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {data?.debts.length ===
                0 ? (
                  <div className="rounded-xl border border-dashed border-slate-200 p-5 text-center text-sm text-slate-500">
                    Nuk ka detyrime të hapura.
                  </div>
                ) : (
                  data?.debts.map(
                    (debt) => (
                      <div
                        key={debt.id}
                        className="rounded-xl border border-slate-100 p-4"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-bold text-slate-950">
                              {
                                debt.player
                                  .firstName
                              }{" "}
                              {
                                debt.player
                                  .lastName
                              }
                            </p>

                            <p className="mt-1 text-sm text-slate-600">
                              {debt.title}
                            </p>
                          </div>

                          <p className="font-bold text-red-600">
                            {lek(
                              debt.remainingLek
                            )}
                          </p>
                        </div>

                        <div className="mt-3 grid grid-cols-2 gap-3">
                          <MiniStat
                            label="Detyrimi"
                            value={lek(
                              debt.amountLek
                            )}
                          />

                          <MiniStat
                            label="Paguar"
                            value={lek(
                              debt.paidLek
                            )}
                          />
                        </div>
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-500">
          {title}
        </p>

        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MiniStat({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-3">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}