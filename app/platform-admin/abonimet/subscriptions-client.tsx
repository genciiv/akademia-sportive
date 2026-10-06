"use client";

import {
  Building2,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
  WalletCards,
} from "lucide-react";
import {
  useMemo,
  useState,
} from "react";

import { PaymentRecorder } from "./payment-recorder";
import { PlanSwitcher } from "./plan-switcher";

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

  commercialTerms: {
    source: "GLOBAL_PLAN";
    planCode: string;
    planName: string;
    monthlyPrice: string;
    currency: string;
  };

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
    maxPlayers: number | null;
    maxTeams: number | null;
    maxStaff: number | null;
    maxFacilities: number | null;
    maxAthleteAccounts: number | null;
    features: string[];
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
      <section className="mb-6 overflow-hidden rounded-[28px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white shadow-sm shadow-violet-200">
              <WalletCards size={25} />
            </div>

            <div>
              <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-violet-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-violet-700">
                <Sparkles size={12} />
                Menaxhimi komercial
              </div>

              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">
                Abonimet
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                Monitoro planet, trial-et, ciklin
                e abonimeve dhe pagesat e
                akademive nga një pamje e vetme.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-violet-700">
                <CreditCard size={15} />

                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Abonime
                </span>
              </div>

              <p className="mt-1 text-lg font-black tracking-tight text-slate-950">
                {counts.all}
              </p>
            </div>

            <div className="rounded-2xl border border-white/80 bg-white/80 px-4 py-3 shadow-sm">
              <div className="flex items-center gap-2 text-emerald-700">
                <ShieldCheck size={15} />

                <span className="text-[10px] font-bold uppercase tracking-wide">
                  Aktive
                </span>
              </div>

              <p className="mt-1 text-lg font-black tracking-tight text-slate-950">
                {counts.active}
              </p>
            </div>
          </div>
        </div>
      </section>

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

      <div className="mt-5 flex flex-col gap-3 rounded-[24px] border border-slate-200/80 bg-white/90 p-3 shadow-sm xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search
            size={17}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />

          <input
            value={query}
            onChange={(event) =>
              setQuery(
                event.target.value
              )
            }
            placeholder="Kërko akademi, pronar ose plan..."
            className="w-full rounded-2xl border border-slate-200 bg-slate-50/70 py-3 pl-10 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-violet-300 focus:bg-white focus:ring-4 focus:ring-violet-50"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 xl:justify-end">
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
        <section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
          <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/80 via-white to-sky-50/60 px-5 py-4">
            <p className="text-sm font-black tracking-tight text-slate-950">
              Lista e abonimeve
            </p>

            <p className="mt-1 text-xs font-medium text-slate-500">
              {visible.length} rezultate
            </p>
          </div>

          {visible.length === 0 ? (
            <div className="flex min-h-[320px] items-center justify-center p-8 text-center">
              <div>
                <CreditCard
                  size={30}
                  className="mx-auto text-violet-300"
                />

                <p className="mt-3 text-sm font-semibold text-slate-600">
                  Nuk u gjet asnjë abonim.
                </p>
              </div>
            </div>
          ) : (
            <div className="max-h-[720px] divide-y divide-slate-100 overflow-y-auto">
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
                      "group block w-full border-l-4 px-5 py-4 text-left transition duration-150",
                      selected?.id ===
                      subscription.id
                        ? "border-violet-500 bg-gradient-to-r from-violet-50 via-white to-sky-50/40"
                        : "border-transparent hover:bg-slate-50/80",
                    ].join(" ")}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black tracking-tight text-slate-950">
                          {
                            subscription
                              .academy.name
                          }
                        </p>

                        <p className="mt-1 text-xs font-medium text-slate-600">
                          {
                            subscription
                              .plan.name
                          }
                          {" · "}
                          {formatMoney(
                            subscription
                              .commercialTerms
                              .monthlyPrice,
                            subscription
                              .commercialTerms
                              .currency
                          )}
                          /muaj
                        </p>

                        <p className="mt-1.5 truncate text-[11px] font-medium text-slate-400">
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
            <div className="flex min-h-[420px] items-center justify-center rounded-[24px] border border-dashed border-violet-200 bg-gradient-to-br from-violet-50/70 via-white to-sky-50/50 p-8 text-center shadow-sm">
              <div>
                <CreditCard
                  size={30}
                  className="mx-auto text-violet-300"
                />

                <p className="mt-3 text-sm font-bold text-slate-700">
                  Zgjidh një abonim
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">
              <div className="border-b border-violet-100 bg-gradient-to-r from-violet-50/70 via-white to-sky-50/50 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <SubscriptionBadge
                      status={
                        selected.status
                      }
                    />

                    <h2 className="mt-3 text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                      {
                        selected.academy
                          .name
                      }
                    </h2>

                    <p className="mt-1 text-xs font-medium text-slate-500">
                      Abonimi krijuar më{" "}
                      {formatDateTime(
                        selected.createdAt
                      )}
                    </p>
                  </div>

                  <div className="min-w-[160px] rounded-2xl border border-violet-100 bg-white/90 px-4 py-3 shadow-sm">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-violet-500">
                      Plani
                    </p>

                    <p className="mt-1 text-sm font-black text-slate-950">
                      {
                        selected.plan
                          .name
                      }
                    </p>

                    <p className="mt-1 text-[11px] font-medium text-slate-500">
                      {formatMoney(
                selected.commercialTerms
                  .monthlyPrice,
                selected.commercialTerms
                  .currency
              )}
                      /muaj
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
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
                selected.commercialTerms
                  .monthlyPrice,
                selected.commercialTerms
                  .currency
              )}
                />
              </div>

              <PlanSwitcher
                key={`${selected.id}-${selected.plan.code}`}
                subscriptionId={selected.id}
                subscriptionStatus={selected.status}
                currentPlanCode={selected.plan.code}
                currentPlanName={selected.plan.name}
                currentPeriodEnd={selected.currentPeriodEnd}
              />
