"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Save,
  X,
} from "lucide-react";

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string | null;
  currentClub: string | null;
  city: string | null;
  nationality: string | null;
  phone: string | null;
  email: string | null;
  status: string;
  priority: string;
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
  candidate?: Candidate | null;
  onClose: () => void;
  onSaved: () => void;
};

const SPORTET = [
  ["FOOTBALL", "Futboll"],
  ["BASKETBALL", "Basketboll"],
  ["VOLLEYBALL", "Volejboll"],
  ["TENNIS", "Tenis"],
  ["SWIMMING", "Not"],
  ["HANDBALL", "Hendboll"],
  ["MARTIAL_ARTS", "Arte marciale"],
  ["ATHLETICS", "Atletikë"],
  ["OTHER", "Tjetër"],
];

const STATUSET = [
  ["NEW", "I ri"],
  ["OBSERVING", "Në vëzhgim"],
  ["SHORTLISTED", "Në listë të shkurtër"],
  ["TRIAL", "Në provë"],
  ["REJECTED", "Refuzuar"],
  ["SIGNED", "I afruar"],
];

const PRIORITETET = [
  ["LOW", "I ulët"],
  ["MEDIUM", "Mesatar"],
  ["HIGH", "I lartë"],
  ["URGENT", "Urgjent"],
];

function numerNeTekst(
  value: number | null | undefined
) {
  return value === null ||
    value === undefined
    ? ""
    : String(value);
}

function krijoFormen(
  candidate?: Candidate | null
) {
  return {
    firstName:
      candidate?.firstName || "",
    lastName:
      candidate?.lastName || "",
    sport:
      candidate?.sport || "FOOTBALL",
    position:
      candidate?.position || "",
    currentClub:
      candidate?.currentClub || "",
    city:
      candidate?.city || "",
    nationality:
      candidate?.nationality || "",
    phone:
      candidate?.phone || "",
    email:
      candidate?.email || "",
    status:
      candidate?.status || "NEW",
    priority:
      candidate?.priority || "MEDIUM",
    technicalRating:
      numerNeTekst(
        candidate?.technicalRating
      ),
    physicalRating:
      numerNeTekst(
        candidate?.physicalRating
      ),
    tacticalRating:
      numerNeTekst(
        candidate?.tacticalRating
      ),
    mentalRating:
      numerNeTekst(
        candidate?.mentalRating
      ),
    overallRating:
      numerNeTekst(
        candidate?.overallRating
      ),
    strengths:
      candidate?.strengths || "",
    weaknesses:
      candidate?.weaknesses || "",
    notes:
      candidate?.notes || "",
  };
}

export default function CandidateModal({
  candidate = null,
  onClose,
  onSaved,
}: Props) {
  const [form, setForm] =
    useState(() =>
      krijoFormen(candidate)
    );

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const eshteEditim =
    Boolean(candidate?.id);

  useEffect(() => {
    setForm(
      krijoFormen(candidate)
    );
  }, [candidate]);

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
    if (
      !form.firstName.trim() ||
      !form.lastName.trim()
    ) {
      setError(
        "Emri dhe mbiemri janë të detyrueshëm."
      );
      return;
    }

    setSaving(true);
    setError("");

    try {
      const response = await fetch(
        eshteEditim
          ? `/api/scouting/${candidate!.id}`
          : "/api/scouting",
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
            "Kandidati nuk u ruajt."
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/45 p-4 backdrop-blur-sm">
      <div className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {eshteEditim
                ? "Edito kandidatin"
                : "Shto kandidat"}
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              {eshteEditim
                ? "Përditëso të dhënat e kandidatit."
                : "Regjistro një sportist të ri për procesin e skautimit."}
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

        <div className="space-y-7 p-6">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          <Seksion title="Të dhënat bazë">
            <Fusha
              label="Emri"
              value={form.firstName}
              onChange={(value) =>
                ndrysho(
                  "firstName",
                  value
                )
              }
              required
            />

            <Fusha
              label="Mbiemri"
              value={form.lastName}
              onChange={(value) =>
                ndrysho(
                  "lastName",
                  value
                )
              }
              required
            />

            <Zgjedhje
              label="Sporti"
              value={form.sport}
              options={SPORTET}
              onChange={(value) =>
                ndrysho(
                  "sport",
                  value
                )
              }
            />

            <Fusha
              label="Pozicioni"
              value={form.position}
              onChange={(value) =>
                ndrysho(
                  "position",
                  value
                )
              }
            />

            <Fusha
              label="Klubi aktual"
              value={form.currentClub}
              onChange={(value) =>
                ndrysho(
                  "currentClub",
                  value
                )
              }
            />

            <Fusha
              label="Qyteti"
              value={form.city}
              onChange={(value) =>
                ndrysho(
                  "city",
                  value
                )
              }
            />

            <Fusha
              label="Kombësia"
              value={form.nationality}
              onChange={(value) =>
                ndrysho(
                  "nationality",
                  value
                )
              }
            />

            <Fusha
              label="Telefoni"
              value={form.phone}
              onChange={(value) =>
                ndrysho(
                  "phone",
                  value
                )
              }
            />

            <Fusha
              label="Email"
              value={form.email}
              onChange={(value) =>
                ndrysho(
                  "email",
                  value
                )
              }
            />
          </Seksion>

          <Seksion title="Procesi i skautimit">
            <Zgjedhje
              label="Statusi"
              value={form.status}
              options={STATUSET}
              onChange={(value) =>
                ndrysho(
                  "status",
                  value
                )
              }
            />

            <Zgjedhje
              label="Prioriteti"
              value={form.priority}
              options={PRIORITETET}
              onChange={(value) =>
                ndrysho(
                  "priority",
                  value
                )
              }
            />
          </Seksion>

          <Seksion title="Vlerësimet">
            <Nota
              label="Teknik"
              value={form.technicalRating}
              onChange={(value) =>
                ndrysho(
                  "technicalRating",
                  value
                )
              }
            />

            <Nota
              label="Fizik"
              value={form.physicalRating}
              onChange={(value) =>
                ndrysho(
                  "physicalRating",
                  value
                )
              }
            />

            <Nota
              label="Taktik"
              value={form.tacticalRating}
              onChange={(value) =>
                ndrysho(
                  "tacticalRating",
                  value
                )
              }
            />

            <Nota
              label="Mental"
              value={form.mentalRating}
              onChange={(value) =>
                ndrysho(
                  "mentalRating",
                  value
                )
              }
            />

            <Nota
              label="I përgjithshëm"
              value={form.overallRating}
              onChange={(value) =>
                ndrysho(
                  "overallRating",
                  value
                )
              }
            />
          </Seksion>

          <div className="grid gap-4 lg:grid-cols-3">
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
          </div>
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
              : "Ruaj kandidatin"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Seksion({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-500">
        {title}
      </h3>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {children}
      </div>
    </section>
  );
}

function Fusha({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
        {required ? " *" : ""}
      </span>

      <input
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
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
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}

function Zgjedhje({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-semibold text-slate-700">
        {label}
      </span>

      <select
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none"
      >
        {options.map(
          ([optionValue, optionLabel]) => (
            <option
              key={optionValue}
              value={optionValue}
            >
              {optionLabel}
            </option>
          )
        )}
      </select>
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
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        rows={4}
        className="w-full resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-slate-400"
      />
    </label>
  );
}