import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { AthleteLineupPitch } from "@/components/sportist/athlete-lineup-pitch";
import { prisma } from "@/lib/prisma";

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("sq-AL", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Europe/Tirane",
  }).format(value);
}

function statusLabel(status: string) {
  switch (status) {
    case "SCHEDULED":
      return "E planifikuar";
    case "COMPLETED":
      return "E përfunduar";
    case "POSTPONED":
      return "E shtyrë";
    case "CANCELLED":
      return "E anuluar";
    default:
      return status;
  }
}

function matchTypeLabel(type: string) {
  switch (type) {
    case "FRIENDLY":
      return "Miqësore";
    case "LEAGUE":
      return "Kampionat";
    case "CUP":
      return "Kupë";
    case "TOURNAMENT":
      return "Turne";
    default:
      return "Tjetër";
  }
}

function eventLabel(type: string) {
  switch (type) {
    case "GOAL":
      return "Gol";
    case "ASSIST":
      return "Asist";
    case "YELLOW_CARD":
      return "Karton i verdhë";
    case "RED_CARD":
      return "Karton i kuq";
    case "SUBSTITUTION_IN":
      return "Hyrje në lojë";
    case "SUBSTITUTION_OUT":
      return "Dalje nga loja";
    default:
      return type;
  }
}

function eventIcon(type: string) {
  switch (type) {
    case "GOAL":
      return "⚽";
    case "ASSIST":
      return "🎯";
    case "YELLOW_CARD":
      return "🟨";
    case "RED_CARD":
      return "🟥";
    case "SUBSTITUTION_IN":
      return "🔼";
    case "SUBSTITUTION_OUT":
      return "🔽";
    default:
      return "•";
  }
}

type PageProps = {
  params: Promise<{
    matchId: string;
  }>;
};