<div className="border-t border-violet-100 bg-slate-50/30 p-5 sm:p-6">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">
                  Cikli i abonimit
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
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

              <PaymentRecorder
                key={`payment-${selected.id}`}
                subscriptionId={selected.id}
                subscriptionStatus={
                  selected.status
                }
                trialEndsAt={
                  selected.trialEndsAt
                }
                commercialTerms={
                  selected.commercialTerms
                }
              />

              <div className="border-t border-violet-100 bg-slate-50/30 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-violet-600">
                      Pagesat e abonimit
                    </p>

                    <p className="mt-1 text-xs font-medium text-slate-600">
                      Deri në 8 pagesat e fundit.
                    </p>
                  </div>

                  <span className="rounded-xl border border-violet-100 bg-violet-50 px-3 py-1.5 text-xs font-black text-violet-700">
                    {
                      selected._count
                        .payments
                    }
                  </span>
                </div>

                {selected.payments
                  .length === 0 ? (
                  <div className="mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/70 p-5 text-sm font-medium text-slate-500">
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
                          className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:border-violet-200 hover:shadow-md"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-sm font-black tracking-tight text-slate-950">
                                {formatMoney(
                                  payment.totalAmount,
                                  payment.currency
                                )}
                              </p>

                              <p className="mt-1 text-xs font-medium text-slate-600">
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
                            <p className="mt-3 border-t border-slate-100 pt-3 text-xs leading-5 text-slate-500">
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
  const tones: Record<
    string,
    {
      card: string;
      icon: string;
      label: string;
    }
  > = {
    "Abonime totale": {
      card:
        "border-violet-100 bg-gradient-to-br from-violet-50/90 via-white to-white",
      icon:
        "bg-violet-100 text-violet-700 ring-violet-200/70",
      label: "text-violet-700",
    },

    "Në trial": {
      card:
        "border-sky-100 bg-gradient-to-br from-sky-50/90 via-white to-white",
      icon:
        "bg-sky-100 text-sky-700 ring-sky-200/70",
      label: "text-sky-700",
    },

    Aktive: {
      card:
        "border-emerald-100 bg-gradient-to-br from-emerald-50/90 via-white to-white",
      icon:
        "bg-emerald-100 text-emerald-700 ring-emerald-200/70",
      label: "text-emerald-700",
    },

    "Kërkojnë vëmendje": {
      card:
        "border-amber-100 bg-gradient-to-br from-amber-50/90 via-white to-white",
      icon:
        "bg-amber-100 text-amber-700 ring-amber-200/70",
      label: "text-amber-700",
    },
  };

  const tone =
    tones[title] ?? {
      card: "border-slate-200 bg-white",
      icon:
        "bg-slate-100 text-slate-700 ring-slate-200",
      label: "text-slate-600",
    };

  return (
    <div
      className={[
        "group relative overflow-hidden rounded-[24px] border p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md",
        tone.card,
      ].join(" ")}
    >
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-white/60 blur-2xl" />

      <div
        className={[
          "relative flex h-10 w-10 items-center justify-center rounded-2xl ring-1",
          tone.icon,
        ].join(" ")}
      >
        {icon}
      </div>

      <div className="relative mt-5">
        <p
          className={[
            "text-[11px] font-bold uppercase tracking-[0.08em]",
            tone.label,
          ].join(" ")}
        >
          {title}
        </p>

        <p className="mt-1.5 text-3xl font-black tracking-tight text-slate-950">
          {value}
        </p>
      </div>
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
        "whitespace-nowrap rounded-2xl px-3.5 py-2.5 text-xs font-bold transition",
        active
          ? "bg-violet-600 text-white shadow-sm shadow-violet-200"
          : "border border-slate-200 bg-slate-50/70 text-slate-600 hover:border-violet-200 hover:bg-violet-50 hover:text-violet-700",
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
    <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-4 transition hover:border-violet-200 hover:bg-violet-50/40">
      <div className="flex items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
          {icon}
        </span>

        <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-500">
          {label}
        </span>
      </div>

      <p className="mt-3 break-words text-sm font-bold text-slate-950">
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
