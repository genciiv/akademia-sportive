"use client";

import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  Download,
  FilterX,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

type Payment = {
  id: string;
  months: number;
  monthlyPrice: string;
  totalAmount: string;
  currency: string;
  method: string;
  paidAt: string;
  periodStart: string;
  periodEnd: string;
  note: string | null;

  academy: {
    id: string;
    name: string;
    city: string | null;
    status: string;

    owner: {
      name: string | null;
      email: string;
    };
  };

  plan: {
    code: string;
    name: string;
  };

  recordedBy: {
    name: string;
    email: string;
  } | null;
};

export function PaymentsClient({
  initialPayments,
}: {
  initialPayments: Payment[];
}) {
  const [query, setQuery] =
    useState("");

  const [planFilter, setPlanFilter] =
    useState("ALL");

  const [
    methodFilter,
    setMethodFilter,
  ] = useState("ALL");

  const [
    academyStatusFilter,
    setAcademyStatusFilter,
  ] = useState("ALL");

  const [fromDate, setFromDate] =
    useState("");

  const [toDate, setToDate] =
    useState("");

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialPayments[0]?.id ?? null
    );

  const plans = useMemo(
    () =>
      Array.from(
        new Map(
          initialPayments.map(
            (payment) => [
              payment.plan.code,
              payment.plan.name,
            ]
          )
        ).entries()
      ),
    [initialPayments]
  );

  const methods = useMemo(
    () =>
      Array.from(
        new Set(
          initialPayments.map(
            (payment) =>
              payment.method
          )
        )
      ).sort(),
    [initialPayments]
  );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    const from =
      fromDate
        ? new Date(
            `${fromDate}T00:00:00`
          )
        : null;

    const to =
      toDate
        ? new Date(
            `${toDate}T23:59:59.999`
          )
        : null;

    return initialPayments.filter(
      (payment) => {
        if (
          value &&
          ![
            payment.academy.name,
            payment.academy.city ?? "",
            payment.academy.owner.name ?? "",
            payment.academy.owner.email,
            payment.plan.name,
            payment.plan.code,
            payment.method,
            payment.recordedBy?.name ?? "",
            payment.recordedBy?.email ?? "",
          ].some((field) =>
            field
              .toLowerCase()
              .includes(value)
          )
        ) {
          return false;
        }

        if (
          planFilter !== "ALL" &&
          payment.plan.code !==
            planFilter
        ) {
          return false;
        }

        if (
          methodFilter !== "ALL" &&
          payment.method !==
            methodFilter
        ) {
          return false;
        }

        if (
          academyStatusFilter !==
            "ALL" &&
          payment.academy.status !==
            academyStatusFilter
        ) {
          return false;
        }

        const paidAt =
          new Date(payment.paidAt);

        if (
          from &&
          paidAt < from
        ) {
          return false;
        }

        if (
          to &&
          paidAt > to
        ) {
          return false;
        }

        return true;
      }
    );
  }, [
    initialPayments,
    query,
    planFilter,
    methodFilter,
    academyStatusFilter,
    fromDate,
    toDate,
  ]);

  const selected =
    visible.find(
      (payment) =>
        payment.id === selectedId
    ) ??
    visible[0] ??
    null;

  const filteredRevenue =
    visible.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.totalAmount
        ),
      0
    );

  const academyCount =
    new Set(
      visible.map(
        (payment) =>
          payment.academy.id
      )
    ).size;

  const averagePayment =
    visible.length > 0
      ? filteredRevenue /
        visible.length
      : 0;

  const currency =
    visible[0]?.currency ??
    initialPayments[0]?.currency ??
    "ALL";

  const hasFilters =
    query.trim() !== "" ||
    planFilter !== "ALL" ||
    methodFilter !== "ALL" ||
    academyStatusFilter !== "ALL" ||
    fromDate !== "" ||
    toDate !== "";

  function clearFilters() {
    setQuery("");
    setPlanFilter("ALL");
    setMethodFilter("ALL");
    setAcademyStatusFilter("ALL");
    setFromDate("");
    setToDate("");
  }

  function exportCsv() {
    if (visible.length === 0) {
      return;
    }

    const rows = [
      [
        "Akademia",
        "Statusi akademise",
        "Pronari",
        "Email pronari",
        "Plani",
        "Metoda",
        "Muaj",
        "Cmimi mujor",
        "Shuma",
        "Monedha",
        "Paguar me",
        "Periudha nga",
        "Periudha deri",
        "Regjistruar nga",
        "Shenim",
      ],

      ...visible.map(
        (payment) => [
          payment.academy.name,
          academyStatusLabel(
            payment.academy.status
          ),
          payment.academy.owner.name ??
            "",
          payment.academy.owner.email,
          payment.plan.name,
          payment.method,
          String(payment.months),
          payment.monthlyPrice,
          payment.totalAmount,
          payment.currency,
          formatDateTime(
            payment.paidAt
          ),
          formatDate(
            payment.periodStart
          ),
          formatDate(
            payment.periodEnd
          ),
          payment.recordedBy?.name ??
            payment.recordedBy?.email ??
            "Sistem",
          payment.note ?? "",
        ]
      ),
    ];

    const csv = rows
      .map((row) =>
        row
          .map(csvCell)
          .join(",")
      )
      .join("\r\n");

    const blob =
      new Blob(
        [
          "\uFEFF",
          csv,
        ],
        {
          type:
            "text/csv;charset=utf-8",
        }
      );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement("a");

    link.href = url;
    link.download =
      `pagesat-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(
      link
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <div className="mb-7 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-blue-50/40 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-blue-700">
              <ReceiptText size={13} />
              Financa e platformës
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              Pagesat
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Monitoro historikun financiar, pagesat e abonimeve dhe të ardhurat e platformës në një pamje të vetme.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
              <ShieldCheck size={15} />
              Historik i pandryshueshëm
            </div>

            <button
              type="button"
              onClick={exportCsv}
              disabled={visible.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Download size={16} />
              Eksporto CSV
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Pagesa"
          value={String(
            visible.length
          )}
          icon={
            <ReceiptText size={18} />
          }
        />

        <Stat
          title="Të ardhura"
          value={formatMoney(
            filteredRevenue,
            currency
          )}
          icon={
            <CircleDollarSign
              size={18}
            />
          }
        />

        <Stat
          title="Akademi paguese"
          value={String(
            academyCount
          )}
          icon={
            <Building2 size={18} />
          }
        />

        <Stat
          title="Pagesa mesatare"
          value={formatMoney(
            averagePayment,
            currency
          )}
          icon={
            <CreditCard size={18} />
          }
        />
      </div>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="grid gap-3 xl:grid-cols-[minmax(280px,1.5fr)_repeat(3,minmax(155px,.7fr))]">
          <div className="relative">
            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value
                )
              }
              placeholder="Kërko akademi, pronar, plan..."
              className="w-full rounded-2xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
            />
          </div>

          <select
            value={planFilter}
            onChange={(event) =>
              setPlanFilter(
                event.target.value
              )
            }
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">
              Të gjitha planet
            </option>

            {plans.map(
              ([code, name]) => (
                <option
                  key={code}
                  value={code}
                >
                  {name}
                </option>
              )
            )}
          </select>

          <select
            value={methodFilter}
            onChange={(event) =>
              setMethodFilter(
                event.target.value
              )
            }
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">
              Të gjitha metodat
            </option>

            {methods.map(
              (method) => (
                <option
                  key={method}
                  value={method}
                >
                  {method}
                </option>
              )
            )}
          </select>

          <select
            value={
              academyStatusFilter
            }
            onChange={(event) =>
              setAcademyStatusFilter(
                event.target.value
              )
            }
            className="rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2.5 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
          >
            <option value="ALL">
              Të gjitha akademitë
            </option>
            <option value="ACTIVE">
              Akademi aktive
            </option>
            <option value="TRIAL">
              Në trial
            </option>
            <option value="SUSPENDED">
              Të çaktivizuara
            </option>
            <option value="CANCELLED">
              Të anuluara
            </option>
          </select>
        </div>

        <div className="mt-3 flex flex-col gap-3 border-t border-slate-100 pt-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row">
            <label className="text-xs font-semibold text-slate-500">
              Nga data

              <input
                type="date"
                value={fromDate}
                onChange={(event) =>
                  setFromDate(
                    event.target.value
                  )
                }
                className="mt-1 block rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            <label className="text-xs font-semibold text-slate-500">
              Deri më

              <input
                type="date"
                value={toDate}
                onChange={(event) =>
                  setToDate(
                    event.target.value
                  )
                }
                className="mt-1 block rounded-2xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>
          </div>

          {hasFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
            >
              <FilterX size={16} />
              Pastro filtrat
            </button>
          ) : null}
        </div>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.88fr_1.12fr]">
        <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-100 bg-slate-50/50 px-5 py-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-slate-950">
                  Historiku i pagesave
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  {visible.length} rezultate
                </p>
              </div>

              {hasFilters ? (
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                  FILTRUAR
                </span>
              ) : null}
            </div>
          </div>

          {visible.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center bg-slate-50/30 p-8 text-center">
              <div>
                <ReceiptText
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nuk u gjetën pagesa.
                </p>

                <p className="mt-1 text-xs text-slate-400">
                  Ndrysho ose pastro filtrat.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              {visible.map(
                (payment) => (
                  <button
                    key={payment.id}
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        payment.id
                      )
                    }
                    className={[
                      "block w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0",
                      selected?.id ===
                      payment.id
                        ? "bg-gradient-to-r from-blue-50 to-violet-50/40"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {
                              payment
                                .academy
                                .name
                            }
                          </p>

                          <AcademyStatusBadge
                            status={
                              payment
                                .academy
                                .status
                            }
                          />
                        </div>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            payment
                              .plan.name
                          }
                          {" · "}
                          {
                            payment.months
                          }{" "}
                          muaj
                          {" · "}
                          {
                            payment.method
                          }
                        </p>

                        <p className="mt-1 text-[11px] text-slate-400">
                          {formatDateTime(
                            payment.paidAt
                          )}
                        </p>
                      </div>

                      <p className="shrink-0 text-sm font-bold text-slate-950">
                        {formatMoney(
                          Number(
                            payment.totalAmount
                          ),
                          payment.currency
                        )}
                      </p>
                    </div>
                  </button>
                )
              )}
            </div>
          )}
        </section>

        <section className="min-w-0">
          {!selected ? (
            <div className="flex min-h-[420px] items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 text-center">
              <div>
                <ReceiptText
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Zgjidh një pagesë
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
              <div className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-violet-50/30 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                        E PAGUAR
                      </span>

                      <AcademyStatusBadge
                        status={
                          selected.academy
                            .status
                        }
                      />
                    </div>

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      {
                        selected.academy
                          .name
                      }
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Paguar më{" "}
                      {formatDateTime(
                        selected.paidAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Shuma
                    </p>

                    <p className="mt-1 text-lg font-bold text-slate-950">
                      {formatMoney(
                        Number(
                          selected.totalAmount
                        ),
                        selected.currency
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {selected.academy.status ===
              "SUSPENDED" ? (
                <div className="border-b border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-5 py-4 text-sm leading-6 text-amber-900 sm:px-6">
                  <span className="font-bold">
                    Akademia është e
                    çaktivizuar.
                  </span>{" "}
                  Kjo pagesë mbetet pjesë e
                  historikut financiar dhe
                  periudha e paguar nuk
                  ndryshohet.
                </div>
              ) : null}

              <div className="grid gap-6 p-5 sm:grid-cols-2 sm:p-6">
                <Info
                  icon={
                    <Building2
                      size={15}
                    />
                  }
                  label="Akademia"
                  value={
                    selected.academy
                      .name
                  }
                />

                <Info
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  label="Pronari"
                  value={
                    selected.academy
                      .owner.name ??
                    selected.academy
                      .owner.email
                  }
                />

                <Info
                  icon={
                    <CreditCard
                      size={15}
                    />
                  }
                  label="Plani"
                  value={
                    selected.plan.name
                  }
                />

                <Info
                  icon={
                    <ReceiptText
                      size={15}
                    />
                  }
                  label="Metoda"
                  value={
                    selected.method
                  }
                />

                <Info
                  icon={
                    <CalendarDays
                      size={15}
                    />
                  }
                  label="Kohëzgjatja"
                  value={`${selected.months} muaj`}
                />

                <Info
                  icon={
                    <CircleDollarSign
                      size={15}
                    />
                  }
                  label="Çmimi mujor"
                  value={formatMoney(
                    Number(
                      selected.monthlyPrice
                    ),
                    selected.currency
                  )}
                />
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Periudha e paguar
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Info
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Nga"
                    value={formatDate(
                      selected.periodStart
                    )}
                  />

                  <Info
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Deri"
                    value={formatDate(
                      selected.periodEnd
                    )}
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <Info
                  icon={
                    <UserRound
                      size={15}
                    />
                  }
                  label="Regjistruar nga"
                  value={
                    selected.recordedBy
                      ?.name ??
                    selected.recordedBy
                      ?.email ??
                    "Sistem"
                  }
                />

                {selected.note ? (
                  <div className="mt-5 rounded-xl bg-slate-50 p-4">
                    <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Shënim
                    </p>

                    <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700">
                      {selected.note}
                    </p>
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function Stat({
  title,
  value,
  icon,
}: {
  title: string;
  value: string;
  icon: React.ReactNode;
}) {
  const tones: Record<
    string,
    string
  > = {
    Pagesa:
      "border-violet-200 bg-gradient-to-br from-violet-100 via-violet-50/70 to-white",

    "Të ardhura":
      "border-emerald-200 bg-gradient-to-br from-emerald-100 via-emerald-50/70 to-white",

    "Akademi paguese":
      "border-blue-200 bg-gradient-to-br from-blue-100 via-blue-50/70 to-white",

    "Pagesa mesatare":
      "border-amber-200 bg-gradient-to-br from-amber-100 via-amber-50/70 to-white",
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
    </div>
  );
}

function Info({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">
        <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
          {icon}
        </span>

        {label}
      </div>

      <p className="mt-3 break-words text-sm font-bold text-slate-900">
        {value}
      </p>
    </div>
  );
}
function AcademyStatusBadge({
  status,
}: {
  status: string;
}) {
  const tones: Record<
    string,
    string
  > = {
    ACTIVE:
      "bg-emerald-50 text-emerald-700",
    TRIAL:
      "bg-blue-50 text-blue-700",
    SUSPENDED:
      "bg-amber-50 text-amber-700",
    CANCELLED:
      "bg-slate-100 text-slate-600",
  };

  return (
    <span
      className={[
        "rounded-full px-2 py-0.5 text-[9px] font-bold",
        tones[status] ??
          "bg-slate-100 text-slate-600",
      ].join(" ")}
    >
      {academyStatusLabel(
        status
      )}
    </span>
  );
}

function academyStatusLabel(
  status: string
) {
  const labels: Record<
    string,
    string
  > = {
    ACTIVE: "AKTIVE",
    TRIAL: "TRIAL",
    SUSPENDED: "ÇAKTIVIZUAR",
    CANCELLED: "ANULUAR",
  };

  return labels[status] ?? status;
}

function csvCell(
  value: string
) {
  return `"${value.replace(
    /"/g,
    '""'
  )}"`;
}

