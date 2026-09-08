"use client";

import {
  Loader2,
  Pencil,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";

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

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string | null;
  currentClub: string | null;
  nationality: string | null;
  city: string | null;
  email: string | null;
  phone: string | null;
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
  observations: Observation[];
};

type Props = {
  candidateId: string;
  onClose: () => void;
  onDeleted: () => void;
  onEdit: (candidate: Candidate) => void;
  onAddObservation: (candidate: Candidate) => void;
  onEditObservation: (
    candidate: Candidate,
    observation: Observation
  ) => void;
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "I ri",
  OBSERVING: "Në vëzhgim",
  SHORTLISTED: "Në listë të shkurtër",
  TRIAL: "Në provë",
  REJECTED: "Refuzuar",
  SIGNED: "I afruar",
};

const PRIORITY_LABELS: Record<string, string> = {
  LOW: "I ulët",
  MEDIUM: "Mesatar",
  HIGH: "I lartë",
  URGENT: "Urgjent",
};

const SPORT_LABELS: Record<string, string> = {
  FOOTBALL: "Futboll",
  BASKETBALL: "Basketboll",
  VOLLEYBALL: "Volejboll",
  TENNIS: "Tenis",
  SWIMMING: "Not",
  HANDBALL: "Hendboll",
  MARTIAL_ARTS: "Arte marciale",
  ATHLETICS: "Atletikë",
  OTHER: "Tjetër",
};

const DITET = [
  "Die",
  "Hën",
  "Mar",
  "Mër",
  "Enj",
  "Pre",
  "Sht",
];

const MUAJT = [
  "Jan",
  "Shk",
  "Mar",
  "Pri",
  "Maj",
  "Qer",
  "Kor",
  "Gus",
  "Sht",
  "Tet",
  "Nën",
  "Dhj",
];

function formatoDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return `${DITET[date.getDay()]}, ${date.getDate()} ${MUAJT[date.getMonth()]} ${date.getFullYear()}`;
}

