"use client";

import {
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Mail,
  MapPin,
  Phone,
  Save,
  ShieldCheck,
  Sparkles,
  UsersRound,
} from "lucide-react";
import {
  useEffect,
  useState,
} from "react";
import {
  useRouter,
} from "next/navigation";

type PlanData = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  monthlyPrice: string;
  currency: string;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  maxAthleteAccounts: number | null;
  features: string[];
};

type SubscriptionData = {
  status: string;
  trialStartsAt: string | null;
  trialEndsAt: string | null;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  graceEndsAt: string | null;
  cancelledAt: string | null;
  plan: PlanData;
};

type AcademySettingsData = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  phone: string | null;
  logo: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;

  subscription: SubscriptionData | null;

  _count: {
    players: number;
    teams: number;
    staff: number;
    facilities: number;
    athleteAccounts: number;
  };
};

type FormState = {
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
};

const EMPTY_FORM: FormState = {
  name: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  country: "",
};

const FEATURE_LABELS: Record<
  string,
  string
> = {
  MEDICAL: "Moduli mjekësor",
  PHYSICAL_PROFILE:
    "Profili fizik",
  PERFORMANCE: "Performanca",
  SCOUTING: "Scouting",
  TACTICS: "Taktikat",
  KNOWLEDGE_BASE:
    "Baza e njohurive",
  FACILITY_SCHEDULING:
    "Planifikimi i ambienteve",
  ADVANCED_REPORTS:
    "Raporte të avancuara",
  ATHLETE_PORTAL:
    "Portali i sportistit",
};

const SUBSCRIPTION_LABELS: Record<
  string,
  string
> = {
  TRIALING: "Në periudhë prove",
  ACTIVE: "Aktiv",
  PAST_DUE: "Pagesë e vonuar",
  GRACE_PERIOD: "Periudhë tolerance",
  CANCELLED: "Anuluar",
  EXPIRED: "Skaduar",
};

function academyToForm(
  academy: AcademySettingsData
): FormState {
  return {
    name: academy.name,
    email: academy.email ?? "",
    phone: academy.phone ?? "",
    address: academy.address ?? "",
    city: academy.city ?? "",
    country: academy.country ?? "",
  };
}

