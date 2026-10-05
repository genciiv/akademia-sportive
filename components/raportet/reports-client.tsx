"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  BarChart3,
  CircleDollarSign,
  Dumbbell,
  FileBarChart,
  Download,
  Loader2,
  Printer,
  Medal,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import {
  downloadReportsPdf,
  printReports,
} from "@/components/raportet/reports-export";


type ReportsResponse = {
  generatedAt: string;

  access: {
    sports: boolean;
    finance: boolean;
  };

  sports: {
    players: number;
    teams: number;
    coaches: number;
    trainingSessions: number;
    matches: number;
  };

  finance: {
    totalCollected: number;
    collectedThisMonth: number;
    totalExpenses: number;
    expensesThisMonth: number;
    netProfit: number;
    netProfitThisMonth: number;
    totalCharges: number;
    totalOutstanding: number;
    playersWithDebt: number;
    paymentCount: number;
    expenseCount: number;
  };

  periodReport: {
    from: string;
    to: string;

    sports: {
      trainingSessions: number;
      matches: number;
    };

    finance: {
      collectedLek: number;
      expensesLek: number;
      netLek: number;
      paymentCount: number;
      expenseCount: number;
    };
  } | null;
};

function lek(value: number) {
  return `${new Intl.NumberFormat(
    "sq-AL"
  ).format(value)} Lek`;
}

function isoDateLocal(date: Date) {
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
    from: isoDateLocal(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        1
      )
    ),

    to: isoDateLocal(
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      )
    ),
  };
}

function previousMonthRange() {
  const now = new Date();

  return {
    from: isoDateLocal(
      new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1
      )
    ),

    to: isoDateLocal(
      new Date(
        now.getFullYear(),
        now.getMonth(),
        0
      )
    ),
  };
}

function currentYearRange() {
  const now = new Date();

  return {
    from: isoDateLocal(
      new Date(
        now.getFullYear(),
        0,
        1
      )
    ),

    to: isoDateLocal(
      new Date(
        now.getFullYear(),
        11,
        31
      )
    ),
  };
}

