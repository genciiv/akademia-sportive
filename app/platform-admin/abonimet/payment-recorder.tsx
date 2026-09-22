"use client";

import {
  AlertTriangle,
  Banknote,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  FormEvent,
  useMemo,
  useState,
} from "react";

type Status =
  | "TRIALING"
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "EXPIRED"
  | "CANCELLED";

type CommercialTerms = {
  source:
    | "GLOBAL_PLAN"
    | "CUSTOM_OFFER";
  customOfferActive: boolean;
  planCode: string;
  planName: string;
  monthlyPrice: string;
  currency: string;
};

type Props = {
  subscriptionId: string;
  subscriptionStatus: Status;
  trialEndsAt: string | null;
  commercialTerms: CommercialTerms;
};

const PAYMENT_MONTHS = [
  1,
  3,
  6,
  12,
] as const;

type PaymentMonths =
  (typeof PAYMENT_MONTHS)[number];

function formatMoney(
  value: number,
  currency: string
) {
  if (!Number.isFinite(value)) {
    return "\u2014 " + currency;
  }

  const fixed = value.toFixed(2);
  const parts = fixed.split(".");

  const integerPart = parts[0].replace(
    /\B(?=(\d{3})+(?!\d))/g,
    ","
  );

  const decimalPart = parts[1];

  const formatted =
    decimalPart === "00"
      ? integerPart
      : integerPart + "." + decimalPart;

  return formatted + " " + currency;
}

function formatDate(value: string | null) {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  const day = String(
    date.getUTCDate()
  ).padStart(2, "0");

  const month = String(
    date.getUTCMonth() + 1
  ).padStart(2, "0");

  const year = date.getUTCFullYear();

  return day + "/" + month + "/" + year;
}

