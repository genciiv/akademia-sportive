"use client";

import {
  Building2,
  CalendarDays,
  Check,
  CreditCard,
  Edit3,
  Gauge,
  Loader2,
  Save,
  Settings2,
  ShieldCheck,
  Sparkles,
  ToggleLeft,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import {
  useState,
} from "react";

type Plan = {
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
  isActive: boolean;
  sortOrder: number;

  _count: {
    subscriptions: number;
  };
};

type EditablePlan = {
  monthlyPrice: string;
  maxPlayers: string;
  maxTeams: string;
  maxStaff: string;
  maxFacilities: string;
  maxAthleteAccounts: string;
  features: string[];
  isActive: boolean;
};

const FEATURE_LABELS: Record<
  string,
  string
> = {
  MEDICAL: "Moduli mjekësor",
  PHYSICAL_PROFILE:
    "Profili fizik",
  PERFORMANCE:
    "Performanca",
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

const ALL_FEATURES =
  Object.keys(FEATURE_LABELS);

export function PlatformSettingsClient({
  plans: initialPlans,
  trialDays,
}: {
  plans: Plan[];
  trialDays: number;
}) {
  const [plans, setPlans] =
    useState(initialPlans);

  const [
    editingPlan,
    setEditingPlan,
  ] = useState<Plan | null>(null);

  const [form, setForm] =
    useState<EditablePlan | null>(
      null
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  function openEditor(
    plan: Plan
  ) {
    setEditingPlan(plan);

    setForm({
      monthlyPrice:
        plan.monthlyPrice,

      maxPlayers:
        inputLimit(
          plan.maxPlayers
        ),

      maxTeams:
        inputLimit(
          plan.maxTeams
        ),

      maxStaff:
        inputLimit(
          plan.maxStaff
        ),

      maxFacilities:
        inputLimit(
          plan.maxFacilities
        ),

      maxAthleteAccounts:
        inputLimit(
          plan.maxAthleteAccounts
        ),

      features:
        [...plan.features],

      isActive:
        plan.isActive,
    });

    setError("");
    setSuccess("");
  }

  function closeEditor() {
    if (saving) {
      return;
    }

    setEditingPlan(null);
    setForm(null);
    setError("");
  }

  function toggleFeature(
    feature: string
  ) {
    if (!form) {
      return;
    }

    setForm({
      ...form,

      features:
        form.features.includes(
          feature
        )
          ? form.features.filter(
              (item) =>
                item !== feature
            )
          : [
              ...form.features,
              feature,
            ],
    });
  }

  async function savePlan() {
    if (
      !editingPlan ||
      !form ||
      saving
    ) {
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const response =
        await fetch(
          `/api/platform-admin/plans/${editingPlan.id}`,
          {
            method: "PATCH",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              monthlyPrice:
                Number(
                  form.monthlyPrice
                ),

              maxPlayers:
                parseLimitInput(
                  form.maxPlayers
                ),

              maxTeams:
                parseLimitInput(
                  form.maxTeams
                ),

              maxStaff:
                parseLimitInput(
                  form.maxStaff
                ),

              maxFacilities:
                parseLimitInput(
                  form.maxFacilities
                ),

              maxAthleteAccounts:
                parseLimitInput(
                  form.maxAthleteAccounts
                ),

              features:
                form.features,

              isActive:
                form.isActive,
            }),
          }
        );

      const data =
        (await response.json().catch(
          () => null
        )) as {
          error?: string;

          plan?: {
            id: string;
            monthlyPrice: string;
            maxPlayers: number | null;
            maxTeams: number | null;
            maxStaff: number | null;
            maxFacilities: number | null;
            maxAthleteAccounts:
              | number
              | null;
            features: string[];
            isActive: boolean;
          };
        } | null;

      if (
        !response.ok ||
        !data?.plan
      ) {
        setError(
          data?.error ??
            "Ndryshimet nuk mund të ruheshin."
        );

        return;
      }

      setPlans((current) =>
        current.map((plan) =>
          plan.id === data.plan?.id
            ? {
                ...plan,
                ...data.plan,
              }
            : plan
        )
      );

      setEditingPlan(null);
      setForm(null);

      setSuccess(
        `Plani ${editingPlan.name} u përditësua me sukses.`
      );
    } catch {
      setError(
        "Ndodhi një problem gjatë komunikimit me serverin."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="mb-7 rounded-[28px] border border-slate-200 bg-gradient-to-br from-white via-white to-violet-50/40 p-6 shadow-sm sm:p-7">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-100 bg-violet-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-violet-700">
              <Settings2 size={13} />
              Konfigurimi i platformës
            </div>

            <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950">
              Cilësimet
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Menaxho planet globale, kufijtë operacionalë dhe funksionalitetet që ofrohen për akademitë.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-700">
            <ShieldCheck size={15} />
            Ndryshimet auditohen
          </div>
        </div>
      </div>

      {success ? (
        <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          {success}
        </div>
      ) : null}

      <section className="rounded-[24px] border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
              <CalendarDays
                size={20}
              />
            </div>

            <div>
              <p className="text-sm font-black text-slate-950">
                Trial për akademitë e reja
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-500">
                Çdo akademi e aprovuar nis me planin PRO për {trialDays} ditë.
              </p>

              <p className="mt-2 text-xs font-semibold text-amber-700">
                Politika e trial-it mbetet read-only derisa të centralizohet konfigurimi i onboarding-ut.
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-2xl border border-blue-100 bg-white px-5 py-4 text-center shadow-sm">
            <p className="text-3xl font-black text-slate-950">
              {trialDays}
            </p>

            <p className="mt-1 text-xs font-semibold text-slate-400">
              ditë trial
            </p>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-950">
              Planet
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Konfigurimi real i planeve të ruajtura në databazë.
            </p>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            {plans.length} plane
          </div>
        </div>

        <div className="grid gap-5 xl:grid-cols-2">
          {plans.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onEdit={() =>
                openEditor(plan)
              }
            />
          ))}
        </div>
      </div>

      <section className="mt-5 rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
            <ShieldCheck size={19} />
          </div>

          <div>
            <p className="text-sm font-black text-slate-950">
              Menaxhim i kontrolluar
            </p>

            <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">
              Ndryshimet e planeve kryhen vetëm nga Platform Admin dhe regjistrohen në auditin global me gjendjen para dhe pas ndryshimit.
            </p>
          </div>
        </div>
      </section>

      {editingPlan &&
      form ? (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm">
          <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[28px] border border-white/70 bg-white shadow-2xl">
            <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-slate-100 bg-white/95 p-5 backdrop-blur sm:p-6">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-violet-50 px-2.5 py-1 text-[10px] font-bold text-violet-700">
                  <Edit3 size={12} />
                  EDITIM PLANI
                </div>

                <h3 className="mt-3 text-xl font-black text-slate-950">
                  {editingPlan.name}
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  {editingPlan.code}
                </p>
              </div>

              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={17} />
              </button>
            </div>

            <div className="p-5 sm:p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Çmimi mujor"
                  hint={editingPlan.currency}
                >
                  <input
                    type="number"
                    min="0"
                    step="100"
                    value={
                      form.monthlyPrice
                    }
                    onChange={(event) =>
                      setForm({
                        ...form,
                        monthlyPrice:
                          event.target
                            .value,
                      })
                    }
                    className={inputClass}
                  />
                </Field>

                <Field
                  label="Statusi"
                  hint="Disponueshmëria e planit"
                >
                  <button
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        isActive:
                          !form.isActive,
                      })
                    }
                    className={[
                      "flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-sm font-bold transition",
                      form.isActive
                        ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                        : "border-slate-200 bg-slate-50 text-slate-600",
                    ].join(" ")}
                  >
                    <span>
                      {form.isActive
                        ? "Aktiv"
                        : "Jo aktiv"}
                    </span>

                    <ToggleLeft
                      size={20}
                    />
                  </button>
                </Field>

                <LimitField
                  label="Sportistë"
                  value={
                    form.maxPlayers
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      maxPlayers:
                        value,
                    })
                  }
                />

                <LimitField
                  label="Ekipe"
                  value={
                    form.maxTeams
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      maxTeams:
                        value,
                    })
                  }
                />

                <LimitField
                  label="Staf"
                  value={
                    form.maxStaff
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      maxStaff:
                        value,
                    })
                  }
                />

                <LimitField
                  label="Ambiente"
                  value={
                    form.maxFacilities
                  }
                  onChange={(value) =>
                    setForm({
                      ...form,
                      maxFacilities:
                        value,
                    })
                  }
                />

                <div className="sm:col-span-2">
                  <LimitField
                    label="Llogari Athlete Portal"
                    value={
                      form.maxAthleteAccounts
                    }
                    onChange={(value) =>
                      setForm({
                        ...form,
                        maxAthleteAccounts:
                          value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-100 pt-6">
                <div className="flex items-center gap-2">
                  <Sparkles
                    size={17}
                    className="text-violet-600"
                  />

                  <p className="text-sm font-black text-slate-950">
                    Funksionalitetet
                  </p>
                </div>

                <p className="mt-1 text-xs text-slate-500">
                  Zgjidh modulet premium të përfshira në këtë plan.
                </p>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {ALL_FEATURES.map(
                    (feature) => {
                      const active =
                        form.features.includes(
                          feature
                        );

                      return (
                        <button
                          key={feature}
                          type="button"
                          onClick={() =>
                            toggleFeature(
                              feature
                            )
                          }
                          className={[
                            "flex items-center gap-3 rounded-2xl border px-4 py-3 text-left transition",
                            active
                              ? "border-emerald-200 bg-emerald-50"
                              : "border-slate-200 bg-white hover:bg-slate-50",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "flex h-7 w-7 shrink-0 items-center justify-center rounded-xl",
                              active
                                ? "bg-emerald-600 text-white"
                                : "bg-slate-100 text-slate-400",
                            ].join(" ")}
                          >
                            <Check
                              size={14}
                            />
                          </span>

                          <span className="text-xs font-bold text-slate-700">
                            {FEATURE_LABELS[
                              feature
                            ]}
                          </span>
                        </button>
                      );
                    }
                  )}
                </div>
              </div>

              {!form.isActive ? (
                <div className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                  Çaktivizimi e heq planin nga zgjedhjet e reja. Abonimet ekzistuese nuk fshihen dhe historiku financiar ruhet.
                </div>
              ) : null}

              {error ? (
                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                  {error}
                </div>
              ) : null}
            </div>

            <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-slate-100 bg-white/95 p-5 backdrop-blur sm:flex-row sm:justify-end sm:p-6">
              <button
                type="button"
                onClick={closeEditor}
                disabled={saving}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={savePlan}
                disabled={saving}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? (
                  <Loader2
                    size={16}
                    className="animate-spin"
                  />
                ) : (
                  <Save size={16} />
                )}

                Ruaj ndryshimet
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function PlanCard({
  plan,
  onEdit,
}: {
  plan: Plan;
  onEdit: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 bg-gradient-to-br from-white via-white to-violet-50/30 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-blue-50 px-2.5 py-1 text-[10px] font-bold text-blue-700">
                {plan.code}
              </span>

              <span
                className={[
                  "rounded-full px-2.5 py-1 text-[10px] font-bold",
                  plan.isActive
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-slate-100 text-slate-600",
                ].join(" ")}
              >
                {plan.isActive
                  ? "AKTIV"
                  : "JO AKTIV"}
              </span>
            </div>

            <h3 className="mt-3 text-xl font-black text-slate-950">
              {plan.name}
            </h3>

            {plan.description ? (
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {plan.description}
              </p>
            ) : null}
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-slate-950">
              {formatMoney(
                plan.monthlyPrice,
                plan.currency
              )}
            </p>

            <p className="mt-1 text-xs text-slate-400">
              në muaj
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onEdit}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-2.5 text-sm font-bold text-violet-700 transition hover:bg-violet-100"
        >
          <Edit3 size={15} />
          Ndrysho planin
        </button>
      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-6">
        <Limit
          icon={
            <UsersRound size={16} />
          }
          label="Sportistë"
          value={plan.maxPlayers}
        />

        <Limit
          icon={
            <ShieldCheck size={16} />
          }
          label="Ekipe"
          value={plan.maxTeams}
        />

        <Limit
          icon={
            <Building2 size={16} />
          }
          label="Staf"
          value={plan.maxStaff}
        />

        <Limit
          icon={
            <CreditCard size={16} />
          }
          label="Ambiente"
          value={
            plan.maxFacilities
          }
        />

        <div className="sm:col-span-2">
          <Limit
            icon={
              <UserRound size={16} />
            }
            label="Athlete Portal"
            value={
              plan.maxAthleteAccounts
            }
          />
        </div>
      </div>

      <div className="border-t border-slate-100 p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Funksionalitetet
          </p>

          <span className="rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
            {plan._count.subscriptions} abonime
          </span>
        </div>

        {plan.features.length ===
        0 ? (
          <div className="mt-4 rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">
            Ky plan nuk ka module premium shtesë.
          </div>
        ) : (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {plan.features.map(
              (feature) => (
                <div
                  key={feature}
                  className="flex items-center gap-2 rounded-2xl bg-slate-50 px-3 py-3"
                >
                  <Check
                    size={15}
                    className="text-emerald-600"
                  />

                  <span className="text-xs font-semibold text-slate-700">
                    {FEATURE_LABELS[
                      feature
                    ] ?? feature}
                  </span>
                </div>
              )
            )}
          </div>
        )}
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">
          {label}
        </span>

        {hint ? (
          <span className="text-[10px] font-semibold text-slate-400">
            {hint}
          </span>
        ) : null}
      </div>

      {children}
    </label>
  );
}

function LimitField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (
    value: string
  ) => void;
}) {
  return (
    <Field
      label={label}
      hint="Bosh = pa limit"
    >
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder="Pa limit"
        className={inputClass}
      />
    </Field>
  );
}

function Limit({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3">
      <div className="flex items-center gap-2 text-slate-500">
        {icon}

        <span className="text-xs font-semibold">
          {label}
        </span>
      </div>

      <span className="text-sm font-black text-slate-950">
        {value === null
          ? "Pa limit"
          : value}
      </span>
    </div>
  );
}

const inputClass =
  "w-full rounded-2xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm font-semibold text-slate-900 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-50";

function inputLimit(
  value: number | null
) {
  return value === null
    ? ""
    : String(value);
}

function parseLimitInput(
  value: string
) {
  const trimmed =
    value.trim();

  if (!trimmed) {
    return null;
  }

  return Number(trimmed);
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

  const formatted =
    number.toLocaleString(
      "en-US",
      {
        maximumFractionDigits: 2,
      }
    );

  return `${formatted} ${currency}`;
}