"use client";

import Link from "next/link";
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  RefreshCw,
  Send,
  ShieldCheck,
  Swords,
  XCircle,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { AppShell } from "@/components/app-shell";
import InterAcademyRequestForm from "@/components/ndeshjet/inter-akademi-request-form";

type RequestStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "CANCELLED";

type MatchType =
  | "FRIENDLY"
  | "LEAGUE"
  | "CUP"
  | "TOURNAMENT"
  | "OTHER";

type AcademySummary = {
  id: string;
  name: string;
};

type TeamSummary = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
};

type CanonicalMatchSummary = {
  id: string;
  status:
    | "SCHEDULED"
    | "COMPLETED"
    | "CANCELLED"
    | "POSTPONED";
  homeScore: number | null;
  awayScore: number | null;
};

type InterAcademyRequest = {
  id: string;
  status: RequestStatus;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  requesterIsHome: boolean;
  matchType: MatchType;
  competitionName: string | null;
  round: string | null;
  message: string | null;
  createdAt: string;
  requesterAcademy: AcademySummary;
  requesterTeam: TeamSummary;
  opponentAcademy: AcademySummary;
  opponentTeam: TeamSummary;
  interAcademyMatch: CanonicalMatchSummary | null;
};

type RequestsResponse = {
  sent?: InterAcademyRequest[];
  received?: InterAcademyRequest[];
  error?: string;
};

type ActiveTab =
  | "received"
  | "sent";

type RequestAction =
  | "accept"
  | "reject"
  | "cancel";

type ActionResponse = {
  error?: string;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}

function formatTime(value: string) {
  return new Intl.DateTimeFormat(
    "sq-AL",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(value));
}

function statusLabel(
  status: RequestStatus
) {
  switch (status) {
    case "PENDING":
      return "Në pritje";
    case "ACCEPTED":
      return "Pranuar";
    case "REJECTED":
      return "Refuzuar";
    case "CANCELLED":
      return "Anuluar";
  }
}

function statusClass(
  status: RequestStatus
) {
  switch (status) {
    case "PENDING":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "ACCEPTED":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "REJECTED":
      return "border-red-200 bg-red-50 text-red-700";
    case "CANCELLED":
      return "border-slate-200 bg-slate-100 text-slate-600";
  }
}

function matchTypeLabel(
  type: MatchType
) {
  switch (type) {
    case "FRIENDLY":
      return "Miqësore";
    case "LEAGUE":
      return "Kampionat";
    case "CUP":
      return "Kupë";
    case "TOURNAMENT":
      return "Turne";
    case "OTHER":
      return "Tjetër";
  }
}

