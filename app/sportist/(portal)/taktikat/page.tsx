import { redirect } from "next/navigation";
import {
  Goal,
  Layers3,
  Shield,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";

import { requireAthleteAccess } from "@/lib/athlete-access";
import { AthleteTacticPitch } from "@/components/sportist/athlete-tactic-pitch";
import { prisma } from "@/lib/prisma";

function phaseLabel(value: string) {
  switch (value) {
    case "ATTACK":
      return "Sulm";
    case "DEFENSE":
      return "Mbrojtje";
    case "ATTACK_TRANSITION":
      return "Tranzicion sulmues";
    case "DEFENSE_TRANSITION":
      return "Tranzicion mbrojtës";
    case "SET_PIECE":
      return "Goditje standarde";
    default:
      return value;
  }
}

function phaseClass(value: string) {
  switch (value) {
    case "ATTACK":
      return "bg-emerald-100 text-emerald-700";
    case "DEFENSE":
      return "bg-blue-100 text-blue-700";
    case "ATTACK_TRANSITION":
      return "bg-violet-100 text-violet-700";
    case "DEFENSE_TRANSITION":
      return "bg-cyan-100 text-cyan-700";
    case "SET_PIECE":
      return "bg-amber-100 text-amber-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default async function AthleteTacticsPage() {
  const access =
    await requireAthleteAccess();

  if (!access.ok) {
    if (
      access.response.status === 401
    ) {
      redirect(
        "/hyrje?next=/sportist/taktikat"
      );
    }

    redirect("/");
  }

  const player =
    await prisma.player.findFirst({
      where: {
        id: access.playerId,
        academyId:
          access.academyId,
      },

      select: {
        firstName: true,
        lastName: true,

        teams: {
          where: {
            isActive: true,
          },

          select: {
            team: {
              select: {
                id: true,
                name: true,
                status: true,
              },
            },
          },
        },
      },
    });

  if (!player) {
    redirect("/");
  }

  const activeTeams =
    player.teams.filter(
      ({ team }) =>
        team.status === "ACTIVE"
    );

  const activeTeamIds =
    activeTeams.map(
      ({ team }) =>
        team.id
    );

  const tactics =
    await prisma.tactic.findMany({
          where: {
            academyId:
              access.academyId,

            OR: [
              {
                targetTeams: {
                  none: {},
                },
              },
              ...(activeTeamIds.length > 0
                ? [
                    {
                      targetTeams: {
                        some: {
                          teamId: {
                            in: activeTeamIds,
                          },
                        },
                      },
                    },
                  ]
                : []),
            ],

            isActive: true,
            visibleToPlayers: true,
          },

          orderBy: [
            {
              updatedAt: "desc",
            },
            {
              name: "asc",
            },
          ],

          select: {
            id: true,
            name: true,
            formation: true,
            phase: true,
            sport: true,
            objective: true,
            description: true,
            boardData: true,
            updatedAt: true,

            team: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        });

  const phases =
    new Set(
      tactics.map(
        (tactic) =>
          tactic.phase
      )
    );

  const athleteName =
    `${player.firstName} ${player.lastName}`.trim();

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[26px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-violet-700">
              <Sparkles size={13} />
              Plani i lojës
            </div>

            <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">
              Taktikat
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Taktikat që stafi teknik ka publikuar për ekipet e tua.
              Studio formacionin, fazën dhe objektivin përpara stërvitjeve dhe ndeshjeve.
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                {athleteName}
              </span>

              <span className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700">
                {tactics.length} taktika
              </span>

              <span className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
                {phases.size} faza loje
              </span>
            </div>
          </div>

          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-violet-600 shadow-sm">
            <Goal size={28} />
          </div>
        </div>
      </section>

      {tactics.length === 0 ? (
        <section className="rounded-[22px] border border-slate-200 bg-white p-10 text-center shadow-sm">
          <Layers3
            size={32}
            className="mx-auto text-slate-300"
          />

          <h2 className="mt-4 text-lg font-bold text-slate-900">
            Nuk ka taktika të publikuara
          </h2>

          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
            Taktikat do të shfaqen këtu pasi stafi teknik t&apos;i publikojë për ekipin tënd.
          </p>
        </section>
      ) : (
        <section className="grid gap-5 lg:grid-cols-2">
          {tactics.map(
            (tactic) => (
              <article
                key={tactic.id}
                className="overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 bg-gradient-to-br from-slate-50 to-violet-50 p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={[
                            "rounded-full px-2.5 py-1 text-[10px] font-bold",
                            phaseClass(
                              tactic.phase
                            ),
                          ].join(" ")}
                        >
                          {phaseLabel(
                            tactic.phase
                          )}
                        </span>

                        {tactic.formation ? (
                          <span className="rounded-full bg-white px-2.5 py-1 text-[10px] font-bold text-slate-600 shadow-sm">
                            {tactic.formation}
                          </span>
                        ) : null}
                      </div>

                      <h2 className="mt-3 text-xl font-black text-slate-950">
                        {tactic.name}
                      </h2>

                      <p className="mt-1 text-xs font-semibold text-violet-700">
                        {tactic.team?.name ||
                          "Ekipi"}
                      </p>
                    </div>

                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-violet-600 shadow-sm">
                      <Trophy size={18} />
                    </span>
                  </div>
                </div>

                <div className="p-5">
                  <div className="mb-6 overflow-hidden rounded-[24px] border border-emerald-100 bg-gradient-to-b from-emerald-50/70 to-white p-3 sm:p-4">
                    <div className="mb-3 flex items-center justify-between gap-3 px-1">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.12em] text-emerald-600">
                          Skema taktike
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-slate-500">
                          Pozicionimi në fushë
                        </p>
                      </div>

                      {tactic.formation ? (
                        <span className="rounded-full border border-emerald-200 bg-white px-3 py-1 text-[10px] font-black text-emerald-700 shadow-sm">
                          {tactic.formation}
                        </span>
                      ) : null}
                    </div>

                    <AthleteTacticPitch
                      formation={
                        tactic.formation
                      }
                      boardData={
                        tactic.boardData
                      }
                    />
                  </div>

                  {tactic.objective ? (
                    <div className="rounded-2xl bg-blue-50 p-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-blue-700">
                        <Target size={14} />
                        Objektivi
                      </p>

                      <p className="mt-2 text-sm leading-6 text-slate-700">
                        {tactic.objective}
                      </p>
                    </div>
                  ) : null}

                  {tactic.description ? (
                    <div className="mt-4">
                      <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.08em] text-slate-400">
                        <Shield size={14} />
                        Përshkrimi
                      </p>

                      <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-600">
                        {tactic.description}
                      </p>
                    </div>
                  ) : null}

                  {tactic.sport ? (
                    <p className="mt-5 text-[11px] font-medium text-slate-400">
                      Sporti: {tactic.sport}
                    </p>
                  ) : null}
                </div>
              </article>
            )
          )}
        </section>
      )}
    </div>
  );
}