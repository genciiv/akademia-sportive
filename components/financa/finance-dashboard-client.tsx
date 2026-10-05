"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Banknote,
  CircleDollarSign,
  Download,
  Loader2,
  Printer,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  UserRoundX,
  WalletCards,
} from "lucide-react";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { AppShell } from "@/components/app-shell";
import {
  downloadFinanceReportPdf,
  printFinanceReport,
} from "@/components/financa/finance-report-export";


type FinanceResponse = {
  summary: {
    totalCollected: number;
    collectedThisMonth: number;
    totalExpenses: number;
    expensesThisMonth: number;
    netProfit: number;
    netProfitThisMonth: number;
    totalCharges: number;
    totalOutstanding: number;
    paymentCount: number;
    expenseCount: number;
    playersWithDebt: number;
  };

  monthly: {
    year: number;
    month: number;
    collectedLek: number;
    expensesLek: number;
    netLek: number;
  }[];

  expenseCategories: {
    category: string;
    totalLek: number;
    count: number;
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

  periodReport: {
    from: string;
    to: string;

    summary: {
      collectedLek: number;
      expensesLek: number;
      netLek: number;
      paymentCount: number;
      expenseCount: number;
      payingPlayers: number;
    };

    expenseCategories: {
      category: string;
      totalLek: number;
      count: number;
    }[];

    payments: {
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

    expenses: {
      id: string;
      category: string;
      title: string;
      amountLek: number;
      expenseDate: string;
      description: string | null;
      notes: string | null;
    }[];
  } | null;

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

const KATEGORITE: Record<string, string> = {
  SALARY: "Paga",
  RENT: "Qira",
  EQUIPMENT: "Pajisje",
  TRANSPORT: "Transport",
  MEDICAL: "Mjekësore",
  TOURNAMENT: "Turne",
  UTILITIES: "Shërbime",
  MARKETING: "Marketing",
  OTHER: "Të tjera",
};

function lek(value: number) {
  return `${new Intl.NumberFormat(
    "sq-AL"
  ).format(value)} Lek`;
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

function dateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function currentMonthRange() {
  const now = new Date();

  return {
    from: dateInputValue(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    ),
    to: dateInputValue(
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      )
    ),
  };
}

export default function FinanceDashboardClient() {
  const [data, setData] =
    useState<FinanceResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const initialPeriod =
    currentMonthRange();

  const [reportFrom, setReportFrom] =
    useState(initialPeriod.from);

  const [reportTo, setReportTo] =
    useState(initialPeriod.to);

  const [reportLoading, setReportLoading] =
    useState(false);

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const [reportError, setReportError] =
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

  async function ngarkoRaportin(
    from = reportFrom,
    to = reportTo
  ) {
    if (!from || !to) {
      setReportError(
        "Zgjidh datën fillestare dhe datën përfundimtare."
      );
      return;
    }

    if (from > to) {
      setReportError(
        "Data fillestare nuk mund të jetë pas datës përfundimtare."
      );
      return;
    }

    setReportLoading(true);
    setReportError("");

    try {
      const params =
        new URLSearchParams({
          from,
          to,
        });

      const response = await fetch(
        `/api/finance?${params.toString()}`,
        {
          cache: "no-store",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Raporti financiar nuk u gjenerua."
        );
      }

      setData(result);
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim gjatë gjenerimit të raportit."
      );
    } finally {
      setReportLoading(false);
    }
  }

  function raportiKyMuaj() {
    const range =
      currentMonthRange();

    setReportFrom(range.from);
    setReportTo(range.to);
    void ngarkoRaportin(
      range.from,
      range.to
    );
  }

  function raportiMuajiKaluar() {
    const now = new Date();

    const from = dateInputValue(
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      )
    );

    const to = dateInputValue(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      )
    );

    setReportFrom(from);
    setReportTo(to);
    void ngarkoRaportin(from, to);
  }

  function raportiKeteVit() {
    const now = new Date();

    const from = dateInputValue(
      new Date(
        now.getFullYear(),
        0,
        1
      )
    );

    const to = dateInputValue(
      now
    );

    setReportFrom(from);
    setReportTo(to);
    void ngarkoRaportin(from, to);
  }

  function printoRaportin() {
    if (!data?.periodReport) {
      return;
    }

    setReportError("");

    try {
      printFinanceReport(
        data.periodReport
      );
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "Raporti nuk mund të printohej."
      );
    }
  }

  async function shkarkoRaportinPdf() {
    if (!data?.periodReport) {
      return;
    }

    setPdfLoading(true);
    setReportError("");

    try {
      await downloadFinanceReportPdf(
        data.periodReport
      );
    } catch (error) {
      setReportError(
        error instanceof Error
          ? error.message
          : "PDF-ja nuk mund të shkarkohej."
      );
    } finally {
      setPdfLoading(false);
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
        arketime:
          item.collectedLek,
        shpenzime:
          item.expensesLek,
      })
    );
  }, [data]);

  return (
    <AppShell>
      <section className="relative mb-5 overflow-hidden rounded-[28px] border border-emerald-100 bg-gradient-to-br from-emerald-50 via-teal-50/70 to-sky-50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-emerald-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-emerald-700 shadow-sm ring-1 ring-emerald-100">
            <CircleDollarSign className="h-6 w-6" />
          </div>

          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600">
              Pasqyra financiare
            </p>

            <h1 className="text-3xl font-black tracking-tight text-slate-950">
              Financa
            </h1>

            <p className="mt-1.5 max-w-2xl text-sm leading-6 text-slate-600">
              Pasqyra financiare e arkëtimeve, shpenzimeve dhe detyrimeve të akademisë.
            </p>
          </div>
        </div>
      </section>

      <section className="mb-5 rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50/55 via-white to-sky-50/50 p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
              Raport financiar
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Raport sipas periudhës
            </h2>

            <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">
              Zgjidh intervalin e datave për të analizuar arkëtimet, shpenzimet dhe fitimin neto.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={raportiKyMuaj}
              className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
            >
              Ky muaj
            </button>

            <button
              type="button"
              onClick={raportiMuajiKaluar}
              className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
            >
              Muaji i kaluar
            </button>

            <button
              type="button"
              onClick={raportiKeteVit}
              className="rounded-xl border border-violet-200 bg-white px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-50"
            >
              Këtë vit
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">
              Nga data
            </span>

            <input
              type="date"
              value={reportFrom}
              onChange={(event) =>
                setReportFrom(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-xs font-bold text-slate-600">
              Deri më
            </span>

            <input
              type="date"
              value={reportTo}
              onChange={(event) =>
                setReportTo(event.target.value)
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-300 focus:ring-4 focus:ring-violet-100"
            />
          </label>

          <button
            type="button"
            onClick={() => void ngarkoRaportin()}
            disabled={reportLoading}
            className="self-end rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {reportLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Duke gjeneruar...
              </span>
            ) : (
              "Gjenero raportin"
            )}
          </button>
        </div>

        {reportError && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {reportError}
          </div>
        )}

        {data?.periodReport && (
          <div className="mt-5 border-t border-violet-100 pt-5">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-bold text-slate-900">
                Rezultati i raportit
              </p>

              <div className="flex flex-wrap items-center gap-2">
                <p className="mr-1 text-xs font-semibold text-slate-500">
                  {data.periodReport.from} → {data.periodReport.to}
                </p>

                <button
                  type="button"
                  onClick={printoRaportin}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                >
                  <Printer className="h-4 w-4" />
                  Printo
                </button>

                <button
                  type="button"
                  onClick={() => void shkarkoRaportinPdf()}
                  disabled={pdfLoading}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {pdfLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}

                  {pdfLoading
                    ? "Duke krijuar..."
                    : "Shkarko PDF"}
                </button>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <PeriodStatCard
                label="Arkëtime"
                value={lek(data.periodReport.summary.collectedLek)}
                tone="emerald"
              />

              <PeriodStatCard
                label="Shpenzime"
                value={lek(data.periodReport.summary.expensesLek)}
                tone="rose"
              />

              <PeriodStatCard
                label="Fitimi neto"
                value={lek(data.periodReport.summary.netLek)}
                tone={
                  data.periodReport.summary.netLek >= 0
                    ? "emerald"
                    : "rose"
                }
              />

              <PeriodStatCard
                label="Pagesa"
                value={String(data.periodReport.summary.paymentCount)}
                tone="sky"
              />

              <PeriodStatCard
                label="Sportistë pagues"
                value={String(data.periodReport.summary.payingPlayers)}
                tone="violet"
              />
            </div>

            <div className="mt-5 grid gap-4 xl:grid-cols-3">
              <div className="rounded-[20px] border border-rose-100 bg-white/80 p-4">
                <div className="mb-4">
                  <p className="font-black text-slate-950">
                    Shpenzimet sipas kategorisë
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Ndarja e shpenzimeve vetëm për periudhën e zgjedhur.
                  </p>
                </div>

                {data.periodReport.expenseCategories.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-rose-200 bg-rose-50/40 p-4 text-center text-sm text-slate-500">
                    Nuk ka shpenzime në këtë periudhë.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {data.periodReport.expenseCategories.map((item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between gap-3 rounded-[16px] border border-rose-100 bg-rose-50/35 p-3"
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-900">
                            {KATEGORITE[item.category] ?? "Të tjera"}
                          </p>

                          <p className="mt-0.5 text-xs text-slate-500">
                            {item.count} {item.count === 1 ? "regjistrim" : "regjistrime"}
                          </p>
                        </div>

                        <p className="text-sm font-black text-rose-700">
                          {lek(item.totalLek)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[20px] border border-emerald-100 bg-white/80 p-4">
                <div className="mb-4">
                  <p className="font-black text-slate-950">
                    Pagesat e periudhës
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Arkëtimet e regjistruara brenda intervalit.
                  </p>
                </div>

                {data.periodReport.payments.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-emerald-200 bg-emerald-50/40 p-4 text-center text-sm text-slate-500">
                    Nuk ka pagesa në këtë periudhë.
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {data.periodReport.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="rounded-[16px] border border-emerald-100 bg-emerald-50/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {payment.player.firstName} {payment.player.lastName}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-slate-600">
                              {payment.charge.title}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-black text-emerald-700">
                            {lek(payment.amountLek)}
                          </p>
                        </div>

                        <p className="mt-2 text-[11px] font-semibold text-slate-500">
                          {dataShqip(payment.paidAt)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-[20px] border border-amber-100 bg-white/80 p-4">
                <div className="mb-4">
                  <p className="font-black text-slate-950">
                    Shpenzimet e periudhës
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Daljet financiare të regjistruara brenda intervalit.
                  </p>
                </div>

                {data.periodReport.expenses.length === 0 ? (
                  <div className="rounded-[16px] border border-dashed border-amber-200 bg-amber-50/40 p-4 text-center text-sm text-slate-500">
                    Nuk ka shpenzime në këtë periudhë.
                  </div>
                ) : (
                  <div className="max-h-[360px] space-y-2 overflow-y-auto pr-1">
                    {data.periodReport.expenses.map((expense) => (
                      <div
                        key={expense.id}
                        className="rounded-[16px] border border-amber-100 bg-amber-50/30 p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-bold text-slate-900">
                              {expense.title}
                            </p>

                            <p className="mt-0.5 text-xs text-slate-600">
                              {KATEGORITE[expense.category] ?? "Të tjera"}
                            </p>
                          </div>

                          <p className="shrink-0 text-sm font-black text-rose-700">
                            {lek(expense.amountLek)}
                          </p>
                        </div>

                        <p className="mt-2 text-[11px] font-semibold text-slate-500">
                          {dataShqip(expense.expenseDate)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </section>

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Arkëtime gjithsej"
              tone="emerald"
              value={lek(
                data?.summary.totalCollected ?? 0
              )}
              icon={
                <Banknote className="h-5 w-5" />
              }
            />

            <StatCard
              title="Shpenzime gjithsej"
              tone="rose"
              value={lek(
                data?.summary.totalExpenses ?? 0
              )}
              icon={
                <TrendingDown className="h-5 w-5" />
              }
            />

            <StatCard
              title="Fitimi neto"
              tone={(data?.summary.netProfit ?? 0) >= 0 ? "emerald" : "rose"}
              value={lek(
                data?.summary.netProfit ?? 0
              )}
              icon={
                <CircleDollarSign className="h-5 w-5" />
              }
            />

            <StatCard
              title="Për t'u arkëtuar"
              tone="amber"
              value={lek(
                data?.summary.totalOutstanding ?? 0
              )}
              icon={
                <WalletCards className="h-5 w-5" />
              }
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MiniSummaryCard
              title="Arkëtime këtë muaj"
              tone="emerald"
              value={lek(
                data?.summary.collectedThisMonth ??
                  0
              )}
            />

            <MiniSummaryCard
              title="Shpenzime këtë muaj"
              tone="rose"
              value={lek(
                data?.summary.expensesThisMonth ??
                  0
              )}
            />

            <MiniSummaryCard
              title="Fitimi neto këtë muaj"
              tone={(data?.summary.netProfitThisMonth ?? 0) >= 0 ? "emerald" : "rose"}
              value={lek(
                data?.summary.netProfitThisMonth ??
                  0
              )}
            />

            <MiniSummaryCard
              title="Sportistë me detyrim"
              tone="violet"
              value={String(
                data?.summary.playersWithDebt ?? 0
              )}
            />
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <h2 className="text-base font-black text-slate-950">
                Arkëtime dhe shpenzime në 12 muajt e fundit
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Krahasimi mujor i hyrjeve dhe daljeve financiare.
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
                    stroke="#e2e8f0"
                    strokeDasharray="4 4"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    tick={{ fill: "#64748b" }}
                  />

                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    fontSize={12}
                    width={48}
                    tick={{ fill: "#64748b" }}
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
                    cursor={{ fill: "#f8fafc" }}
                    contentStyle={{
                      borderRadius: "16px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 10px 30px rgba(15, 23, 42, 0.08)",
                    }}
                    formatter={(
                      value,
                      name
                    ) => [
                      lek(Number(value)),
                      name === "arketime"
                        ? "Arkëtime"
                        : "Shpenzime",
                    ]}
                  />

                  <Legend
                    iconType="circle"
                    wrapperStyle={{
                      paddingTop: "16px",
                      fontSize: "12px",
                    }}
                    formatter={(value) =>
                      value === "arketime"
                        ? "Arkëtime"
                        : "Shpenzime"
                    }
                  />

                  <Bar
                    dataKey="arketime"
                    fill="#10b981"
                    radius={[7, 7, 0, 0]}
                    maxBarSize={34}
                  />

                  <Bar
                    dataKey="shpenzime"
                    fill="#f43f5e"
                    radius={[7, 7, 0, 0]}
                    maxBarSize={34}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[24px] border border-rose-100 bg-gradient-to-br from-rose-50/40 to-white p-5 shadow-sm">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Shpenzimet sipas kategorisë
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Ndarja e shpenzimeve të regjistruara.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {data?.expenseCategories.length ===
                0 ? (
                  <div className="rounded-[18px] border border-dashed border-rose-200 bg-rose-50/40 p-5 text-center text-sm text-slate-500">
                    Nuk ka shpenzime të regjistruara.
                  </div>
                ) : (
                  data?.expenseCategories.map(
                    (item) => (
                      <div
                        key={item.category}
                        className="flex items-center justify-between gap-4 rounded-[18px] border border-rose-100 bg-white/80 p-4 transition hover:border-rose-200 hover:shadow-sm"
                      >
                        <div>
                          <p className="font-bold text-slate-950">
                            {KATEGORITE[
                              item.category
                            ] ?? "Të tjera"}
                          </p>

                          <p className="mt-1 text-xs text-slate-500">
                            {item.count}{" "}
                            {item.count === 1
                              ? "regjistrim"
                              : "regjistrime"}
                          </p>
                        </div>

                        <p className="font-bold text-red-600">
                          {lek(
                            item.totalLek
                          )}
                        </p>
                      </div>
                    )
                  )
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-emerald-100 bg-gradient-to-br from-emerald-50/40 to-white p-5 shadow-sm">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Arkëtimet e fundit
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Pagesat më të fundit të regjistruara.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {data?.recentPayments.length ===
                0 ? (
                  <div className="rounded-[18px] border border-dashed border-emerald-200 bg-emerald-50/40 p-5 text-center text-sm text-slate-500">
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
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-[24px] border border-amber-100 bg-gradient-to-br from-amber-50/40 to-white p-5 shadow-sm">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Detyrimet e hapura
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Sportistët me shuma të papaguara.
                </p>
              </div>

              <div className="mt-5 space-y-3">
                {data?.debts.length ===
                0 ? (
                  <div className="rounded-[18px] border border-dashed border-amber-200 bg-amber-50/40 p-5 text-center text-sm text-slate-500">
                    Nuk ka detyrime të hapura.
                  </div>
                ) : (
                  data?.debts.map(
                    (debt) => (
                      <div
                        key={debt.id}
                        className="rounded-[18px] border border-amber-100 bg-white/80 p-4 transition hover:border-amber-200 hover:shadow-sm"
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

            <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50/40 to-white p-5 shadow-sm">
              <div>
                <h2 className="text-base font-black text-slate-950">
                  Përmbledhje e regjistrimeve
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Numri i lëvizjeve financiare të regjistruara.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryBox
                  icon={
                    <ReceiptText className="h-5 w-5" />
                  }
                  label="Pagesa"
                  tone="emerald"
                  value={String(
                    data?.summary.paymentCount ?? 0
                  )}
                />

                <SummaryBox
                  icon={
                    <TrendingDown className="h-5 w-5" />
                  }
                  label="Shpenzime"
                  tone="rose"
                  value={String(
                    data?.summary.expenseCount ?? 0
                  )}
                />

                <SummaryBox
                  icon={
                    <WalletCards className="h-5 w-5" />
                  }
                  label="Detyrime gjithsej"
                  tone="amber"
                  value={lek(
                    data?.summary.totalCharges ?? 0
                  )}
                />

                <SummaryBox
                  icon={
                    <TrendingUp className="h-5 w-5" />
                  }
                  label="Fitimi neto"
                  tone={(data?.summary.netProfit ?? 0) >= 0 ? "emerald" : "rose"}
                  value={lek(
                    data?.summary.netProfit ?? 0
                  )}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function PeriodStatCard({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "emerald" | "rose" | "sky" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/70",
    rose: "border-rose-100 bg-rose-50/70",
    sky: "border-sky-100 bg-sky-50/70",
    violet: "border-violet-100 bg-violet-50/70",
  };

  return (
    <div className={`rounded-[18px] border p-4 ${tones[tone]}`}>
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-lg font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  tone,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
  tone: "emerald" | "rose" | "amber" | "violet";
}) {
  const tones = {
    emerald: {
      card: "border-emerald-100 bg-emerald-50/60",
      icon: "bg-emerald-100 text-emerald-700",
    },
    rose: {
      card: "border-rose-100 bg-rose-50/60",
      icon: "bg-rose-100 text-rose-700",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/60",
      icon: "bg-amber-100 text-amber-700",
    },
    violet: {
      card: "border-violet-100 bg-violet-50/60",
      icon: "bg-violet-100 text-violet-700",
    },
  };

  return (
    <div className={`rounded-[22px] border p-4 shadow-sm ${tones[tone].card}`}>
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-semibold text-slate-600">
          {title}
        </p>

        <div className={`rounded-xl p-2 ${tones[tone].icon}`}>
          {icon}
        </div>
      </div>

      <p className="mt-3 text-2xl font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function MiniSummaryCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "emerald" | "rose" | "violet";
}) {
  const tones = {
    emerald: "border-emerald-100 bg-emerald-50/35",
    rose: "border-rose-100 bg-rose-50/35",
    violet: "border-violet-100 bg-violet-50/35",
  };

  return (
    <div className={`rounded-[20px] border p-4 shadow-sm ${tones[tone]}`}>
      <p className="text-xs font-semibold text-slate-500">
        {title}
      </p>

      <p className="mt-2 text-lg font-black text-slate-950">
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
    <div className="rounded-[14px] border border-slate-100 bg-slate-50/80 px-3 py-2.5">
      <p className="text-[11px] font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-1 text-sm font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}

function SummaryBox({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone: "emerald" | "rose" | "amber" | "violet";
}) {
  const tones = {
    emerald: {
      card: "border-emerald-100 bg-emerald-50/60",
      icon: "bg-emerald-100 text-emerald-700",
    },
    rose: {
      card: "border-rose-100 bg-rose-50/60",
      icon: "bg-rose-100 text-rose-700",
    },
    amber: {
      card: "border-amber-100 bg-amber-50/60",
      icon: "bg-amber-100 text-amber-700",
    },
    violet: {
      card: "border-violet-100 bg-violet-50/60",
      icon: "bg-violet-100 text-violet-700",
    },
  };

  return (
    <div className={`rounded-[18px] border p-4 ${tones[tone].card}`}>
      <div className="flex items-center gap-2.5">
        <div className={`rounded-xl p-2 ${tones[tone].icon}`}>
          {icon}
        </div>

        <span className="text-xs font-semibold text-slate-600">
          {label}
        </span>
      </div>

      <p className="mt-3 font-black text-slate-950">
        {value}
      </p>
    </div>
  );
}
