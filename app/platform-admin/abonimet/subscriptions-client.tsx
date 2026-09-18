"use client";

import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Search,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

type Status =
  | "TRIALING"
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "EXPIRED"
  | "CANCELLED";

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

  recordedBy: {
    name: string;
    email: string;
  } | null;
};

type Subscription = {
  id: string;
  status: Status;

  trialStartsAt: string | null;
  trialEndsAt: string | null;

  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;

  graceEndsAt: string | null;
  cancelledAt: string | null;

  createdAt: string;

  academy: {
    id: string;
    name: string;
    status: string;
    city: string | null;

    owner: {
      name: string | null;
      email: string;
    };
  };

  plan: {
    code: string;
    name: string;
    monthlyPrice: string;
    currency: string;
  };

  payments: Payment[];

  _count: {
    payments: number;
  };
};

type Filter =
  | "ALL"
  | Status;

const FILTERS: Array<{
  key: Filter;
  label: string;
}> = [
  {
    key: "ALL",
    label: "Të gjitha",
  },
  {
    key: "TRIALING",
    label: "Trial",
  },
  {
    key: "ACTIVE",
    label: "Aktive",
  },
  {
    key: "GRACE_PERIOD",
    label: "Grace",
  },
  {
    key: "EXPIRED",
    label: "Skaduar",
  },
  {
    key: "CANCELLED",
    label: "Anuluar",
  },
];

