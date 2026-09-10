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
  Loader2,
  Medal,
  ShieldCheck,
  UsersRound,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

type ReportsResponse = {
  generatedAt: string;

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
};

function lek(value: number) {
  return `${new Intl.NumberFormat(
    "sq-AL"
  ).format(value)} Lek`;
}

export default function ReportsClient() {
  const [data, setData] =
    useState<ReportsResponse | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function ngarko() {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/reports",
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
  }, []);

  return (
    <AppShell>
      <PageHeader
        title="Raportet"
        description="Raporte operative dhe financiare të akademisë me të dhëna reale."
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
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
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

                <SummaryBox
                  label="Pagesa"
                  value={String(
                    data?.finance.paymentCount ??
                      0
                  )}
                />

                <SummaryBox
                  label="Shpenzime"
                  value={String(
                    data?.finance.expenseCount ??
                      0
                  )}
                />

                <SummaryBox
                  label="Detyrime gjithsej"
                  value={lek(
                    data?.finance.totalCharges ??
                      0
                  )}
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
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
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="rounded-xl bg-slate-100 p-2 text-slate-700">
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
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold text-slate-500">
        {label}
      </p>

      <p className="mt-2 font-bold text-slate-950">
        {value}
      </p>
    </div>
  );
}