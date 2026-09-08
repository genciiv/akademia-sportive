"use client";

import { useState } from "react";
import {
  Loader2,
  Save,
  X,
} from "lucide-react";

type Observation = {
  id: string;
  observedAt: string;
  eventName: string | null;
  location: string | null;
  observerName: string | null;
  technicalRating: number | null;
  physicalRating: number | null;
  tacticalRating: number | null;
  mentalRating: number | null;
  overallRating: number | null;
  strengths: string | null;
  weaknesses: string | null;
  notes: string | null;
};

type Props = {
  candidateId: string;
  observation?: Observation | null;
  onClose: () => void;
  onSaved: () => void;
};

function datePerInput(value?: string | null) {
  if (!value) {
    const sot = new Date();
    return [
      sot.getFullYear(),
      String(sot.getMonth() + 1).padStart(2, "0"),
      String(sot.getDate()).padStart(2, "0"),
    ].join("-");
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function numerNeTekst(value: number | null | undefined) {
  return value === null || value === undefined
    ? ""
    : String(value);
}

export default function ObservationModal({
  candidateId,
  observation = null,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] = useState({
    observedAt: datePerInput(
      observation?.observedAt
    ),
    eventName:
      observation?.eventName || "",
    location:
      observation?.location || "",
    observerName:
      observation?.observerName || "",
    technicalRating:
      numerNeTekst(
        observation?.technicalRating
      ),
    physicalRating:
      numerNeTekst(
        observation?.physicalRating
      ),
    tacticalRating:
      numerNeTekst(
        observation?.tacticalRating
      ),
    mentalRating:
      numerNeTekst(
        observation?.mentalRating
      ),
    overallRating:
      numerNeTekst(
        observation?.overallRating
      ),
    strengths:
      observation?.strengths || "",
    weaknesses:
      observation?.weaknesses || "",
    notes:
      observation?.notes || "",
  });

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const eshteEditim =
    Boolean(observation?.id);

  function ndrysho(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ruaj() {
    setSaving(true);
    setError("");

    try {
      const url = eshteEditim
        ? `/api/scouting/${candidateId}/observations/${observation!.id}`
        : `/api/scouting/${candidateId}/observations`;

      const response = await fetch(
        url,
        {
          method: eshteEditim
            ? "PATCH"
            : "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify(form),
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Vëzhgimi nuk u ruajt."
        );
      }

      onSaved();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {eshteEditim
                ? "Edito vëzhgimin"
                : "Shto vëzhgim"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Regjistro vlerësimin e kandidatit nga një vëzhgim sportiv.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
            aria-label="Mbyll"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-6 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <section>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Të dhënat e vëzhgimit
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-700">
                  Data e vëzhgimit
                </span>

                <input
                  type="date"
                  value={form.observedAt}
                  onChange={(event) =>
                    ndrysho(
                      "observedAt",
                      event.target.value
                    )
                  }
                  className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <Fusha
                label="Ndeshja ose aktiviteti"
                value={form.eventName}
                onChange={(value) =>
                  ndrysho(
                    "eventName",
                    value
                  )
                }
                placeholder="P.sh. Turneu U17"
              />

              <Fusha
                label="Vendndodhja"
                value={form.location}
                onChange={(value) =>
                  ndrysho(
                    "location",
                    value
                  )
                }
              />

              <Fusha
                label="Vëzhguesi"
                value={form.observerName}
                onChange={(value) =>
                  ndrysho(
                    "observerName",
                    value
                  )
                }
              />
            </div>
          </section>

          <section>
            <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
              Vlerësimet
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              <Nota
                label="Teknik"
                value={
                  form.technicalRating
                }
                onChange={(value) =>
                  ndrysho(
                    "technicalRating",
                    value
                  )
                }
              />

              <Nota
                label="Fizik"
                value={
                  form.physicalRating
                }
                onChange={(value) =>
                  ndrysho(
                    "physicalRating",
                    value
                  )
                }
              />

              <Nota
                label="Taktik"
                value={
                  form.tacticalRating
                }
                onChange={(value) =>
                  ndrysho(
                    "tacticalRating",
                    value
                  )
                }
              />

              <Nota
                label="Mental"
                value={
                  form.mentalRating
                }
                onChange={(value) =>
                  ndrysho(
                    "mentalRating",
                    value
                  )
                }
              />

              <Nota
                label="Gjithsej"
                value={
                  form.overallRating
                }
                onChange={(value) =>
                  ndrysho(
                    "overallRating",
                    value
                  )
                }
              />
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3">
            <TekstIgjate
              label="Pikat e forta"
              value={form.strengths}
              onChange={(value) =>
                ndrysho(
                  "strengths",
                  value
                )
              }
            />

            <TekstIgjate
              label="Pikat për përmirësim"
              value={form.weaknesses}
              onChange={(value) =>
                ndrysho(
                  "weaknesses",
                  value
                )
              }
            />

            <TekstIgjate
              label="Shënime"
              value={form.notes}
              onChange={(value) =>
                ndrysho(
                  "notes",
                  value
                )
              }
            />
          </section>
        </div>

        <div className="sticky bottom-0 flex justify-end gap-3 border-t border-slate-200 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="h-11 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            Anulo
          </button>

          <button
            type="button"
            onClick={ruaj}
            disabled={saving}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}

            {eshteEditim
              ? "Ruaj ndryshimet"
              : "Ruaj vëzhgimin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Fusha({
  label,
  value,
  onChange,
  placeholder = "",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder={placeholder}
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}

function Nota({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <input
        type="number"
        min="1"
        max="10"
        step="0.1"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        placeholder="1 - 10"
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}

function TekstIgjate({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <textarea
        rows={4}
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}