export default async function AthleteMatchDetailPage({
  params,
}: PageProps) {
  const { matchId } = await params;

  const access = await requireAthleteAccess();

  if (!access.ok) {
    if (access.response.status === 401) {
      redirect(
        `/hyrje?next=/sportist/ndeshjet/${matchId}`
      );
    }

    redirect("/");
  }

  const activeTeams = await prisma.teamPlayer.findMany({
    where: {
      playerId: access.playerId,
      isActive: true,

      team: {
        academyId: access.academyId,
        status: "ACTIVE",
      },
    },

    select: {
      team: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  const activeTeamIds = activeTeams.map(
    ({ team }) => team.id
  );

  const match = await prisma.match.findFirst({
    where: {
      id: matchId,
      academyId: access.academyId,

      teamId: {
        in: activeTeamIds,
      },
    },

    select: {
      id: true,
      opponentName: true,
      matchType: true,
      status: true,
      startsAt: true,
      endsAt: true,
      location: true,
      isHome: true,
      ourScore: true,
      opponentScore: true,
      competitionName: true,
      round: true,
      description: true,
      lineupFormation: true,
      lineupPublishedAt: true,

      team: {
        select: {
          id: true,
          name: true,
        },
      },

      facility: {
        select: {
          id: true,
          name: true,
        },
      },

      matchPlayers: {
        select: {
          id: true,
          playerId: true,
          role: true,
          lineupSlot: true,
          jerseyNumber: true,
          position: true,
          minutesPlayed: true,

          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              position: true,
              jerseyNumber: true,
            },
          },
        },

        orderBy: [
          {
            role: "asc",
          },
          {
            player: {
              firstName: "asc",
            },
          },
        ],
      },

      events: {
        select: {
          id: true,
          playerId: true,
          type: true,
          minute: true,
          extraMinute: true,

          player: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              jerseyNumber: true,
            },
          },
        },

        orderBy: [
          {
            minute: "asc",
          },
          {
            extraMinute: "asc",
          },
        ],
      },
    },
  });

  if (!match) {
    notFound();
  }

  const athletePerformance =
    await prisma.playerMatchPerformance.findFirst({
      where: {
        matchId: match.id,
        playerId: access.playerId,
      },

      select: {
        shots: true,
        shotsOnTarget: true,
        passesAttempted: true,
        passesCompleted: true,
        dribblesAttempted: true,
        dribblesCompleted: true,
        duelsWon: true,
        tackles: true,
        interceptions: true,
        foulsCommitted: true,
        foulsWon: true,
        coachRating: true,
      },
    });

  const athleteMatchPlayer =
    match.matchPlayers.find(
      (item) => item.playerId === access.playerId
    ) ?? null;

  const lineupIsPublished =
    Boolean(
      match.lineupPublishedAt &&
        match.lineupFormation
    );

  const starters = match.matchPlayers.filter(
    (item) => item.role === "STARTER"
  );

  const substitutes = match.matchPlayers.filter(
    (item) => item.role === "SUBSTITUTE"
  );

  const homeName = match.isHome
    ? match.team.name
    : match.opponentName;

  const awayName = match.isHome
    ? match.opponentName
    : match.team.name;

  const homeScore = match.isHome
    ? match.ourScore
    : match.opponentScore;

  const awayScore = match.isHome
    ? match.opponentScore
    : match.ourScore;

  const athleteEvents = match.events.filter(
    (event) => event.playerId === access.playerId
  );

  const athleteGoals = athleteEvents.filter(
    (event) => event.type === "GOAL"
  ).length;

  const athleteAssists = athleteEvents.filter(
    (event) => event.type === "ASSIST"
  ).length;

  const athleteYellowCards = athleteEvents.filter(
    (event) => event.type === "YELLOW_CARD"
  ).length;

  const athleteRedCards = athleteEvents.filter(
    (event) => event.type === "RED_CARD"
  ).length;

  const passAccuracy =
    athletePerformance &&
    athletePerformance.passesAttempted > 0
      ? Math.round(
          (athletePerformance.passesCompleted /
            athletePerformance.passesAttempted) *
            100
        )
      : null;

  const dribbleAccuracy =
    athletePerformance &&
    athletePerformance.dribblesAttempted > 0
      ? Math.round(
          (athletePerformance.dribblesCompleted /
            athletePerformance.dribblesAttempted) *
            100
        )
      : null;

  return (
    <div className="space-y-6">
      <Link
        href="/sportist/ndeshjet"
        className="inline-flex text-sm font-medium text-slate-600 hover:text-slate-950"
      >
        ← Kthehu te ndeshjet
      </Link>

      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
            {match.competitionName ||
              matchTypeLabel(String(match.matchType))}
          </p>

          {match.round ? (
            <p className="mt-1 text-sm text-slate-500">
              {match.round}
            </p>
          ) : null}

          <p className="mt-2 text-sm text-slate-600">
            {formatDateTime(match.startsAt)}
          </p>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4 px-5 py-8">
          <div className="text-right">
            <p className="text-lg font-bold text-slate-950 sm:text-2xl">
              {homeName}
            </p>
          </div>

          <div className="min-w-[110px] text-center">
            {match.status === "COMPLETED" ? (
              <div className="rounded-2xl bg-slate-950 px-5 py-3 text-2xl font-bold text-white sm:text-3xl">
                {homeScore ?? "-"} : {awayScore ?? "-"}
              </div>
            ) : (
              <div className="rounded-2xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-700">
                VS
              </div>
            )}

            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {statusLabel(String(match.status))}
            </p>
          </div>

          <div>
            <p className="text-lg font-bold text-slate-950 sm:text-2xl">
              {awayName}
            </p>
          </div>
        </div>

        <div className="border-t border-slate-100 px-5 py-4 text-center text-sm text-slate-500">
          {match.facility?.name ||
            match.location ||
            "Vendndodhja nuk është përcaktuar"}
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Ngjarjet e ndeshjes
          </h2>

          {match.events.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">
              Ende nuk ka ngjarje të regjistruara për këtë ndeshje.
            </p>
          ) : (
            <div className="mt-5 space-y-3">
              {match.events.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center gap-4 rounded-xl border border-slate-100 bg-slate-50 p-4"
                >
                  <div className="w-14 shrink-0 text-center text-sm font-bold text-slate-700">
                    {event.minute}'
                    {event.extraMinute
                      ? `+${event.extraMinute}`
                      : ""}
                  </div>

                  <div className="text-xl">
                    {eventIcon(String(event.type))}
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-slate-950">
                      {event.player.firstName}{" "}
                      {event.player.lastName}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {eventLabel(String(event.type))}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-xl font-semibold text-slate-950">
            Informacioni
          </h2>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Ekipi</dt>
              <dd className="text-right font-medium">
                {match.team.name}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Lloji</dt>
              <dd className="text-right font-medium">
                {matchTypeLabel(String(match.matchType))}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Statusi</dt>
              <dd className="text-right font-medium">
                {statusLabel(String(match.status))}
              </dd>
            </div>

            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">
                Fusha
              </dt>
              <dd className="text-right font-medium">
                {match.facility?.name ||
                  match.location ||
                  "—"}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Formacioni
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Formacioni bëhet i dukshëm pasi stafi ta publikojë.
            </p>
          </div>

          {!athleteMatchPlayer ? (
            <span className="w-fit rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-600">
              Nuk je grumbulluar
            </span>
          ) : !lineupIsPublished ? (
            <span className="w-fit rounded-full bg-violet-50 px-3 py-1.5 text-xs font-semibold text-violet-700">
              I grumbulluar
            </span>
          ) : athleteMatchPlayer.role === "STARTER" ? (
            <span className="w-fit rounded-full bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700">
              Titullar
            </span>
          ) : (
            <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700">
              Zëvendësues
            </span>
          )}
        </div>

        {match.matchPlayers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Ende nuk është regjistruar grumbullimi i kësaj ndeshjeje.
          </p>
        ) : !lineupIsPublished ? (
          <div className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-5">
            <p className="text-sm font-semibold text-slate-700">
              Formacioni nuk është publikuar ende.
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Je në grumbullim, por pozicioni titullar ose stoli do të shfaqet vetëm pasi stafi ta publikojë formacionin.
            </p>
          </div>
        ) : (
          <AthleteLineupPitch
            formation={match.lineupFormation!}
            players={match.matchPlayers}
            currentPlayerId={access.playerId}
          />
        )}
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Performanca ime
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Përmbledhja dhe statistikat e tua në këtë ndeshje.
            </p>
          </div>

          {athleteMatchPlayer ? (
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                ⚽ {athleteGoals} gol
              </span>

              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
                🎯 {athleteAssists} asist
              </span>

              {athleteYellowCards > 0 ? (
                <span className="rounded-full bg-yellow-50 px-3 py-1 font-medium text-yellow-800">
                  🟨 {athleteYellowCards}
                </span>
              ) : null}

              {athleteRedCards > 0 ? (
                <span className="rounded-full bg-red-50 px-3 py-1 font-medium text-red-700">
                  🟥 {athleteRedCards}
                </span>
              ) : null}

              <span className="rounded-full bg-slate-950 px-3 py-1 font-medium text-white">
                ⏱ {athleteMatchPlayer.minutesPlayed} min
              </span>

              {athletePerformance?.coachRating !== null &&
              athletePerformance?.coachRating !== undefined ? (
                <span className="rounded-full bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
                  ⭐ {Number(
                    athletePerformance.coachRating
                  ).toFixed(1)}
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        {!athleteMatchPlayer ? (
          <p className="mt-4 text-sm text-slate-500">
            Nuk je regjistruar në grumbullimin e kësaj ndeshjeje.
          </p>
        ) : !athletePerformance ? (
          <div className="mt-4">
            <p className="text-sm text-slate-500">
              Ende nuk janë regjistruar statistikat e tua individuale.
            </p>

            <p className="mt-2 text-sm font-medium text-slate-700">
              Minuta të luajtura: {athleteMatchPlayer.minutesPlayed}
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Minuta</p>
              <p className="mt-1 text-xl font-bold">
                {athleteMatchPlayer.minutesPlayed}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Goditje</p>
              <p className="mt-1 text-xl font-bold">
                {athletePerformance.shots}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Në portë</p>
              <p className="mt-1 text-xl font-bold">
                {athletePerformance.shotsOnTarget}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Vlerësimi</p>
              <p className="mt-1 text-xl font-bold">
                {athletePerformance.coachRating === null
                  ? "—"
                  : Number(
                      athletePerformance.coachRating
                    ).toFixed(1)}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Pasime</p>

              <p className="mt-1 text-lg font-bold">
                {athletePerformance.passesCompleted}/
                {athletePerformance.passesAttempted}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {passAccuracy === null
                  ? "Pa tentativa"
                  : `${passAccuracy}% saktësi`}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Driblime</p>

              <p className="mt-1 text-lg font-bold">
                {athletePerformance.dribblesCompleted}/
                {athletePerformance.dribblesAttempted}
              </p>

              <p className="mt-1 text-xs text-slate-500">
                {dribbleAccuracy === null
                  ? "Pa tentativa"
                  : `${dribbleAccuracy}% sukses`}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Duele të fituara
              </p>

              <p className="mt-1 text-xl font-bold">
                {athletePerformance.duelsWon}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">Ndërhyrje</p>

              <p className="mt-1 text-xl font-bold">
                {athletePerformance.tackles}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Interceptime
              </p>

              <p className="mt-1 text-xl font-bold">
                {athletePerformance.interceptions}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Faulle të kryera
              </p>

              <p className="mt-1 text-xl font-bold">
                {athletePerformance.foulsCommitted}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs text-slate-500">
                Faulle të fituara
              </p>

              <p className="mt-1 text-xl font-bold">
                {athletePerformance.foulsWon}
              </p>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