export default function CandidateDetails({
  candidateId,
  onClose,
  onDeleted,
  onEdit,
  onAddObservation,
  onEditObservation,
}: Props) {
  const [candidate, setCandidate] =
    useState<Candidate | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [deleting, setDeleting] =
    useState(false);

  const [error, setError] =
    useState("");

  async function ngarko() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `/api/scouting/${candidateId}`
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Kandidati nuk u ngarkua."
        );
      }

      setCandidate(
        result.candidate
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ngarko();
  }, [candidateId]);

  async function fshiKandidatin() {
    if (!candidate) {
      return;
    }

    const konfirmim =
      window.confirm(
        `Je i sigurt që dëshiron të fshish ${candidate.firstName} ${candidate.lastName}?`
      );

    if (!konfirmim) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(
        `/api/scouting/${candidate.id}`,
        {
          method: "DELETE",
        }
      );

      const result =
        await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Kandidati nuk u fshi."
        );
      }

      onDeleted();
      onClose();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Ndodhi një gabim."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[90] bg-slate-950/35 backdrop-blur-[2px]">
      <div className="ml-auto h-full w-full max-w-2xl overflow-y-auto bg-white shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Detajet e kandidatit
            </p>

            <h2 className="mt-1 text-xl font-bold text-slate-900">
              {candidate
                ? `${candidate.firstName} ${candidate.lastName}`
                : "Kandidati"}
            </h2>
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

        {loading ? (
          <div className="flex min-h-[420px] items-center justify-center">
            <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
          </div>
        ) : error ? (
          <div className="p-6">
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {error}
            </div>
          </div>
        ) : candidate ? (
          <div className="space-y-6 p-6">
            <div className="flex flex-wrap gap-2">
              <Etikete
                text={
                  STATUS_LABELS[
                    candidate.status
                  ] ||
                  candidate.status
                }
              />

              <Etikete
                text={`Prioritet: ${
                  PRIORITY_LABELS[
                    candidate.priority
                  ] ||
                  candidate.priority
                }`}
              />

              <Etikete
                text={
                  SPORT_LABELS[
                    candidate.sport
                  ] ||
                  candidate.sport
                }
              />
            </div>

            <section className="grid gap-4 sm:grid-cols-2">
              <Info
                label="Pozicioni"
                value={
                  candidate.position ||
                  "Pa pozicion"
                }
              />

              <Info
                label="Klubi aktual"
                value={
                  candidate.currentClub ||
                  "Pa klub"
                }
              />

              <Info
                label="Qyteti"
                value={
                  candidate.city ||
                  "Pa të dhëna"
                }
              />

              <Info
                label="Kombësia"
                value={
                  candidate.nationality ||
                  "Pa të dhëna"
                }
              />

              <Info
                label="Telefoni"
                value={
                  candidate.phone ||
                  "Pa të dhëna"
                }
              />

              <Info
                label="Email"
                value={
                  candidate.email ||
                  "Pa të dhëna"
                }
              />
            </section>

            <section>
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                Vlerësimet
              </h3>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                <Note
                  label="Teknik"
                  value={
                    candidate.technicalRating
                  }
                />

                <Note
                  label="Fizik"
                  value={
                    candidate.physicalRating
                  }
                />

                <Note
                  label="Taktik"
                  value={
                    candidate.tacticalRating
                  }
                />

                <Note
                  label="Mental"
                  value={
                    candidate.mentalRating
                  }
                />

                <Note
                  label="Gjithsej"
                  value={
                    candidate.overallRating
                  }
                />
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <BllokTeksti
                title="Pikat e forta"
                value={
                  candidate.strengths
                }
              />

              <BllokTeksti
                title="Pikat për përmirësim"
                value={
                  candidate.weaknesses
                }
              />

              <BllokTeksti
                title="Shënime"
                value={
                  candidate.notes
                }
              />
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-slate-900">
                    Historiku i vëzhgimeve
                  </h3>

                  <p className="mt-1 text-xs text-slate-500">
                    {
                      candidate
                        .observations
                        .length
                    }{" "}
                    vëzhgime të regjistruara
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    onAddObservation(
                      candidate
                    )
                  }
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-indigo-50 px-4 text-sm font-semibold text-indigo-700 transition hover:bg-indigo-100"
                >
                  <Plus className="h-4 w-4" />
                  Shto vëzhgim
                </button>
              </div>

              {candidate.observations
                .length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-200 px-6 py-10 text-center">
                  <p className="text-sm font-semibold text-slate-700">
                    Nuk ka vëzhgime
                  </p>

                  <p className="mt-1 text-xs text-slate-500">
                    Regjistro vëzhgimin e parë për këtë kandidat.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {candidate.observations.map(
                    (observation) => (
                      <div
                        key={
                          observation.id
                        }
                        className="rounded-2xl border border-slate-200 p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">
                              {observation.eventName ||
                                "Vëzhgim sportiv"}
                            </p>

                            <p className="mt-1 text-xs text-slate-500">
                              {formatoDate(
                                observation.observedAt
                              )}

                              {observation.location
                                ? ` • ${observation.location}`
                                : ""}
                            </p>

                            {observation.observerName && (
                              <p className="mt-1 text-xs text-slate-500">
                                Vëzhguesi:{" "}
                                {
                                  observation.observerName
                                }
                              </p>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 font-bold text-slate-900">
                              <Star className="h-4 w-4" />
                              {observation.overallRating ?? "-"}
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                onEditObservation(
                                  candidate,
                                  observation
                                )
                              }
                              className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100"
                              aria-label="Edito vëzhgimin"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={async () => {
                                const konfirmim =
                                  window.confirm(
                                    "Je i sigurt që dëshiron ta fshish këtë vëzhgim?"
                                  );

                                if (!konfirmim) {
                                  return;
                                }

                                const response =
                                  await fetch(
                                    `/api/scouting/${candidate.id}/observations/${observation.id}`,
                                    {
                                      method: "DELETE",
                                    }
                                  );

                                if (!response.ok) {
                                  const result =
                                    await response.json();

                                  window.alert(
                                    result.error ||
                                      "Vëzhgimi nuk u fshi."
                                  );

                                  return;
                                }

                                await ngarko();
                              }}
                              className="rounded-lg p-2 text-red-500 transition hover:bg-red-50"
                              aria-label="Fshi vëzhgimin"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>

                        {observation.notes && (
                          <p className="mt-3 text-sm leading-6 text-slate-600">
                            {
                              observation.notes
                            }
                          </p>
                        )}
                      </div>
                    )
                  )}
                </div>
              )}
            </section>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() =>
                  onEdit(candidate)
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Edito kandidatin
              </button>

              <button
                type="button"
                onClick={
                  fshiKandidatin
                }
                disabled={deleting}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-5 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
              >
                {deleting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}

                Fshi kandidatin
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Etikete({
  text,
}: {
  text: string;
}) {
  return (
    <span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
      {text}
    </span>
  );
}

function Info({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold text-slate-800">
        {value}
      </p>
    </div>
  );
}

function Note({
  label,
  value,
}: {
  label: string;
  value: number | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-3 text-center">
      <p className="text-xs font-medium text-slate-500">
        {label}
      </p>

      <p className="mt-2 text-xl font-bold text-slate-900">
        {value ?? "-"}
      </p>
    </div>
  );
}

function BllokTeksti({
  title,
  value,
}: {
  title: string;
  value: string | null;
}) {
  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <h4 className="text-sm font-bold text-slate-800">
        {title}
      </h4>

      <p className="mt-2 text-sm leading-6 text-slate-600">
        {value || "Pa të dhëna"}
      </p>
    </div>
  );
}