function formatMoney(
  value: string,
  currency: string
) {
  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${value} ${currency}`;
  }

  return `${new Intl.NumberFormat(
    "sq-AL",
    {
      maximumFractionDigits: 2,
    }
  ).format(number)} ${currency}`;
}

function formatDate(
  value: string | null
) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function subscriptionStatusTone(
  status: string
) {
  switch (status) {
    case "ACTIVE":
      return "bg-emerald-50 text-emerald-700 ring-emerald-100";

    case "TRIALING":
      return "bg-violet-50 text-violet-700 ring-violet-100";

    case "PAST_DUE":
    case "GRACE_PERIOD":
      return "bg-amber-50 text-amber-700 ring-amber-100";

    case "CANCELLED":
    case "EXPIRED":
      return "bg-rose-50 text-rose-700 ring-rose-100";

    default:
      return "bg-slate-100 text-slate-700 ring-slate-200";
  }
}

function usagePercent(
  current: number,
  limit: number | null
) {
  if (
    limit === null ||
    limit <= 0
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.round(
      (current / limit) * 100
    )
  );
}

export function AcademySettings() {
  const router = useRouter();

  const [academy, setAcademy] =
    useState<AcademySettingsData | null>(
      null
    );

  const [form, setForm] =
    useState<FormState>(EMPTY_FORM);

  const [canManage, setCanManage] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadAcademy() {
      try {
        const response = await fetch(
          "/api/settings/academy",
          {
            cache: "no-store",
          }
        );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              "Cilësimet nuk mund të ngarkoheshin."
          );
        }

        if (cancelled) {
          return;
        }

        setAcademy(data.academy);

        setForm(
          academyToForm(data.academy)
        );

        setCanManage(
          data.canManage === true
        );
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "Ndodhi një gabim."
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadAcademy();

    return () => {
      cancelled = true;
    };
  }, []);

  function updateField(
    field: keyof FormState,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ruaj(
    event: React.FormEvent
  ) {
    event.preventDefault();

    if (!canManage) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/settings/academy",
        {
          method: "PATCH",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(form),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "Cilësimet nuk mund të ruheshin."
        );
      }

      setAcademy(data.academy);

      setForm(
        academyToForm(data.academy)
      );

      setSuccess(
        "Cilësimet e akademisë u ruajtën me sukses."
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ndodhi një gabim."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm">
        <div className="h-5 w-48 animate-pulse rounded bg-slate-100" />

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {Array.from({
            length: 6,
          }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-slate-50"
            />
          ))}
        </div>
      </section>
    );
  }

  if (!academy) {
    return (
      <div className="rounded-[22px] border border-rose-100 bg-rose-50 px-4 py-4 text-sm font-semibold text-rose-700">
        {error ||
          "Akademia nuk mund të ngarkohej."}
      </div>
    );
  }

  const subscription =
    academy.subscription;

  const plan =
    subscription?.plan ?? null;

  return (
    <div className="space-y-5">
      {(error || success) && (
        <div
          className={[
            "rounded-[18px] border px-4 py-3 text-sm font-semibold",
            error
              ? "border-rose-100 bg-rose-50 text-rose-700"
              : "border-emerald-100 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {error || success}
        </div>
      )}

      <div className="grid gap-5 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-sky-700">
                  <Building2 size={19} />
                </div>

                <div>
                  <h2 className="font-black text-slate-950">
                    Informacioni i akademisë
                  </h2>

                  <p className="mt-0.5 text-xs text-slate-500">
                    Profili dhe të dhënat e kontaktit.
                  </p>
                </div>
              </div>
            </div>

            <span
              className={[
                "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1",
                academy.status === "ACTIVE"
                  ? "bg-emerald-50 text-emerald-700 ring-emerald-100"
                  : "bg-violet-50 text-violet-700 ring-violet-100",
              ].join(" ")}
            >
              {academy.status}
            </span>
          </div>

          <form
            onSubmit={ruaj}
            className="mt-6 grid gap-4 sm:grid-cols-2"
          >
            <Field
              label="Emri i akademisë"
              value={form.name}
              disabled={
                !canManage || saving
              }
              required
              maxLength={160}
              className="sm:col-span-2"
              onChange={(value) =>
                updateField(
                  "name",
                  value
                )
              }
            />

            <Field
              label="Email"
              value={form.email}
              type="email"
              icon={<Mail size={15} />}
              placeholder="info@akademia.al"
              disabled={
                !canManage || saving
              }
              maxLength={320}
              onChange={(value) =>
                updateField(
                  "email",
                  value
                )
              }
            />

            <Field
              label="Telefon"
              value={form.phone}
              icon={<Phone size={15} />}
              placeholder="+355 ..."
              disabled={
                !canManage || saving
              }
              maxLength={50}
              onChange={(value) =>
                updateField(
                  "phone",
                  value
                )
              }
            />

            <Field
              label="Adresa"
              value={form.address}
              icon={<MapPin size={15} />}
              placeholder="Rruga, numri..."
              disabled={
                !canManage || saving
              }
              maxLength={240}
              className="sm:col-span-2"
              onChange={(value) =>
                updateField(
                  "address",
                  value
                )
              }
            />

            <Field
              label="Qyteti"
              value={form.city}
              disabled={
                !canManage || saving
              }
              maxLength={120}
              onChange={(value) =>
                updateField(
                  "city",
                  value
                )
              }
            />

            <Field
              label="Shteti"
              value={form.country}
              disabled={
                !canManage || saving
              }
              maxLength={120}
              onChange={(value) =>
                updateField(
                  "country",
                  value
                )
              }
            />

            <div className="grid gap-3 rounded-[18px] bg-slate-50 p-4 sm:col-span-2 sm:grid-cols-3">
              <InfoMini
                label="Identifikuesi"
                value={academy.slug}
              />

              <InfoMini
                label="Krijuar më"
                value={formatDate(
                  academy.createdAt
                )}
              />

              <InfoMini
                label="Përditësuar më"
                value={formatDate(
                  academy.updatedAt
                )}
              />
            </div>

            {canManage ? (
              <div className="sm:col-span-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-11 items-center gap-2 rounded-xl bg-sky-700 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Save size={15} />

                  {saving
                    ? "Duke ruajtur..."
                    : "Ruaj ndryshimet"}
                </button>
              </div>
            ) : (
              <div className="rounded-xl bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-500 sm:col-span-2">
                Ke vetëm akses për lexim në
                cilësimet e akademisë.
              </div>
            )}
          </form>
        </section>

        <section className="overflow-hidden rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-sky-50 shadow-sm">
          <div className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white shadow-sm">
                  <CreditCard size={20} />
                </div>

                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-violet-600">
                    Plani & abonimi
                  </p>

                  <h2 className="mt-1 text-xl font-black text-slate-950">
                    {plan
                      ? plan.name
                      : "Pa plan aktiv"}
                  </h2>
                </div>
              </div>

              {subscription ? (
                <span
                  className={[
                    "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide ring-1",
                    subscriptionStatusTone(
                      subscription.status
                    ),
                  ].join(" ")}
                >
                  {SUBSCRIPTION_LABELS[
                    subscription.status
                  ] ??
                    subscription.status}
                </span>
              ) : null}
            </div>

            {plan && subscription ? (
              <>
                <div className="mt-6 rounded-[20px] border border-white/80 bg-white/80 p-4 shadow-sm">
                  <p className="text-xs font-semibold text-slate-500">
                    Çmimi i planit
                  </p>

                  <div className="mt-1 flex items-end gap-2">
                    <p className="text-2xl font-black text-slate-950">
                      {formatMoney(
                        plan.monthlyPrice,
                        plan.currency
                      )}
                    </p>

                    <span className="pb-1 text-xs font-semibold text-slate-400">
                      / muaj
                    </span>
                  </div>

                  {plan.description ? (
                    <p className="mt-3 text-xs leading-5 text-slate-500">
                      {plan.description}
                    </p>
                  ) : null}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
                  <InfoCard
                    icon={
                      <CalendarDays size={16} />
                    }
                    label={
                      subscription.status ===
                      "TRIALING"
                        ? "Fundi i trial-it"
                        : "Fundi i periudhës"
                    }
                    value={formatDate(
                      subscription.status ===
                        "TRIALING"
                        ? subscription.trialEndsAt
                        : subscription.currentPeriodEnd
                    )}
                  />

                  <InfoCard
                    icon={
                      <ShieldCheck size={16} />
                    }
                    label="Kodi i planit"
                    value={plan.code}
                  />
                </div>
              </>
            ) : (
              <div className="mt-6 rounded-[18px] bg-white/80 p-4 text-sm font-semibold text-slate-500">
                Akademia nuk ka abonim aktiv të
                lidhur me një plan.
              </div>
            )}
          </div>
        </section>
      </div>

      {plan ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                <UsersRound size={18} />
              </div>

              <div>
                <h2 className="font-black text-slate-950">
                  Përdorimi i planit
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Përdorimi aktual kundrejt
                  limiteve të planit.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-4">
              <UsageRow
                label="Sportistë"
                current={
                  academy._count.players
                }
                limit={plan.maxPlayers}
              />

              <UsageRow
                label="Ekipe"
                current={
                  academy._count.teams
                }
                limit={plan.maxTeams}
              />

              <UsageRow
                label="Staf"
                current={
                  academy._count.staff
                }
                limit={plan.maxStaff}
              />

              <UsageRow
                label="Ambiente"
                current={
                  academy._count.facilities
                }
                limit={plan.maxFacilities}
              />

              <UsageRow
                label="Llogari sportistësh"
                current={
                  academy._count
                    .athleteAccounts
                }
                limit={
                  plan.maxAthleteAccounts
                }
              />
            </div>
          </section>

          <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-700">
                <Sparkles size={18} />
              </div>

              <div>
                <h2 className="font-black text-slate-950">
                  Funksionalitetet e planit
                </h2>

                <p className="mt-0.5 text-xs text-slate-500">
                  Modulet premium të përfshira
                  në abonimin aktual.
                </p>
              </div>
            </div>

            {plan.features.length === 0 ? (
              <div className="mt-5 rounded-[18px] bg-slate-50 p-4 text-sm font-semibold text-slate-500">
                Ky plan nuk ka funksionalitete
                premium shtesë.
              </div>
            ) : (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {plan.features.map(
                  (feature) => (
                    <div
                      key={feature}
                      className="flex items-center gap-3 rounded-[16px] border border-emerald-100 bg-emerald-50/60 px-4 py-3"
                    >
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white text-emerald-600 shadow-sm">
                        <Check size={14} />
                      </div>

                      <span className="text-xs font-bold text-slate-700">
                        {FEATURE_LABELS[
                          feature
                        ] ?? feature}
                      </span>
                    </div>
                  )
                )}
              </div>
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  disabled,
  type = "text",
  required = false,
  maxLength,
  placeholder,
  icon,
  className = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  type?: string;
  required?: boolean;
  maxLength?: number;
  placeholder?: string;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      className={[
        "block text-xs font-bold text-slate-500",
        className,
      ].join(" ")}
    >
      {label}

      <div className="relative mt-1.5">
        {icon ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        ) : null}

        <input
          type={type}
          value={value}
          onChange={(event) =>
            onChange(
              event.target.value
            )
          }
          disabled={disabled}
          required={required}
          maxLength={maxLength}
          placeholder={placeholder}
          className={[
            "h-11 w-full rounded-xl border border-slate-200 bg-slate-50/60 px-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-sky-300 focus:bg-white focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500",
            icon ? "pl-9" : "",
          ].join(" ")}
        />
      </div>
    </label>
  );
}

function InfoMini({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-1 truncate text-sm font-bold text-slate-700">
        {value}
      </p>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[16px] border border-white/80 bg-white/75 p-3 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-bold uppercase tracking-wide">
          {label}
        </span>
      </div>

      <p className="mt-2 text-sm font-black text-slate-800">
        {value}
      </p>
    </div>
  );
}

function UsageRow({
  label,
  current,
  limit,
}: {
  label: string;
  current: number;
  limit: number | null;
}) {
  const percent =
    usagePercent(
      current,
      limit
    );

  const isNearLimit =
    limit !== null &&
    limit > 0 &&
    percent >= 80;

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-4">
        <span className="text-xs font-bold text-slate-600">
          {label}
        </span>

        <span className="text-xs font-black text-slate-900">
          {current}
          <span className="font-semibold text-slate-400">
            {" / "}
            {limit === null
              ? "Pa limit"
              : limit}
          </span>
        </span>
      </div>

      {limit === null ? (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full w-full rounded-full bg-emerald-300" />
        </div>
      ) : (
        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
          <div
            className={[
              "h-full rounded-full transition-all",
              isNearLimit
                ? "bg-amber-400"
                : "bg-emerald-400",
            ].join(" ")}
            style={{
              width: `${percent}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}