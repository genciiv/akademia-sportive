"use client";

import {
  Check,
  Loader2,
  Power,
  Save,
  Sparkles,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const PLAN_FEATURES = [
  {
    key: "MEDICAL",
    label: "Medical",
  },
  {
    key: "PHYSICAL_PROFILE",
    label: "Profili fizik",
  },
  {
    key: "PERFORMANCE",
    label: "Performanca",
  },
  {
    key: "SCOUTING",
    label: "Scouting",
  },
  {
    key: "TACTICS",
    label: "Taktika",
  },
  {
    key: "KNOWLEDGE_BASE",
    label: "Knowledge Base",
  },
  {
    key: "FACILITY_SCHEDULING",
    label: "Planifikimi i ambienteve",
  },
  {
    key: "ADVANCED_REPORTS",
    label: "Raporte të avancuara",
  },
] as const;

type Feature =
  (typeof PLAN_FEATURES)[number]["key"];

type Plan = {
  code: string;
  name: string;
  monthlyPrice: string;
  currency: string;
  maxPlayers: number;
  maxTeams: number;
  maxStaff: number;
  maxFacilities: number;
  features: string[];
};

type CustomOffer = {
  id: string;
  monthlyPrice: string | null;
  currency: string | null;
  maxPlayers: number | null;
  maxTeams: number | null;
  maxStaff: number | null;
  maxFacilities: number | null;
  overrideFeatures: boolean;
  features: string[];
  note: string | null;
  validFrom: string;
  validUntil: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
} | null;

type Props = {
  subscriptionId: string;
  subscriptionStatus:
    | "TRIALING"
    | "ACTIVE"
    | "GRACE_PERIOD"
    | "EXPIRED"
    | "CANCELLED";
  plan: Plan;
  customOffer: CustomOffer;
};

function toLocalDateTime(value: string | null) {
  if (!value) {
    return "";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const pad = (part: number) =>
    String(part).padStart(2, "0");

  return [
    date.getFullYear(),
    "-",
    pad(date.getMonth() + 1),
    "-",
    pad(date.getDate()),
    "T",
    pad(date.getHours()),
    ":",
    pad(date.getMinutes()),
  ].join("");
}

function toIsoOrNull(value: string) {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function emptyToNull(value: string) {
  const normalized = value.trim();

  return normalized || null;
}

export function CustomOfferEditor({
  subscriptionId,
  subscriptionStatus,
  plan,
  customOffer,
}: Props) {
  const router = useRouter();

  const [monthlyPrice, setMonthlyPrice] =
    useState(customOffer?.monthlyPrice ?? "");

  const [currency, setCurrency] =
    useState(customOffer?.currency ?? "");

  const [maxPlayers, setMaxPlayers] =
    useState(
      customOffer?.maxPlayers?.toString() ?? ""
    );

  const [maxTeams, setMaxTeams] =
    useState(
      customOffer?.maxTeams?.toString() ?? ""
    );

  const [maxStaff, setMaxStaff] =
    useState(
      customOffer?.maxStaff?.toString() ?? ""
    );

  const [maxFacilities, setMaxFacilities] =
    useState(
      customOffer?.maxFacilities?.toString() ?? ""
    );

  const [overrideFeatures, setOverrideFeatures] =
    useState(
      customOffer?.overrideFeatures ?? false
    );

  const [features, setFeatures] =
    useState<Feature[]>(
      (customOffer?.features ?? []).filter(
        (feature): feature is Feature =>
          PLAN_FEATURES.some(
            (item) => item.key === feature
          )
      )
    );

  const [note, setNote] =
    useState(customOffer?.note ?? "");

  const [validFrom, setValidFrom] =
    useState(
      toLocalDateTime(
        customOffer?.validFrom ??
          new Date().toISOString()
      )
    );

  const [validUntil, setValidUntil] =
    useState(
      toLocalDateTime(
        customOffer?.validUntil ?? null
      )
    );

  const [isActive, setIsActive] =
    useState(customOffer?.isActive ?? true);

  const [saving, setSaving] =
    useState(false);

  const [deactivating, setDeactivating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  function toggleFeature(feature: Feature) {
    setFeatures((current) =>
      current.includes(feature)
        ? current.filter(
            (item) => item !== feature
          )
        : [...current, feature]
    );
  }

  async function saveOffer() {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/platform-admin/subscriptions/${subscriptionId}/custom-offer`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            monthlyPrice:
              emptyToNull(monthlyPrice),
            currency:
              emptyToNull(currency),
            maxPlayers:
              emptyToNull(maxPlayers),
            maxTeams:
              emptyToNull(maxTeams),
            maxStaff:
              emptyToNull(maxStaff),
            maxFacilities:
              emptyToNull(maxFacilities),
            overrideFeatures,
            features:
              overrideFeatures
                ? features
                : [],
            note:
              emptyToNull(note),
            validFrom:
              toIsoOrNull(validFrom),
            validUntil:
              toIsoOrNull(validUntil),
            isActive,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Oferta nuk mund të ruhej."
        );
      }

      setSuccess(
        "Oferta e personalizuar u ruajt."
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ndodhi një gabim gjatë ruajtjes."
      );
    } finally {
      setSaving(false);
    }
  }

  async function deactivateOffer() {
    if (!customOffer) {
      return;
    }

    const confirmed = window.confirm(
      "Dëshiron ta çaktivizosh këtë ofertë? Të dhënat do të ruhen për auditim."
    );

    if (!confirmed) {
      return;
    }

    setDeactivating(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(
        `/api/platform-admin/subscriptions/${subscriptionId}/custom-offer`,
        {
          method: "DELETE",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Oferta nuk mund të çaktivizohej."
        );
      }

      setIsActive(false);

      setSuccess(
        "Oferta u çaktivizua. Historiku u ruajt."
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ndodhi një gabim gjatë çaktivizimit."
      );
    } finally {
      setDeactivating(false);
    }
  }

  return (
    <div className="border-t border-slate-100 p-5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles
              size={16}
              className="text-indigo-600"
            />

            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
              Ofertë e personalizuar
            </p>
          </div>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-slate-500">
            Fushat bosh trashëgojnë vlerat e planit{" "}
            <strong className="text-slate-700">
              {plan.name}
            </strong>
            .
          </p>
        </div>

        <span
          className={[
            "w-fit rounded-full px-3 py-1 text-[11px] font-bold",
            customOffer && isActive
              ? "bg-emerald-50 text-emerald-700"
              : "bg-slate-100 text-slate-500",
          ].join(" ")}
        >
          {customOffer && isActive
            ? "Aktive"
            : customOffer
              ? "Jo aktive"
              : "Pa ofertë"}
        </span>
      </div>

      {subscriptionStatus === "TRIALING" ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Akademia është në trial. Gjatë trial-it
          vazhdojnë të aplikohen limitet dhe funksionet
          globale të PRO. Oferta mund të përgatitet tani
          për periudhën pas trial-it.
        </div>
      ) : null}

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field
          label="Çmimi mujor"
          hint={`Plan: ${plan.monthlyPrice} ${plan.currency}`}
        >
          <input
            type="number"
            min="0"
            step="0.01"
            value={monthlyPrice}
            onChange={(event) =>
              setMonthlyPrice(event.target.value)
            }
            placeholder={plan.monthlyPrice}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Monedha"
          hint={`Plan: ${plan.currency}`}
        >
          <input
            type="text"
            maxLength={3}
            value={currency}
            onChange={(event) =>
              setCurrency(
                event.target.value.toUpperCase()
              )
            }
            placeholder={plan.currency}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Maks. lojtarë"
          hint={`Plan: ${plan.maxPlayers}`}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={maxPlayers}
            onChange={(event) =>
              setMaxPlayers(event.target.value)
            }
            placeholder={String(plan.maxPlayers)}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Maks. ekipe"
          hint={`Plan: ${plan.maxTeams}`}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={maxTeams}
            onChange={(event) =>
              setMaxTeams(event.target.value)
            }
            placeholder={String(plan.maxTeams)}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Maks. staf"
          hint={`Plan: ${plan.maxStaff}`}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={maxStaff}
            onChange={(event) =>
              setMaxStaff(event.target.value)
            }
            placeholder={String(plan.maxStaff)}
            className={inputClassName}
          />
        </Field>

        <Field
          label="Maks. ambiente"
          hint={`Plan: ${plan.maxFacilities}`}
        >
          <input
            type="number"
            min="0"
            step="1"
            value={maxFacilities}
            onChange={(event) =>
              setMaxFacilities(event.target.value)
            }
            placeholder={String(
              plan.maxFacilities
            )}
            className={inputClassName}
          />
        </Field>

        <Field label="E vlefshme nga">
          <input
            type="datetime-local"
            value={validFrom}
            onChange={(event) =>
              setValidFrom(event.target.value)
            }
            className={inputClassName}
          />
        </Field>

        <Field label="E vlefshme deri">
          <input
            type="datetime-local"
            value={validUntil}
            onChange={(event) =>
              setValidUntil(event.target.value)
            }
            className={inputClassName}
          />
        </Field>
      </div>

      <div className="mt-5 rounded-xl border border-slate-200 p-4">
        <label className="flex cursor-pointer items-start gap-3">
          <input
            type="checkbox"
            checked={overrideFeatures}
            onChange={(event) =>
              setOverrideFeatures(
                event.target.checked
              )
            }
            className="mt-0.5 h-4 w-4 rounded border-slate-300"
          />

          <span>
            <span className="block text-sm font-semibold text-slate-800">
              Personalizo funksionet
            </span>

            <span className="mt-1 block text-xs leading-5 text-slate-500">
              Kur është çaktivizuar, funksionet
              trashëgohen nga plani {plan.name}.
            </span>
          </span>
        </label>

        {overrideFeatures ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {PLAN_FEATURES.map((feature) => {
              const checked =
                features.includes(feature.key);

              return (
                <button
                  key={feature.key}
                  type="button"
                  onClick={() =>
                    toggleFeature(feature.key)
                  }
                  className={[
                    "flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs font-semibold transition",
                    checked
                      ? "border-indigo-200 bg-indigo-50 text-indigo-700"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50",
                  ].join(" ")}
                >
                  {feature.label}

                  {checked ? (
                    <Check size={14} />
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-3 text-xs text-slate-400">
            Trashëgohen {plan.features.length} funksione
            nga plani global.
          </p>
        )}
      </div>

      <div className="mt-5">
        <Field label="Shënim i brendshëm">
          <textarea
            rows={3}
            maxLength={2000}
            value={note}
            onChange={(event) =>
              setNote(event.target.value)
            }
            placeholder="P.sh. ofertë e negociuar me akademinë..."
            className={inputClassName}
          />
        </Field>
      </div>

      <label className="mt-5 flex w-fit cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) =>
            setIsActive(event.target.checked)
          }
          className="h-4 w-4 rounded border-slate-300"
        />

        <span className="text-sm font-semibold text-slate-700">
          Oferta është aktive
        </span>
      </label>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-medium text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={saving || deactivating}
          onClick={saveOffer}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? (
            <Loader2
              size={15}
              className="animate-spin"
            />
          ) : (
            <Save size={15} />
          )}

          {customOffer
            ? "Ruaj ndryshimet"
            : "Krijo ofertën"}
        </button>

        {customOffer?.isActive ? (
          <button
            type="button"
            disabled={saving || deactivating}
            onClick={deactivateOffer}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-xs font-bold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deactivating ? (
              <Loader2
                size={15}
                className="animate-spin"
              />
            ) : (
              <Power size={15} />
            )}

            Çaktivizo ofertën
          </button>
        ) : null}
      </div>
    </div>
  );
}

const inputClassName =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-300 focus:border-slate-400 focus:ring-2 focus:ring-slate-100";

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
    <label className="block">
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-bold text-slate-700">
          {label}
        </span>

        {hint ? (
          <span className="text-[10px] text-slate-400">
            {hint}
          </span>
        ) : null}
      </span>

      <span className="mt-2 block">
        {children}
      </span>
    </label>
  );
}
