"use client";

import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  CreditCard,
  ReceiptText,
  Search,
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

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialPayments[0]?.id ?? null
    );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    if (!value) {
      return initialPayments;
    }

    return initialPayments.filter(
      (payment) =>
        [
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
    );
  }, [initialPayments, query]);

  const selected =
    visible.find(
      (payment) =>
        payment.id === selectedId
    ) ??
    visible[0] ??
    null;

  const totalRevenue =
    initialPayments.reduce(
      (sum, payment) =>
        sum +
        Number(
          payment.totalAmount
        ),
      0
    );

  const academyCount =
    new Set(
      initialPayments.map(
        (payment) =>
          payment.academy.id
      )
    ).size;

  const averagePayment =
    initialPayments.length > 0
      ? totalRevenue /
        initialPayments.length
      : 0;

  const currency =
    initialPayments[0]?.currency ??
    "ALL";

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Pagesat
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Monitoro pagesat e abonimeve dhe
          të ardhurat e platformës.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Pagesa totale"
          value={String(
            initialPayments.length
          )}
          icon={
            <ReceiptText size={18} />
          }
        />

        <Stat
          title="Të ardhura totale"
          value={formatMoney(
            totalRevenue,
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

      <div className="mt-5">
        <div className="relative w-full max-w-md">
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
            placeholder="Kërko akademi, pronar, plan ose regjistrues..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">
              Historiku i pagesave
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {visible.length} rezultate
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <ReceiptText
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nuk ka pagesa të
                  regjistruara.
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
                        ? "bg-blue-50/70"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {
                            payment
                              .academy.name
                          }
                        </p>

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
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700">
                      E PAGUAR
                    </span>

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

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
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
    <div>
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        {icon}
        {label}
      </div>

      <p className="mt-2 break-words text-sm font-semibold text-slate-900">
        {value}
      </p>
    </div>
  );
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