export default function ReportsClient() {
  const [data, setData] =
    useState<ReportsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [pdfLoading, setPdfLoading] =
    useState(false);

  const initialRange =
    currentMonthRange();

  const [from, setFrom] =
    useState(initialRange.from);

  const [to, setTo] =
    useState(initialRange.to);

  const [appliedFrom, setAppliedFrom] =
    useState(initialRange.from);

  const [appliedTo, setAppliedTo] =
    useState(initialRange.to);

  useEffect(() => {
    async function ngarko() {
      setLoading(true);
      setError("");

      try {
        const params =
          new URLSearchParams({
            from: appliedFrom,
            to: appliedTo,
          });

        const response = await fetch(
          `/api/reports?${params.toString()}`,
          {
            cache: "no-store",
          }
        );

        const result =
          await response.json();

        if (!response.ok) {
          throw new Error(
            result.error ||
              "Raportet nuk u ngarkuan."
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

    ngarko();
  }, [appliedFrom, appliedTo]);

  const canViewSports =
    data?.access.sports ?? false;

  const canViewFinance =
    data?.access.finance ?? false;

  function aplikoPeriudhen() {
    setError("");

    if (!from || !to) {
      setError(
        "Vendos të dyja datat e raportit."
      );

      return;
    }

    if (from > to) {
      setError(
        "Data 'Nga' nuk mund të jetë pas datës 'Deri më'."
      );

      return;
    }

    setAppliedFrom(from);
    setAppliedTo(to);
  }

  function vendosPeriudhen(
    range: {
      from: string;
      to: string;
    }
  ) {
    setFrom(range.from);
    setTo(range.to);
    setAppliedFrom(range.from);
    setAppliedTo(range.to);
    setError("");
  }

  function printoRaportin() {
    if (!data) {
      return;
    }

    setError("");

    try {
      printReports(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Raporti nuk mund të printohej."
      );
    }
  }

  async function shkarkoRaportinPdf() {
    if (!data) {
      return;
    }

    setPdfLoading(true);
    setError("");

    try {
      await downloadReportsPdf(data);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "PDF-ja nuk mund të shkarkohej."
      );
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <AppShell>
      <section className="relative mb-5 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-indigo-50/70 to-sky-50 p-5 shadow-sm sm:p-6">
        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-violet-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-40 w-40 rounded-full bg-sky-200/30 blur-3xl" />

        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/80 text-violet-700 shadow-sm ring-1 ring-violet-100">
              <FileBarChart className="h-6 w-6" />
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-violet-600">
                Analizë dhe dokumentim
              </p>

              <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Raportet
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Përmbledhje operative dhe financiare me të dhëna reale të akademisë.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={printoRaportin}
              disabled={!data || loading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-violet-200 bg-white/80 px-4 text-sm font-bold text-violet-700 shadow-sm transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Printer className="h-4 w-4" />
              Printo
            </button>

            <button
              type="button"
              onClick={() => void shkarkoRaportinPdf()}
              disabled={!data || loading || pdfLoading}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
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
      </section>

      <section className="mb-5 rounded-[24px] border border-violet-100 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 sm:grid-cols-2">
            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Nga data
              </span>

              <input
                type="date"
                value={from}
                onChange={(event) =>
                  setFrom(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-bold uppercase tracking-wide text-slate-500">
                Deri më datë
              </span>

              <input
                type="date"
                value={to}
                onChange={(event) =>
                  setTo(event.target.value)
                }
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50/70 px-3 text-sm font-semibold text-slate-800 outline-none transition focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-100"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={aplikoPeriudhen}
            disabled={loading}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-violet-600 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Apliko
          </button>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() =>
              vendosPeriudhen(
                currentMonthRange()
              )
            }
            className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-2 text-xs font-bold text-violet-700 transition hover:bg-violet-100"
          >
            Ky muaj
          </button>

          <button
            type="button"
            onClick={() =>
              vendosPeriudhen(
                previousMonthRange()
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Muaji i kaluar
          </button>

          <button
            type="button"
            onClick={() =>
              vendosPeriudhen(
                currentYearRange()
              )
            }
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
          >
            Këtë vit
          </button>

          <div className="ml-auto flex items-center text-xs font-semibold text-slate-500">
            Periudha aktive:

            <span className="ml-1 font-bold text-slate-800">
              {appliedFrom} – {appliedTo}
            </span>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-violet-100 bg-white shadow-sm">
          <Loader2 className="h-7 w-7 animate-spin text-slate-500" />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {canViewSports && (
              <>
            <ReportCard
              title="Raporti i sportistëve"
              description="Numri aktual i sportistëve të regjistruar në akademi."
              value={String(
                data?.sports.players ?? 0
              )}
              note="sportistë"
              icon={
                <UsersRound className="h-5 w-5" />
              }
            />

            <ReportCard
              title="Raporti i ekipeve"
              description="Ekipet dhe grupet sportive të regjistruara."
              value={String(
                data?.sports.teams ?? 0
              )}
              note="ekipe"
              icon={
                <ShieldCheck className="h-5 w-5" />
              }
            />

            <ReportCard
              title="Raporti i trajnerëve"
              description="Trajnerët e regjistruar në akademi."
              value={String(
                data?.sports.coaches ?? 0
              )}
              note="trajnerë"
              icon={
                <Dumbbell className="h-5 w-5" />
              }
            />

            <ReportCard
              title="Raporti i seancave"
              description="Numri total i seancave stërvitore të regjistruara."
              value={String(
                data?.sports.trainingSessions ??
                  0
              )}
              note="seanca"
              icon={
                <BarChart3 className="h-5 w-5" />
              }
            />

            <ReportCard
              title="Raporti i ndeshjeve"
              description="Numri total i ndeshjeve të regjistruara."
              value={String(
                data?.sports.matches ?? 0
              )}
              note="ndeshje"
              icon={
                <Medal className="h-5 w-5" />
              }
            />
              </>
            )}

            {canViewFinance && (
            <ReportCard
              title="Raporti financiar"
              description="Arkëtimet reale të regjistruara në sistem."
              value={lek(
                data?.finance.totalCollected ??
                  0
              )}
              note="arkëtime"
              icon={
                <CircleDollarSign className="h-5 w-5" />
              }
            />
            )}
          </div>

          {data?.periodReport && (
            <section className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50/70 via-white to-sky-50/50 p-5 shadow-sm">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-violet-600">
                    Raporti i periudhës
                  </p>

                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    {data.periodReport.from} – {data.periodReport.to}
                  </h2>
                </div>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-violet-700 shadow-sm ring-1 ring-violet-100">
                  Interval i filtruar
                </span>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                {canViewSports && (
                  <>
                    <SummaryBox
                      label="Seanca në periudhë"
                      value={String(
                        data.periodReport.sports
                          .trainingSessions
                      )}
                    />

                    <SummaryBox
                      label="Ndeshje në periudhë"
                      value={String(
                        data.periodReport.sports
                          .matches
                      )}
                    />
                  </>
                )}

                {canViewFinance && (
                  <>
                    <SummaryBox
                      label="Arkëtime në periudhë"
                      value={lek(
                        data.periodReport.finance
                          .collectedLek
                      )}
                    />

                    <SummaryBox
                      label="Shpenzime në periudhë"
                      value={lek(
                        data.periodReport.finance
                          .expensesLek
                      )}
                    />

                    <SummaryBox
                      label="Rezultati neto"
                      value={lek(
                        data.periodReport.finance
                          .netLek
                      )}
                    />
                  </>
                )}
              </div>

              {canViewFinance && (
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <SummaryBox
                    label="Pagesa në periudhë"
                    value={String(
                      data.periodReport.finance
                        .paymentCount
                    )}
                  />

                  <SummaryBox
                    label="Shpenzime të regjistruara"
                    value={String(
                      data.periodReport.finance
                        .expenseCount
                    )}
                  />
                </div>
              )}
            </section>
          )}

          <div className="grid gap-5 xl:grid-cols-2">
            {canViewFinance && (
    <div className="rounded-[22px] border border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div>
                <h2 className="font-bold text-slate-950">
                  Përmbledhje financiare
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Gjendja financiare aktuale e akademisë.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryBox
                  label="Arkëtime gjithsej"
                  value={lek(
                    data?.finance.totalCollected ??
                      0
                  )}
                />

                <SummaryBox
                  label="Shpenzime gjithsej"
                  value={lek(
                    data?.finance.totalExpenses ??
                      0
                  )}
                />

                <SummaryBox
                  label="Fitimi neto"
                  value={lek(
                    data?.finance.netProfit ?? 0
                  )}
                />

                <SummaryBox
                  label="Për t'u arkëtuar"
                  value={lek(
                    data?.finance.totalOutstanding ??
                      0
                  )}
                />

                <SummaryBox
                  label="Arkëtime këtë muaj"
                  value={lek(
                    data?.finance
                      .collectedThisMonth ?? 0
                  )}
                />

                <SummaryBox
                  label="Shpenzime këtë muaj"
                  value={lek(
                    data?.finance
                      .expensesThisMonth ?? 0
                  )}
                />

                <SummaryBox
                  label="Fitimi neto këtë muaj"
                  value={lek(
                    data?.finance
                      .netProfitThisMonth ?? 0
                  )}
                />

                <SummaryBox
                  label="Sportistë me detyrim"
                  value={String(
                    data?.finance
                      .playersWithDebt ?? 0
                  )}
                />
              </div>
            </div>
            )}

            {canViewSports && (
    <div className="rounded-[22px] border border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
              <div>
                <h2 className="font-bold text-slate-950">
                  Përmbledhje operative
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Numrat kryesorë të aktivitetit të akademisë.
                </p>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <SummaryBox
                  label="Sportistë"
                  value={String(
                    data?.sports.players ?? 0
                  )}
                />

                <SummaryBox
                  label="Ekipe"
                  value={String(
                    data?.sports.teams ?? 0
                  )}
                />

                <SummaryBox
                  label="Trajnerë"
                  value={String(
                    data?.sports.coaches ?? 0
                  )}
                />

                <SummaryBox
                  label="Seanca stërvitore"
                  value={String(
                    data?.sports
                      .trainingSessions ?? 0
                  )}
                />

                <SummaryBox
                  label="Ndeshje"
                  value={String(
                    data?.sports.matches ?? 0
                  )}
                />
              </div>
            </div>
            )}
          </div>

    <div className="rounded-[22px] border border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
                <FileBarChart className="h-5 w-5" />
              </div>

              <div>
                <h2 className="font-bold text-slate-950">
                  Gjendja e raporteve
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Këto raporte përditësohen automatikisht nga të dhënat reale të sistemit.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}

function ReportCard({
  title,
  description,
  value,
  note,
  icon,
}: {
  title: string;
  description: string;
  value: string;
  note: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-[22px] border border-violet-100 bg-gradient-to-br from-white to-violet-50/40 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-xl bg-violet-100 p-2 text-violet-700">
          {icon}
        </div>

        <span className="text-xs font-semibold text-slate-400">
          Raport
        </span>
      </div>

      <h2 className="mt-4 font-bold text-slate-950">
        {title}
      </h2>

      <p className="mt-2 min-h-[40px] text-sm leading-5 text-slate-500">
        {description}
      </p>

      <div className="mt-5 border-t border-slate-100 pt-4">
        <p className="text-2xl font-bold text-slate-950">
          {value}
        </p>

        <p className="mt-1 text-xs font-semibold text-slate-500">
          {note}
        </p>
      </div>
    </div>
  );
}

function SummaryBox({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}
