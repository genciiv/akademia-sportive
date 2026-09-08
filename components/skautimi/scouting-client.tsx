"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Search,
  Plus,
  Loader2,
  Eye,
  Star,
  UsersRound,
  Target,
  ClipboardList,
  UserCheck,
} from "lucide-react";

import { AppShell } from "@/components/app-shell";
import CandidateModal from "@/components/skautimi/candidate-modal";
import CandidateDetails from "@/components/skautimi/candidate-details";
import ObservationModal from "@/components/skautimi/observation-modal";

type Candidate = {
  id: string;
  firstName: string;
  lastName: string;
  sport: string;
  position: string | null;
  currentClub: string | null;
  city: string | null;
  status: string;
  priority: string;
  overallRating: number | null;
};

type ResponseData = {
  candidates: Candidate[];
  summary: Record<string, number>;
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

export default function ScoutingClient() {
  const [data, setData] = useState<ResponseData>({
    candidates: [],
    summary: {},
  });

  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [sport, setSport] = useState("");
  const [modalHapur, setModalHapur] = useState(false);
  const [kandidatiPerEditim, setKandidatiPerEditim] = useState<any>(null);
  const [candidateIdAktiv, setCandidateIdAktiv] = useState<string | null>(null);
  const [candidateIdVezhgim, setCandidateIdVezhgim] = useState<string | null>(null);
  const [vezhgimiAktiv, setVezhgimiAktiv] = useState<any>(null);
  const [refreshDetaje, setRefreshDetaje] = useState(0);

  async function ngarkoKandidatet() {
    setLoading(true);

    try {
      const params = new URLSearchParams();

      if (status) {
        params.set("status", status);
      }

      if (priority) {
        params.set("priority", priority);
      }

      if (sport) {
        params.set("sport", sport);
      }

      const response = await fetch(
        `/api/scouting?${params.toString()}`
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error ||
            "Nuk u ngarkuan kandidatët."
        );
      }

      setData(result);
    } catch (error) {
      console.error(error);

      setData({
        candidates: [],
        summary: {},
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    ngarkoKandidatet();
  }, [
    status,
    priority,
    sport,
  ]);

  const kandidatet = useMemo(() => {
    const q = search
      .trim()
      .toLowerCase();

    if (!q) {
      return data.candidates;
    }

    return data.candidates.filter(
      (candidate) => {
        const tekst = [
          candidate.firstName,
          candidate.lastName,
          candidate.currentClub,
          candidate.position,
          candidate.city,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return tekst.includes(q);
      }
    );
  }, [
    data.candidates,
    search,
  ]);

  const total = data.candidates.length;

  const neVezhgim =
    data.summary.OBSERVING || 0;

  const shortlist =
    data.summary.SHORTLISTED || 0;

  const neProve =
    data.summary.TRIAL || 0;

  const teAfuar =
    data.summary.SIGNED || 0;

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="mb-1 text-sm font-semibold text-indigo-600">
              Zbulimi i talenteve
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              Skautimi
            </h1>

            <p className="mt-2 max-w-3xl text-sm text-slate-500">
              Menaxho kandidatët, vlerësimet dhe historikun e vëzhgimeve sportive.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
            setKandidatiPerEditim(null);
            setModalHapur(true);
          }}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
          >
            <Plus className="h-4 w-4" />
            Shto kandidat
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Karte
            title="Kandidatë gjithsej"
            value={total}
            icon={UsersRound}
          />

          <Karte
            title="Në vëzhgim"
            value={neVezhgim}
            icon={Eye}
          />

          <Karte
            title="Listë e shkurtër"
            value={shortlist}
            icon={Star}
          />

          <Karte
            title="Në provë"
            value={neProve}
            icon={Target}
          />

          <Karte
            title="Të afruar"
            value={teAfuar}
            icon={UserCheck}
          />
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px_180px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Kërko kandidat, klub, pozicion ose qytet"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm outline-none transition focus:border-slate-400 focus:bg-white"
              />
            </div>

            <select
              value={status}
              onChange={(event) =>
                setStatus(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              <option value="">
                Të gjitha statuset
              </option>

              {Object.entries(
                STATUS_LABELS
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              value={priority}
              onChange={(event) =>
                setPriority(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              <option value="">
                Të gjitha prioritetet
              </option>

              {Object.entries(
                PRIORITY_LABELS
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>

            <select
              value={sport}
              onChange={(event) =>
                setSport(
                  event.target.value
                )
              }
              className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none"
            >
              <option value="">
                Të gjitha sportet
              </option>

              {Object.entries(
                SPORT_LABELS
              ).map(
                ([value, label]) => (
                  <option
                    key={value}
                    value={value}
                  >
                    {label}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-semibold text-slate-900">
                Kandidatët
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                {kandidatet.length} kandidatë në rezultat
              </p>
            </div>

            <ClipboardList className="h-5 w-5 text-slate-400" />
          </div>

          {loading ? (
            <div className="flex min-h-[260px] items-center justify-center">
              <Loader2 className="h-7 w-7 animate-spin text-slate-400" />
            </div>
          ) : kandidatet.length === 0 ? (
            <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center">
              <UsersRound className="mb-4 h-10 w-10 text-slate-300" />

              <h3 className="font-semibold text-slate-900">
                Nuk ka kandidatë
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Shto kandidatin e parë ose ndrysho filtrat e kërkimit.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {kandidatet.map(
                (candidate) => (
                  <div
                    key={candidate.id}
                    onClick={() => setCandidateIdAktiv(candidate.id)}
                    className="grid cursor-pointer gap-4 px-5 py-4 transition hover:bg-slate-50 lg:grid-cols-[1.5fr_1fr_1fr_160px_130px]"
                  >
                    <div>
                      <p className="font-semibold text-slate-900">
                        {candidate.firstName}{" "}
                        {candidate.lastName}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {candidate.position ||
                          "Pa pozicion"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Sporti
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {SPORT_LABELS[
                          candidate.sport
                        ] ||
                          candidate.sport}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Klubi aktual
                      </p>

                      <p className="mt-1 text-sm font-medium text-slate-700">
                        {candidate.currentClub ||
                          "Pa klub"}
                      </p>
                    </div>

                    <div>
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Statusi
                      </p>

                      <p className="mt-1 text-sm font-semibold text-slate-700">
                        {STATUS_LABELS[
                          candidate.status
                        ] ||
                          candidate.status}
                      </p>
                    </div>

                    <div className="lg:text-right">
                      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                        Nota
                      </p>

                      <p className="mt-1 text-lg font-bold text-slate-900">
                        {candidate.overallRating ??
                          "—"}
                      </p>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      {candidateIdAktiv && (
        <CandidateDetails
          candidateId={candidateIdAktiv}
          onClose={() =>
            setCandidateIdAktiv(null)
          }
          onDeleted={() =>
            ngarkoKandidatet()
          }
          onEdit={(candidate) => {
            setKandidatiPerEditim(candidate);
            setCandidateIdAktiv(null);
            setModalHapur(true);
          }}
          key={`${candidateIdAktiv}-${refreshDetaje}`}
          onAddObservation={(candidate) => {
            setCandidateIdVezhgim(candidate.id);
            setVezhgimiAktiv(null);
          }}
          onEditObservation={(candidate, observation) => {
            setCandidateIdVezhgim(candidate.id);
            setVezhgimiAktiv(observation);
          }}
        />
      )}
      {candidateIdVezhgim && (
        <ObservationModal
          candidateId={candidateIdVezhgim}
          observation={vezhgimiAktiv}
          onClose={() => {
            setCandidateIdVezhgim(null);
            setVezhgimiAktiv(null);
          }}
          onSaved={() => {
            setRefreshDetaje((value) => value + 1);
            ngarkoKandidatet();
          }}
        />
      )}
      {modalHapur && (
        <CandidateModal
          candidate={kandidatiPerEditim}
          onClose={() => {
            setModalHapur(false);
            setKandidatiPerEditim(null);
          }}
          onSaved={() => {
            ngarkoKandidatet();
            setRefreshDetaje((value) => value + 1);
          }}
        />
      )}
      </div>
    </AppShell>
  );
}

function Karte({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{
    className?: string;
  }>;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            {title}
          </p>

          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>

        <div className="rounded-xl bg-slate-100 p-2.5">
          <Icon className="h-5 w-5 text-slate-600" />
        </div>
      </div>
    </div>
  );
}