export default function InterAcademyClient() {
  const [
    activeTab,
    setActiveTab,
  ] = useState<ActiveTab>("received");

  const [
    received,
    setReceived,
  ] = useState<InterAcademyRequest[]>([]);

  const [
    sent,
    setSent,
  ] = useState<InterAcademyRequest[]>([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    activeAction,
    setActiveAction,
  ] = useState<{
    requestId: string;
    action: RequestAction;
  } | null>(null);

  const loadRequests =
    useCallback(async () => {
      setLoading(true);
      setError("");

      try {
        const response = await fetch(
          "/api/inter-academy-match-requests",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as
            RequestsResponse;

        if (!response.ok) {
          setError(
            data.error ||
              "Kërkesat inter-akademi nuk mund të ngarkoheshin."
          );
          return;
        }

        setReceived(
          Array.isArray(data.received)
            ? data.received
            : []
        );

        setSent(
          Array.isArray(data.sent)
            ? data.sent
            : []
        );
      } catch {
        setError(
          "Ndodhi një problem gjatë ngarkimit të kërkesave."
        );
      } finally {
        setLoading(false);
      }
    }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const requests =
    activeTab === "received"
      ? received
      : sent;

  const pendingReceived =
    useMemo(
      () =>
        received.filter(
          (item) =>
            item.status === "PENDING"
        ).length,
      [received]
    );

  const pendingSent =
    useMemo(
      () =>
        sent.filter(
          (item) =>
            item.status === "PENDING"
        ).length,
      [sent]
    );

  async function handleAction(
    requestId: string,
    action: RequestAction
  ) {
    if (activeAction) {
      return;
    }

    if (
      action === "reject" &&
      !window.confirm(
        "Je i sigurt që dëshiron ta refuzosh këtë kërkesë?"
      )
    ) {
      return;
    }

    if (
      action === "cancel" &&
      !window.confirm(
        "Je i sigurt që dëshiron ta anulosh këtë kërkesë?"
      )
    ) {
      return;
    }

    setError("");
    setActiveAction({
      requestId,
      action,
    });

    try {
      const response = await fetch(
        `/api/inter-academy-match-requests/${requestId}/${action}`,
        {
          method: "POST",
        }
      );

      const data =
        (await response.json()) as
          ActionResponse;

      if (!response.ok) {
        setError(
          data.error ||
            "Veprimi nuk mund të përfundohej."
        );
        return;
      }

      await loadRequests();
    } catch {
      setError(
        "Ndodhi një problem gjatë përpunimit të kërkesës."
      );
    } finally {
      setActiveAction(null);
    }
  }

  async function handleCreated() {
    setActiveTab("sent");
    await loadRequests();
  }

  return (
    <AppShell>
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/ndeshjet"
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
            >
              <ArrowLeft size={16} />
              Kthehu te ndeshjet
            </Link>

            <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950">
              Ndeshjet Inter-Akademi
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Menaxho kërkesat për ndeshje me akademi të tjera.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void loadRequests()
            }
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "animate-spin"
                  : ""
              }
            />
            Rifresko
          </button>
        </div>

        <InterAcademyRequestForm
          onCreated={handleCreated}
        />

        <div className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Kërkesa të marra
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {received.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck size={21} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {pendingReceived} në pritje
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Kërkesa të dërguara
                </p>

                <p className="mt-2 text-3xl font-bold text-slate-950">
                  {sent.length}
                </p>
              </div>

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
                <Send size={20} />
              </div>
            </div>

            <p className="mt-3 text-xs text-slate-500">
              {pendingSent} në pritje
            </p>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <div className="border-b border-slate-200 px-4 pt-4 sm:px-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setActiveTab("received")
                }
                className={`rounded-t-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "received"
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Të marra
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {received.length}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setActiveTab("sent")
                }
                className={`rounded-t-xl px-4 py-3 text-sm font-semibold transition ${
                  activeTab === "sent"
                    ? "border-b-2 border-blue-600 text-blue-700"
                    : "text-slate-500 hover:text-slate-900"
                }`}
              >
                Të dërguara
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {sent.length}
                </span>
              </button>
            </div>
          </div>

          {error ? (
            <div className="m-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {loading ? (
            <div className="p-10 text-center text-sm text-slate-500">
              Duke ngarkuar kërkesat...
            </div>
          ) : requests.length === 0 ? (
            <div className="p-10 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Swords size={23} />
              </div>

              <h2 className="mt-4 font-semibold text-slate-900">
                Nuk ka kërkesa
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {activeTab ===
                "received"
                  ? "Nuk ke marrë ende kërkesa nga akademi të tjera."
                  : "Nuk ke dërguar ende kërkesa për ndeshje."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {requests.map(
                (request) => {
                  const otherAcademy =
                    activeTab ===
                    "received"
                      ? request
                          .requesterAcademy
                      : request
                          .opponentAcademy;

                  const ourTeam =
                    activeTab ===
                    "received"
                      ? request
                          .opponentTeam
                      : request
                          .requesterTeam;

                  const otherTeam =
                    activeTab ===
                    "received"
                      ? request
                          .requesterTeam
                      : request
                          .opponentTeam;

                  return (
                    <article
                      key={request.id}
                      className="p-5 sm:p-6"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-base font-bold text-slate-950">
                              {
                                otherAcademy.name
                              }
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(
                                request.status
                              )}`}
                            >
                              {statusLabel(
                                request.status
                              )}
                            </span>
                          </div>

                          <p className="mt-2 text-sm font-medium text-slate-700">
                            {ourTeam.name}
                            <span className="mx-2 text-slate-300">
                              vs
                            </span>
                            {otherTeam.name}
                          </p>

                          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1.5">
                              <CalendarDays
                                size={15}
                              />
                              {formatDate(
                                request.startsAt
                              )}
                            </span>

                            <span className="inline-flex items-center gap-1.5">
                              <Clock3
                                size={15}
                              />
                              {formatTime(
                                request.startsAt
                              )}
                            </span>

                            {request.location ? (
                              <span className="inline-flex items-center gap-1.5">
                                <MapPin
                                  size={15}
                                />
                                {
                                  request.location
                                }
                              </span>
                            ) : null}
                          </div>

                          <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              {matchTypeLabel(
                                request.matchType
                              )}
                            </span>

                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                              {
                                request
                                  .requesterIsHome
                                  ? "Dërguesi vendas"
                                  : "Marrësi vendas"
                              }
                            </span>

                            {request
                              .competitionName ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
                                {
                                  request
                                    .competitionName
                                }
                              </span>
                            ) : null}
                          </div>

                          {request.message ? (
                            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">
                              {
                                request.message
                              }
                            </p>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 flex-wrap items-center gap-2">
                          {request.status ===
                            "PENDING" &&
                          activeTab ===
                            "received" ? (
                            <>
                              <button
                                type="button"
                                onClick={() =>
                                  void handleAction(
                                    request.id,
                                    "accept"
                                  )
                                }
                                disabled={
                                  activeAction !==
                                  null
                                }
                                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {activeAction
                                  ?.requestId ===
                                    request.id &&
                                activeAction
                                  .action ===
                                  "accept"
                                  ? "Duke pranuar..."
                                  : "Prano"}
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  void handleAction(
                                    request.id,
                                    "reject"
                                  )
                                }
                                disabled={
                                  activeAction !==
                                  null
                                }
                                className="rounded-xl border border-red-200 bg-white px-3.5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {activeAction
                                  ?.requestId ===
                                    request.id &&
                                activeAction
                                  .action ===
                                  "reject"
                                  ? "Duke refuzuar..."
                                  : "Refuzo"}
                              </button>
                            </>
                          ) : null}

                          {request.status ===
                            "PENDING" &&
                          activeTab === "sent" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void handleAction(
                                  request.id,
                                  "cancel"
                                )
                              }
                              disabled={
                                activeAction !==
                                null
                              }
                              className="rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              {activeAction
                                ?.requestId ===
                                  request.id &&
                              activeAction
                                .action ===
                                "cancel"
                                ? "Duke anuluar..."
                                : "Anulo"}
                            </button>
                          ) : null}

                          {request.status ===
                          "ACCEPTED" ? (
                            <CheckCircle2
                              size={20}
                              className="text-emerald-600"
                            />
                          ) : request.status ===
                            "REJECTED" ? (
                            <XCircle
                              size={20}
                              className="text-red-500"
                            />
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                }
              )}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}