export function PaymentRecorder({
  subscriptionId,
  subscriptionStatus,
  trialEndsAt,
  commercialTerms,
}: Props) {
  const router = useRouter();

  const [months, setMonths] =
    useState<PaymentMonths>(1);

  const [note, setNote] =
    useState("");

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  const monthlyPrice =
    Number(commercialTerms.monthlyPrice);

  const totalAmount = useMemo(
    () => monthlyPrice * months,
    [monthlyPrice, months]
  );

  const cancelled =
    subscriptionStatus === "CANCELLED";

  async function submitPayment(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (cancelled || saving) {
      return;
    }

    setError(null);
    setSuccess(null);

    const confirmed = window.confirm(
      [
        "Konfirmon regjistrimin e pagesës?",
        "",
        `Periudha: ${months} muaj`,
        `Çmimi mujor: ${formatMoney(
          monthlyPrice,
          commercialTerms.currency
        )}`,
        `Totali: ${formatMoney(
          totalAmount,
          commercialTerms.currency
        )}`,
        "Metoda: CASH",
      ].join("\n")
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      const response = await fetch(
        `/api/platform-admin/subscriptions/${subscriptionId}/payments`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            months,
            method: "CASH",
            note:
              note.trim() || null,
          }),
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.error ??
            "Pagesa nuk mund të regjistrohej."
        );
      }

      setNote("");

      setSuccess(
        "Pagesa u regjistrua me sukses."
      );

      router.refresh();
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Ndodhi një gabim gjatë regjistrimit të pagesës."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="border-t border-slate-100 p-5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Regjistro pagesë
          </p>

          <p className="mt-1 text-sm font-semibold text-slate-950">
            Pagesë cash për abonimin
          </p>

          <p className="mt-1 text-xs text-slate-500">
            Çmimi merret automatikisht nga kushtet komerciale aktive.
          </p>
        </div>

        <div className="rounded-xl bg-slate-50 px-3 py-2 text-left sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
            Burimi i çmimit
          </p>

          <p className="mt-0.5 text-xs font-bold text-slate-700">
            {commercialTerms.source ===
            "CUSTOM_OFFER"
              ? "Ofertë e personalizuar"
              : "Plan global"}
          </p>
        </div>
      </div>

      {subscriptionStatus ===
      "TRIALING" ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-4">
          <AlertTriangle
            className="mt-0.5 shrink-0 text-blue-700"
            size={17}
          />

          <div>
            <p className="text-xs font-bold text-blue-950">
              Trial-i ruhet i plotë
            </p>

            <p className="mt-1 text-xs leading-5 text-blue-800">
              Pagesa regjistrohet tani, por
              periudha e paguar fillon pas
              përfundimit të trial-it
              {trialEndsAt
                ? ` më ${formatDate(
                    trialEndsAt
                  )}`
                : ""}
              .
            </p>
          </div>
        </div>
      ) : null}

      {cancelled ? (
        <div className="mt-4 flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle
            className="mt-0.5 shrink-0 text-amber-700"
            size={17}
          />

          <div>
            <p className="text-xs font-bold text-amber-950">
              Pagesa është e bllokuar
            </p>

            <p className="mt-1 text-xs leading-5 text-amber-800">
              Abonimi është anuluar.
              Riaktivizoje abonimin përpara
              regjistrimit të një pagese të re.
            </p>
          </div>
        </div>
      ) : null}

      <form
        className="mt-5"
        onSubmit={submitPayment}
      >
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <div>
            <label className="text-xs font-bold text-slate-700">
              Periudha e pagesës
            </label>

            <div className="mt-2 grid grid-cols-4 gap-2">
              {PAYMENT_MONTHS.map(
                (option) => (
                  <button
                    key={option}
                    type="button"
                    disabled={
                      saving || cancelled
                    }
                    onClick={() =>
                      setMonths(option)
                    }
                    className={[
                      "rounded-xl border px-3 py-2.5 text-xs font-bold transition",
                      months === option
                        ? "border-blue-600 bg-blue-600 text-white"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50",
                      saving || cancelled
                        ? "cursor-not-allowed opacity-60"
                        : "",
                    ].join(" ")}
                  >
                    {option}{" "}
                    {option === 1
                      ? "muaj"
                      : "muaj"}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700">
              Metoda
            </label>

            <div className="mt-2 flex h-[42px] items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-bold text-slate-700">
              <Banknote size={16} />
              CASH
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              Çmimi mujor
            </p>

            <p className="mt-1 text-base font-bold text-slate-950">
              {formatMoney(
                monthlyPrice,
                commercialTerms.currency
              )}
            </p>
          </div>

          <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wide text-blue-500">
              Totali
            </p>

            <p className="mt-1 text-base font-bold text-blue-950">
              {formatMoney(
                totalAmount,
                commercialTerms.currency
              )}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <label
            htmlFor={`payment-note-${subscriptionId}`}
            className="text-xs font-bold text-slate-700"
          >
            Shënim
          </label>

          <textarea
            id={`payment-note-${subscriptionId}`}
            value={note}
            maxLength={2000}
            disabled={saving || cancelled}
            onChange={(event) =>
              setNote(event.target.value)
            }
            rows={3}
            placeholder="Opsionale · p.sh. pagesa u mor në zyrë."
            className="mt-2 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:opacity-70"
          />

          <p className="mt-1 text-right text-[10px] text-slate-400">
            {note.length}/2000
          </p>
        </div>

        {error ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-medium text-red-700">
            <AlertTriangle
              size={16}
              className="shrink-0"
            />
            {error}
          </div>
        ) : null}

        {success ? (
          <div className="mt-4 flex gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-medium text-emerald-700">
            <CheckCircle2
              size={16}
              className="shrink-0"
            />
            {success}
          </div>
        ) : null}

        <div className="mt-5 flex flex-col gap-3 border-t border-slate-100 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[11px] leading-5 text-slate-500">
            Pagesa ruhet si historik financiar
            dhe nuk ndryshohet më pas.
          </p>

          <button
            type="submit"
            disabled={
              saving ||
              cancelled ||
              !Number.isFinite(
                monthlyPrice
              ) ||
              monthlyPrice < 0
            }
            className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={16}
                  className="animate-spin"
                />
                Duke regjistruar...
              </>
            ) : (
              <>
                <Banknote size={16} />
                Regjistro pagesën
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
