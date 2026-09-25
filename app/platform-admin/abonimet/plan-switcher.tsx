"use client";

import { ArrowRightLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

const STANDARD_PLANS = [
  {
    code: "STARTER",
    name: "Starter",
    description: "Funksionet bazë për menaxhimin e akademisë.",
  },
  {
    code: "PRO",
    name: "Pro",
    description: "Funksionet profesionale pa portalin e sportistit.",
  },
  {
    code: "PRO_PORTAL",
    name: "Pro + Athlete Portal",
    description: "Plani Pro me portal të dedikuar për sportistët.",
  },
  {
    code: "UNLIMITED",
    name: "Unlimited",
    description: "Te gjitha funksionet dhe kapacitet pa limite.",
  },

] as const;

type StandardPlanCode = (typeof STANDARD_PLANS)[number]["code"];

type Props = {
  subscriptionId: string;

  subscriptionStatus:
    "TRIALING" | "ACTIVE" | "GRACE_PERIOD" | "EXPIRED" | "CANCELLED";

  currentPlanCode: string;
  currentPlanName: string;

  currentPeriodEnd: string | null;};

function isStandardPlanCode(value: string): value is StandardPlanCode {
  return STANDARD_PLANS.some((plan) => plan.code === value);
}

export function PlanSwitcher({
  subscriptionId,
  subscriptionStatus,
  currentPlanCode,
  currentPlanName,
  currentPeriodEnd,}: Props) {
  const router = useRouter();

  const [planCode, setPlanCode] = useState<StandardPlanCode>(
    isStandardPlanCode(currentPlanCode) ? currentPlanCode : "PRO",
  );

  const [saving, setSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const [success, setSuccess] = useState<string | null>(null);

  const currentPeriodEndTime = currentPeriodEnd
    ? new Date(currentPeriodEnd).getTime()
    : null;

  const hasUnexpiredPaidCoverage =
    currentPeriodEndTime !== null &&
    Number.isFinite(currentPeriodEndTime) &&
    currentPeriodEndTime > Date.now();

  const isCancelled = subscriptionStatus === "CANCELLED";

  const isTrialing = subscriptionStatus === "TRIALING";

  const samePlan = planCode === currentPlanCode;

  const selectedPlan =
    STANDARD_PLANS.find((plan) => plan.code === planCode) ?? STANDARD_PLANS[1];

  const blocked = isCancelled || isTrialing || hasUnexpiredPaidCoverage;

  async function changePlan() {
    setError(null);
    setSuccess(null);

    if (samePlan) {
      return;
    }

    if (isCancelled) {
      setError(
        "Abonimi i anuluar duhet të riaktivizohet para ndryshimit të planit.",
      );

      return;
    }

    if (isTrialing) {
      setError("Plani mund të ndryshohet pasi të përfundojë trial-i.");

      return;
    }

    if (hasUnexpiredPaidCoverage) {
      setError(
        "Plani nuk mund të ndryshohet sepse abonimi ka ende një periudhë të paguar të vlefshme.",
      );

      return;
    }

const confirmed = window.confirm(
      `Ndrysho planin nga "${currentPlanName}" në "${selectedPlan.name}"?`,
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/platform-admin/subscriptions/${subscriptionId}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            planCode,
          }),
        },
      );

      const data = (await response.json()) as {
        error?: string;

        changed?: boolean;

        plan?: {
          code: string;
          name: string;
        };
      };

      if (!response.ok) {
        throw new Error(data.error ?? "Plani nuk mund të ndryshohej.");
      }

      if (data.changed === false) {
        setSuccess("Abonimi është tashmë në këtë plan.");
      } else {
        setSuccess(
          `Plani u ndryshua në ${data.plan?.name ?? selectedPlan.name}.`,
        );
      }

      router.refresh();
    } catch (changeError) {
      setError(
        changeError instanceof Error
          ? changeError.message
          : "Plani nuk mund të ndryshohej.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-slate-100 p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <ArrowRightLeft size={17} />
        </div>

        <div>
          <p className="text-sm font-bold text-slate-950">Ndrysho planin</p>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Plani aktual:{" "}
            <span className="font-semibold text-slate-700">
              {currentPlanName}
            </span>
            .
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="block">
          <span className="text-xs font-bold text-slate-700">Plani i ri</span>

          <select
            value={planCode}
            disabled={saving || blocked}
            onChange={(event) =>
              setPlanCode(event.target.value as StandardPlanCode)
            }
            className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
          >
            {STANDARD_PLANS.map((plan) => (
              <option key={plan.code} value={plan.code}>
                {plan.name}
              </option>
            ))}
          </select>
        </label>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {selectedPlan.description}
        </p>
      </div>

      {isTrialing ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Akademia është ende në trial. Plani mund të ndryshohet pasi trial-i të
          përfundojë.
        </div>
      ) : null}

      {hasUnexpiredPaidCoverage ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
          Ky abonim ka ende periudhë të paguar të vlefshme. Plani mund të
          ndryshohet pasi kjo periudhë të përfundojë.
        </div>
      ) : null}

      {isCancelled ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
          Abonimi është anuluar. Duhet të riaktivizohet para ndryshimit të
          planit.
        </div>
      ) : null}
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

      <button
        type="button"
        disabled={saving || blocked || samePlan}
        onClick={changePlan}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {saving ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <ArrowRightLeft size={15} />
        )}

        {saving ? "Duke ndryshuar..." : "Ndrysho planin"}
      </button>
    </div>
  );
}
