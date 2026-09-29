"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

type TeamOption = {
  id: string;
  name: string;
  sport: string;
  ageGroup: string | null;
};

type OpponentAcademy = {
  id: string;
  name: string;
  city: string | null;
  teams: TeamOption[];
};

type OptionsResponse = {
  requesterTeams?: TeamOption[];
  opponentAcademies?: OpponentAcademy[];
  error?: string;
};

type CreateResponse = {
  matchRequest?: {
    id: string;
  };
  error?: string;
};

type Props = {
  onCreated: () => void | Promise<void>;
};

export default function InterAcademyRequestForm({
  onCreated,
}: Props) {
  const [
    requesterTeams,
    setRequesterTeams,
  ] = useState<TeamOption[]>([]);

  const [
    opponentAcademies,
    setOpponentAcademies,
  ] = useState<OpponentAcademy[]>([]);

  const [
    requesterTeamId,
    setRequesterTeamId,
  ] = useState("");

  const [
    opponentAcademyId,
    setOpponentAcademyId,
  ] = useState("");

  const [
    opponentTeamId,
    setOpponentTeamId,
  ] = useState("");

  const [
    startsAt,
    setStartsAt,
  ] = useState("");

  const [
    requesterIsHome,
    setRequesterIsHome,
  ] = useState(true);

  const [
    matchType,
    setMatchType,
  ] = useState("FRIENDLY");

  const [
    location,
    setLocation,
  ] = useState("");

  const [
    competitionName,
    setCompetitionName,
  ] = useState("");

  const [
    round,
    setRound,
  ] = useState("");

  const [
    message,
    setMessage,
  ] = useState("");

  const [
    loadingOptions,
    setLoadingOptions,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const [
    success,
    setSuccess,
  ] = useState("");

  useEffect(() => {
    async function loadOptions() {
      setLoadingOptions(true);
      setError("");

      try {
        const response = await fetch(
          "/api/inter-academy-match-options",
          {
            cache: "no-store",
          }
        );

        const data =
          (await response.json()) as OptionsResponse;

        if (!response.ok) {
          setError(
            data.error ||
              "Opsionet e ndeshjes nuk mund te ngarkoheshin."
          );
          return;
        }

        setRequesterTeams(
          Array.isArray(data.requesterTeams)
            ? data.requesterTeams
            : []
        );

        setOpponentAcademies(
          Array.isArray(data.opponentAcademies)
            ? data.opponentAcademies
            : []
        );
      } catch {
        setError(
          "Ndodhi nje problem gjate ngarkimit te opsioneve."
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
  }, []);

  const requesterTeam =
    useMemo(
      () =>
        requesterTeams.find(
          (team) =>
            team.id === requesterTeamId
        ) ?? null,
      [
        requesterTeamId,
        requesterTeams,
      ]
    );

  const selectedAcademy =
    useMemo(
      () =>
        opponentAcademies.find(
          (academy) =>
            academy.id === opponentAcademyId
        ) ?? null,
      [
        opponentAcademyId,
        opponentAcademies,
      ]
    );

  const opponentTeams =
    useMemo(() => {
      if (!selectedAcademy) {
        return [];
      }

      if (!requesterTeam) {
        return selectedAcademy.teams;
      }

      return selectedAcademy.teams.filter(
        (team) =>
          team.sport === requesterTeam.sport
      );
    }, [
      requesterTeam,
      selectedAcademy,
    ]);

  function resetForm() {
    setRequesterTeamId("");
    setOpponentAcademyId("");
    setOpponentTeamId("");
    setStartsAt("");
    setRequesterIsHome(true);
    setMatchType("FRIENDLY");
    setLocation("");
    setCompetitionName("");
    setRound("");
    setMessage("");
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    if (
      !requesterTeamId ||
      !opponentAcademyId ||
      !opponentTeamId ||
      !startsAt
    ) {
      setError(
        "Ploteso ekipin tend, akademine kundershtare, ekipin dhe daten."
      );
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch(
        "/api/inter-academy-match-requests",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            requesterTeamId,
            opponentAcademyId,
            opponentTeamId,
            startsAt,
            requesterIsHome,
            matchType,
            location:
              location.trim() || null,
            competitionName:
              competitionName.trim() ||
              null,
            round:
              round.trim() || null,
            message:
              message.trim() || null,
          }),
        }
      );

      const data =
        (await response.json()) as CreateResponse;

      if (!response.ok) {
        setError(
          data.error ||
            "Kerkesa nuk mund te dergohej."
        );
        return;
      }

      resetForm();

      setSuccess(
        "Kerkesa inter-akademi u dergua me sukses."
      );

      await onCreated();
    } catch {
      setError(
        "Ndodhi nje problem gjate dergimit te kerkeses."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div>
        <h2 className="text-lg font-bold text-slate-950">
          {"K\u00ebrkes\u00eb e re inter-akademi"}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {"Zgjidh ekipin, akademin\u00eb kund\u00ebrshtare dhe orarin e ndeshjes."}
        </p>
      </div>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      {loadingOptions ? (
        <div className="mt-5 text-sm text-slate-500">
          Duke ngarkuar opsionet...
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="mt-5 grid gap-4 md:grid-cols-2"
        >
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Ekipi yt
            </span>

            <select
              value={requesterTeamId}
              onChange={(event) => {
                setRequesterTeamId(
                  event.target.value
                );
                setOpponentTeamId("");
              }}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">
                Zgjidh ekipin
              </option>

              {requesterTeams.map(
                (team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                    {team.ageGroup
                      ? ` - ${team.ageGroup}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Akademia kundershtare
            </span>

            <select
              value={opponentAcademyId}
              onChange={(event) => {
                setOpponentAcademyId(
                  event.target.value
                );
                setOpponentTeamId("");
              }}
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="">
                Zgjidh akademine
              </option>

              {opponentAcademies.map(
                (academy) => (
                  <option
                    key={academy.id}
                    value={academy.id}
                  >
                    {academy.name}
                    {academy.city
                      ? ` - ${academy.city}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Ekipi kundershtar
            </span>

            <select
              value={opponentTeamId}
              onChange={(event) =>
                setOpponentTeamId(
                  event.target.value
                )
              }
              required
              disabled={
                !opponentAcademyId
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">
                Zgjidh ekipin
              </option>

              {opponentTeams.map(
                (team) => (
                  <option
                    key={team.id}
                    value={team.id}
                  >
                    {team.name}
                    {team.ageGroup
                      ? ` - ${team.ageGroup}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Data dhe ora
            </span>

            <input
              type="datetime-local"
              value={startsAt}
              onChange={(event) =>
                setStartsAt(
                  event.target.value
                )
              }
              required
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Lloji i ndeshjes
            </span>

            <select
              value={matchType}
              onChange={(event) =>
                setMatchType(
                  event.target.value
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="FRIENDLY">
                Miqesore
              </option>
              <option value="LEAGUE">
                Kampionat
              </option>
              <option value="CUP">
                Kupe
              </option>
              <option value="TOURNAMENT">
                Turne
              </option>
              <option value="OTHER">
                Tjeter
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Skuadra vendase
            </span>

            <select
              value={
                requesterIsHome
                  ? "requester"
                  : "opponent"
              }
              onChange={(event) =>
                setRequesterIsHome(
                  event.target.value ===
                    "requester"
                )
              }
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            >
              <option value="requester">
                Ekipi im
              </option>
              <option value="opponent">
                Ekipi kundershtar
              </option>
            </select>
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Vendndodhja
            </span>

            <input
              type="text"
              value={location}
              onChange={(event) =>
                setLocation(
                  event.target.value
                )
              }
              placeholder="Stadiumi / fusha"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Kompeticioni
            </span>

            <input
              type="text"
              value={competitionName}
              onChange={(event) =>
                setCompetitionName(
                  event.target.value
                )
              }
              placeholder="Opsionale"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Raundi
            </span>

            <input
              type="text"
              value={round}
              onChange={(event) =>
                setRound(
                  event.target.value
                )
              }
              placeholder="Opsional"
              className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="mb-1.5 block text-sm font-semibold text-slate-700">
              Mesazh
            </span>

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              rows={3}
              placeholder="Mesazh per akademine kundershtare..."
              className="w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none focus:border-blue-500"
            />
          </label>

          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Duke derguar..."
                : "Dergo kerkesen"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}