export function SubscriptionsClient({
  initialSubscriptions,
}: {
  initialSubscriptions: Subscription[];
}) {
  const [query, setQuery] =
    useState("");

  const [filter, setFilter] =
    useState<Filter>("ALL");

  const [selectedId, setSelectedId] =
    useState<string | null>(
      initialSubscriptions[0]?.id ??
        null
    );

  const counts = useMemo(
    () => ({
      all:
        initialSubscriptions.length,

      trialing:
        initialSubscriptions.filter(
          (subscription) =>
            subscription.status ===
            "TRIALING"
        ).length,

      active:
        initialSubscriptions.filter(
          (subscription) =>
            subscription.status ===
            "ACTIVE"
        ).length,

      attention:
        initialSubscriptions.filter(
          (subscription) =>
            subscription.status ===
              "GRACE_PERIOD" ||
            subscription.status ===
              "EXPIRED"
        ).length,
    }),
    [initialSubscriptions]
  );

  const visible = useMemo(() => {
    const value =
      query.trim().toLowerCase();

    return initialSubscriptions.filter(
      (subscription) => {
        if (
          filter !== "ALL" &&
          subscription.status !== filter
        ) {
          return false;
        }

        if (!value) {
          return true;
        }

        return [
          subscription.academy.name,
          subscription.academy.city ??
            "",
          subscription.academy.owner
            .name ?? "",
          subscription.academy.owner
            .email,
          subscription.plan.name,
          subscription.plan.code,
          subscription.status,
        ].some((field) =>
          field
            .toLowerCase()
            .includes(value)
        );
      }
    );
  }, [
    initialSubscriptions,
    query,
    filter,
  ]);

  const selected =
    visible.find(
      (subscription) =>
        subscription.id ===
        selectedId
    ) ??
    visible[0] ??
    null;

  function countForFilter(
    key: Filter
  ) {
    if (key === "ALL") {
      return initialSubscriptions.length;
    }

    return initialSubscriptions.filter(
      (subscription) =>
        subscription.status === key
    ).length;
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          Abonimet
        </h1>

        <p className="mt-1.5 text-sm text-slate-500">
          Monitoro trial-et, planet dhe
          ciklin e abonimeve të akademive.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          title="Abonime totale"
          value={counts.all}
          icon={
            <CreditCard size={18} />
          }
        />

        <Stat
          title="Në trial"
          value={counts.trialing}
          icon={
            <Clock3 size={18} />
          }
        />

        <Stat
          title="Aktive"
          value={counts.active}
          icon={
            <ShieldCheck size={18} />
          }
        />

        <Stat
          title="Kërkojnë vëmendje"
          value={counts.attention}
          icon={
            <CalendarDays size={18} />
          }
        />
      </div>

      <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
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
            placeholder="Kërko akademi, pronar ose plan..."
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <FilterButton
              key={item.key}
              active={
                filter === item.key
              }
              onClick={() =>
                setFilter(item.key)
              }
            >
              {item.label}{" "}
              {countForFilter(
                item.key
              )}
            </FilterButton>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <p className="text-sm font-bold text-slate-950">
              Lista e abonimeve
            </p>

            <p className="mt-1 text-xs text-slate-400">
              {visible.length} rezultate
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <CreditCard
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nuk u gjet asnjë abonim.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[720px] overflow-y-auto">
              {visible.map(
                (subscription) => (
                  <button
                    key={
                      subscription.id
                    }
                    type="button"
                    onClick={() =>
                      setSelectedId(
                        subscription.id
                      )
                    }
                    className={[
                      "block w-full border-b border-slate-100 px-5 py-4 text-left transition last:border-b-0",
                      selected?.id ===
                      subscription.id
                        ? "bg-blue-50/70"
                        : "hover:bg-slate-50",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {
                            subscription
                              .academy.name
                          }
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {
                            subscription
                              .plan.name
                          }
                          {" · "}
                          {formatMoney(
                            subscription
                              .plan
                              .monthlyPrice,
                            subscription
                              .plan
                              .currency
                          )}
                          /muaj
                        </p>

                        <p className="mt-1 truncate text-[11px] text-slate-400">
                          {
                            subscription
                              .academy
                              .owner.name
                              ??
                            subscription
                              .academy
                              .owner.email
                          }
                        </p>
                      </div>

                      <SubscriptionBadge
                        status={
                          subscription.status
                        }
                      />
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
                <CreditCard
                  size={30}
                  className="mx-auto text-slate-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-700">
                  Zgjidh një abonim
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="border-b border-slate-100 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <SubscriptionBadge
                      status={
                        selected.status
                      }
                    />

                    <h2 className="mt-3 text-xl font-bold text-slate-950">
                      {
                        selected.academy
                          .name
                      }
                    </h2>

                    <p className="mt-1 text-xs text-slate-400">
                      Abonimi krijuar më{" "}
                      {formatDateTime(
                        selected.createdAt
                      )}
                    </p>
                  </div>

                  <div className="rounded-xl bg-slate-50 px-4 py-3">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Plani
                    </p>

                    <p className="mt-1 text-sm font-bold text-slate-950">
                      {
                        selected.plan
                          .name
                      }
                    </p>

                    <p className="mt-1 text-[11px] text-slate-500">
                      {formatMoney(
                        selected.plan
                          .monthlyPrice,
                        selected.plan
                          .currency
                      )}
                      /muaj
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
                  label="Kodi i planit"
                  value={
                    selected.plan.code
                  }
                />

                <Info
                  icon={
                    <CircleDollarSign
                      size={15}
                    />
                  }
                  label="Çmimi mujor"
                  value={formatMoney(
                    selected.plan
                      .monthlyPrice,
                    selected.plan
                      .currency
                  )}
                />
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                  Cikli i abonimit
                </p>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <Info
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Fillimi i trial"
                    value={dateOrDash(
                      selected.trialStartsAt
                    )}
                  />

                  <Info
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Fundi i trial"
                    value={dateOrDash(
                      selected.trialEndsAt
                    )}
                  />

                  <Info
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Fillimi i periudhës"
                    value={dateOrDash(
                      selected.currentPeriodStart
                    )}
                  />

                  <Info
                    icon={
                      <CalendarDays
                        size={15}
                      />
                    }
                    label="Fundi i periudhës"
                    value={dateOrDash(
                      selected.currentPeriodEnd
                    )}
                  />

                  {selected.graceEndsAt ? (
                    <Info
                      icon={
                        <Clock3
                          size={15}
                        />
                      }
                      label="Grace përfundon"
                      value={dateOrDash(
                        selected.graceEndsAt
                      )}
                    />
                  ) : null}

                  {selected.cancelledAt ? (
                    <Info
                      icon={
                        <Clock3
                          size={15}
                        />
                      }
                      label="Anuluar më"
                      value={dateOrDash(
                        selected.cancelledAt
                      )}
                    />
                  ) : null}
                </div>
              </div>

              <div className="border-t border-slate-100 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
                      Pagesat e abonimit
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Deri në 8 pagesat e fundit.
                    </p>
                  </div>

                  <span className="rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                    {
                      selected._count
                        .payments
                    }
                  </span>
                </div>

                {selected.payments
                  .length === 0 ? (
                  <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                    Nuk ka ende pagesa të
                    regjistruara për këtë
                    abonim.
                  </div>
                ) : (
                  <div className="mt-4 space-y-3">
                    {selected.payments.map(
                      (payment) => (
                        <div
                          key={payment.id}
                          className="rounded-xl border border-slate-200 p-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-bold text-slate-950">
                                {formatMoney(
                                  payment.totalAmount,
                                  payment.currency
                                )}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {
                                  payment.months
                                }{" "}
                                muaj ·{" "}
                                {
                                  payment.method
                                }
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                Paguar më{" "}
                                {formatDateTime(
                                  payment.paidAt
                                )}
                              </p>
                            </div>

                            <div className="text-left sm:text-right">
                              <p className="text-[11px] font-semibold text-slate-600">
                                Periudha
                              </p>

                              <p className="mt-1 text-[11px] text-slate-400">
                                {formatDate(
                                  payment.periodStart
                                )}
                                {" – "}
                                {formatDate(
                                  payment.periodEnd
                                )}
                              </p>
                            </div>
                          </div>

                          {payment.note ? (
                            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
                              {payment.note}
                            </p>
                          ) : null}
                        </div>
                      )
                    )}
                  </div>
                )}
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
  value: number;
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

      <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">
        {value}
      </p>
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold transition",
        active
          ? "bg-slate-950 text-white"
          : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SubscriptionBadge({
  status,
}: {
  status: Status;
}) {
  const values: Record<
    Status,
    {
      label: string;
      style: string;
    }
  > = {
    TRIALING: {
      label: "Trial",
      style:
        "bg-violet-50 text-violet-700",
    },

    ACTIVE: {
      label: "Aktiv",
      style:
        "bg-emerald-50 text-emerald-700",
    },

    GRACE_PERIOD: {
      label: "Grace period",
      style:
        "bg-amber-50 text-amber-700",
    },

    EXPIRED: {
      label: "Skaduar",
      style:
        "bg-red-50 text-red-700",
    },

    CANCELLED: {
      label: "Anuluar",
      style:
        "bg-slate-100 text-slate-600",
    },
  };

  const value = values[status];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold ${value.style}`}
    >
      {value.label}
    </span>
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
    month:
      Number(
        getPart("month")
      ),
    year: getPart("year"),
    hour: getPart("hour"),
    minute:
      getPart("minute"),
  };
}

function formatDateTime(
  value: string
) {
  const parts =
    dateParts(value);

  return `${parts.day} ${
    MONTHS_SQ[
      parts.month - 1
    ] ?? ""
  } ${parts.year}, ${parts.hour}:${parts.minute}`;
}

function formatDate(
  value: string
) {
  const parts =
    dateParts(value);

  return `${parts.day} ${
    MONTHS_SQ[
      parts.month - 1
    ] ?? ""
  } ${parts.year}`;
}

function dateOrDash(
  value: string | null
) {
  return value
    ? formatDateTime(value)
    : "—";
}

function formatMoney(
  value: string,
  currency: string
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return `${value} ${currency}`;
  }

  const fixed =
    number % 1 === 0
      ? String(
          Math.trunc(number)
        )
      : number.toFixed(2);

  const [
    integer,
    decimals,
  ] = fixed.split(".");

  const formatted =
    integer.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      ","
    );

  return `${formatted}${
    decimals
      ? `.${decimals}`
      : ""
  } ${currency}`;
}