const MONTHS_SQ = [
  "jan",
  "shk",
  "mar",
  "pri",
  "maj",
  "qer",
  "kor",
  "gus",
  "sht",
  "tet",
  "nën",
  "dhj",
];

function dateParts(
  value: string
) {
  const parts =
    new Intl.DateTimeFormat(
      "en-GB",
      {
        timeZone: "Europe/Tirane",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hourCycle: "h23",
      }
    ).formatToParts(
      new Date(value)
    );

  const getPart = (
    type:
      | "day"
      | "month"
      | "year"
      | "hour"
      | "minute"
  ) =>
    parts.find(
      (part) =>
        part.type === type
    )?.value ?? "";

  return {
    day: getPart("day"),
    month: Number(
      getPart("month")
    ),
    year: getPart("year"),
    hour: getPart("hour"),
    minute: getPart("minute"),
  };
}

function formatDateTime(
  value: string
) {
  const p = dateParts(value);

  return `${p.day} ${
    MONTHS_SQ[p.month - 1] ?? ""
  } ${p.year}, ${p.hour}:${p.minute}`;
}

function formatDate(
  value: string
) {
  const p = dateParts(value);

  return `${p.day} ${
    MONTHS_SQ[p.month - 1] ?? ""
  } ${p.year}`;
}

function formatMoney(
  value: number,
  currency: string
) {
  if (!Number.isFinite(value)) {
    return `0 ${currency}`;
  }

  const rounded =
    Math.round(value * 100) / 100;

  const formatted =
    rounded.toLocaleString(
      "en-US",
      {
        minimumFractionDigits:
          rounded % 1 === 0
            ? 0
            : 2,
        maximumFractionDigits: 2,
      }
    );

  return `${formatted} ${currency}`;
}