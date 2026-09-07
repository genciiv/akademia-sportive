"use client";

import { useEffect, useState } from "react";
import {
  Pencil,
  RefreshCw,
  Trash2,
  X,
} from "lucide-react";

type PerformanceData = {
  id: string;
  shots: number;
  shotsOnTarget: number;
  passesAttempted: number;
  passesCompleted: number;
  dribblesAttempted: number;
  dribblesCompleted: number;
  duelsWon: number;
  tackles: number;
  interceptions: number;
  foulsCommitted: number;
  foulsWon: number;
  coachRating: number | null;
  coachNotes: string | null;
};

type PerformancePlayer = {
  matchPlayerId: string;
  playerId: string;
  role: "STARTER" | "SUBSTITUTE";
  minutesPlayed: number;
  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    jerseyNumber: number | null;
  };
  performance: PerformanceData | null;
};

type Props = {
  matchId: string;
};

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

const EMPTY_FORM = {
  shots: "0",
  shotsOnTarget: "0",
  passesAttempted: "0",
  passesCompleted: "0",
  dribblesAttempted: "0",
  dribblesCompleted: "0",
  duelsWon: "0",
  tackles: "0",
  interceptions: "0",
  foulsCommitted: "0",
  foulsWon: "0",
  coachRating: "",
  coachNotes: "",
};

export function PerformanceSection({
  matchId,
}: Props) {
  const [players, setPlayers] =
    useState<PerformancePlayer[]>([]);

  const [dukeNgarkuar, setDukeNgarkuar] =
    useState(true);

  const [dukeRuajtur, setDukeRuajtur] =
    useState(false);

  const [dukeFshire, setDukeFshire] =
    useState(false);

  const [performancePerFshirje, setPerformancePerFshirje] =
    useState<PerformancePlayer | null>(null);

  const [gabimi, setGabimi] =
    useState("");

  const [playerNeEditim, setPlayerNeEditim] =
    useState<PerformancePlayer | null>(null);

  const [form, setForm] =
    useState(EMPTY_FORM);

  async function merrPerformancen() {
    setDukeNgarkuar(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${matchId}/performance`,
        {
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Performanca nuk mund të ngarkohej."
        );
        return;
      }

      setPlayers(data.players || []);
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ngarkimit të performancës."
      );
    } finally {
      setDukeNgarkuar(false);
    }
  }

  useEffect(() => {
    void merrPerformancen();
  }, [matchId]);

  function hapEditimin(
    player: PerformancePlayer
  ) {
    const performance =
      player.performance;

    setPlayerNeEditim(player);

    setForm({
      shots: String(
        performance?.shots ?? 0
      ),
      shotsOnTarget: String(
        performance?.shotsOnTarget ?? 0
      ),
      passesAttempted: String(
        performance?.passesAttempted ?? 0
      ),
      passesCompleted: String(
        performance?.passesCompleted ?? 0
      ),
      dribblesAttempted: String(
        performance?.dribblesAttempted ?? 0
      ),
      dribblesCompleted: String(
        performance?.dribblesCompleted ?? 0
      ),
      duelsWon: String(
        performance?.duelsWon ?? 0
      ),
      tackles: String(
        performance?.tackles ?? 0
      ),
      interceptions: String(
        performance?.interceptions ?? 0
      ),
      foulsCommitted: String(
        performance?.foulsCommitted ?? 0
      ),
      foulsWon: String(
        performance?.foulsWon ?? 0
      ),
      coachRating:
        performance?.coachRating === null ||
        performance?.coachRating === undefined
          ? ""
          : String(
              performance.coachRating
            ),
      coachNotes:
        performance?.coachNotes || "",
    });

    setGabimi("");
  }

  function mbyllEditimin() {
    setPlayerNeEditim(null);
    setForm(EMPTY_FORM);
    setGabimi("");
  }

  function ndrysho(
    field: keyof typeof EMPTY_FORM,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function ruajPerformancen() {
    if (!playerNeEditim) {
      return;
    }

    setDukeRuajtur(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${matchId}/performance`,
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            playerId:
              playerNeEditim.playerId,

            shots: form.shots,
            shotsOnTarget:
              form.shotsOnTarget,

            passesAttempted:
              form.passesAttempted,
            passesCompleted:
              form.passesCompleted,

            dribblesAttempted:
              form.dribblesAttempted,
            dribblesCompleted:
              form.dribblesCompleted,

            duelsWon:
              form.duelsWon,

            tackles:
              form.tackles,

            interceptions:
              form.interceptions,

            foulsCommitted:
              form.foulsCommitted,

            foulsWon:
              form.foulsWon,

            coachRating:
              form.coachRating,

            coachNotes:
              form.coachNotes,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Performanca nuk mund të ruhej."
        );
        return;
      }

      await merrPerformancen();
      mbyllEditimin();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë ruajtjes së performancës."
      );
    } finally {
      setDukeRuajtur(false);
    }
  }

  async function fshiPerformancen() {
    if (!performancePerFshirje) {
      return;
    }

    setDukeFshire(true);
    setGabimi("");

    try {
      const response = await fetch(
        `/api/matches/${matchId}/performance`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            playerId:
              performancePerFshirje.playerId,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setGabimi(
          data.error ||
            "Performanca nuk mund të fshihej."
        );
        return;
      }

      setPerformancePerFshirje(null);

      await merrPerformancen();
    } catch {
      setGabimi(
        "Ndodhi një problem gjatë fshirjes së performancës."
      );
    } finally {
      setDukeFshire(false);
    }
  }
  return (
    <>
      <div className="border-t border-slate-100 p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">
              Performanca e sportistëve
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Regjistro statistikat teknike dhe vlerësimin e trajnerit.
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              void merrPerformancen()
            }
            disabled={dukeNgarkuar}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} />
            Rifresko
          </button>
        </div>

        {gabimi && !playerNeEditim && (
          <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {gabimi}
          </div>
        )}

        <div className="mt-5">
          {dukeNgarkuar ? (
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-500">
              Duke ngarkuar performancën...
            </div>
          ) : players.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-sm text-slate-500">
              Nuk ka sportistë të grumbulluar për këtë ndeshje.
            </div>
          ) : (
            <div className="space-y-3">
              {players.map((player) => {
                const p =
                  player.performance;

                const passing =
                  p &&
                  p.passesAttempted > 0
                    ? Math.round(
                        (p.passesCompleted /
                          p.passesAttempted) *
                          100
                      )
                    : null;

                return (
                  <div
                    key={player.playerId}
                    className="rounded-2xl border border-slate-200 bg-white p-4"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-bold text-slate-950">
                            {
                              player.player
                                .firstName
                            }{" "}
                            {
                              player.player
                                .lastName
                            }
                          </p>

                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                            {player.role ===
                            "STARTER"
                              ? "Titullar"
                              : "Rezervë"}
                          </span>

                          <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                            {
                              player.minutesPlayed
                            }{" "}
                            min
                          </span>

                          {p?.coachRating !==
                            null &&
                            p?.coachRating !==
                              undefined && (
                              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-700">
                                Nota{" "}
                                {
                                  p.coachRating
                                }
                                /10
                              </span>
                            )}
                        </div>

                        {player.player.position && (
                          <p className="mt-1 text-xs text-slate-500">
                            {
                              player.player
                                .position
                            }
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            hapEditimin(player)
                          }
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          <Pencil size={15} />
                          {p
                            ? "Edito performancën"
                            : "Shto performancën"}
                        </button>

                        {p && (
                          <button
                            type="button"
                            onClick={() =>
                              setPerformancePerFshirje(
                                player
                              )
                            }
                            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-red-100 text-red-600 transition hover:bg-red-50"
                            aria-label="Fshi performancën"
                            title="Fshi performancën"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </div>

                    {p ? (
                      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5">
                        <Kuti
                          etiketa="Goditje"
                          vlera={p.shots}
                        />
                        <Kuti
                          etiketa="Në portë"
                          vlera={
                            p.shotsOnTarget
                          }
                        />
                        <Kuti
                          etiketa="Pasime të sakta"
                          vlera={`${p.passesCompleted}/${p.passesAttempted}`}
                        />
                        <Kuti
                          etiketa="Saktësia"
                          vlera={
                            passing === null
                              ? "-"
                              : `${passing}%`
                          }
                        />
                        <Kuti
                          etiketa="Driblime"
                          vlera={`${p.dribblesCompleted}/${p.dribblesAttempted}`}
                        />
                        <Kuti
                          etiketa="Duele fituar"
                          vlera={p.duelsWon}
                        />
                        <Kuti
                          etiketa="Ndërhyrje"
                          vlera={p.tackles}
                        />
                        <Kuti
                          etiketa="Interceptime"
                          vlera={
                            p.interceptions
                          }
                        />
                        <Kuti
                          etiketa="Faulle kryera"
                          vlera={
                            p.foulsCommitted
                          }
                        />
                        <Kuti
                          etiketa="Faulle fituara"
                          vlera={p.foulsWon}
                        />
                      </div>
                    ) : (
                      <div className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-500">
                        Ende nuk ka performancë të regjistruar.
                      </div>
                    )}

                    {p?.coachNotes && (
                      <div className="mt-3 rounded-xl bg-slate-50 px-4 py-3">
                        <p className="text-xs font-semibold text-slate-500">
                          Shënimet e trajnerit
                        </p>

                        <p className="mt-1 text-sm text-slate-700">
                          {p.coachNotes}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {playerNeEditim && (
        <div className="fixed inset-0 z-[100] bg-slate-950/45 backdrop-blur-[2px]">
          <div className="absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col bg-white shadow-2xl">
            <div className="shrink-0 flex items-start justify-between border-b border-slate-100 bg-white px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-950">
                  Regjistro performancën
                </h2>

                <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                  <span>
                    {playerNeEditim.player.firstName}{" "}
                    {playerNeEditim.player.lastName}
                  </span>

                  <span>•</span>

                  <span>
                    {playerNeEditim.role === "STARTER"
                      ? "Titullar"
                      : "Rezervë"}
                  </span>

                  <span>•</span>

                  <span>
                    {playerNeEditim.minutesPlayed} min
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={mbyllEditimin}
                className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100"
                aria-label="Mbyll"
              >
                <X size={20} />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
              {gabimi && (
                <div className="mb-5 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {gabimi}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <FushaNumerike
                  etiketa="Goditje totale"
                  value={form.shots}
                  onChange={(value) =>
                    ndrysho(
                      "shots",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Goditje në portë"
                  value={
                    form.shotsOnTarget
                  }
                  onChange={(value) =>
                    ndrysho(
                      "shotsOnTarget",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Pasime totale"
                  value={
                    form.passesAttempted
                  }
                  onChange={(value) =>
                    ndrysho(
                      "passesAttempted",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Pasime të sakta"
                  value={
                    form.passesCompleted
                  }
                  onChange={(value) =>
                    ndrysho(
                      "passesCompleted",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Driblime të tentuara"
                  value={
                    form.dribblesAttempted
                  }
                  onChange={(value) =>
                    ndrysho(
                      "dribblesAttempted",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Driblime të suksesshme"
                  value={
                    form.dribblesCompleted
                  }
                  onChange={(value) =>
                    ndrysho(
                      "dribblesCompleted",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Duele të fituara"
                  value={form.duelsWon}
                  onChange={(value) =>
                    ndrysho(
                      "duelsWon",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Ndërhyrje"
                  value={form.tackles}
                  onChange={(value) =>
                    ndrysho(
                      "tackles",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Interceptime"
                  value={
                    form.interceptions
                  }
                  onChange={(value) =>
                    ndrysho(
                      "interceptions",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Faulle të kryera"
                  value={
                    form.foulsCommitted
                  }
                  onChange={(value) =>
                    ndrysho(
                      "foulsCommitted",
                      value
                    )
                  }
                />

                <FushaNumerike
                  etiketa="Faulle të fituara"
                  value={form.foulsWon}
                  onChange={(value) =>
                    ndrysho(
                      "foulsWon",
                      value
                    )
                  }
                />

                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Vlerësimi i trajnerit
                  </label>

                  <input
                    type="number"
                    min="1"
                    max="10"
                    step="0.1"
                    value={
                      form.coachRating
                    }
                    onChange={(event) =>
                      ndrysho(
                        "coachRating",
                        event.target.value
                      )
                    }
                    placeholder="P.sh. 8.5"
                    className={inputClass}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                  Shënimet e trajnerit
                </label>

                <textarea
                  rows={4}
                  maxLength={2000}
                  value={form.coachNotes}
                  onChange={(event) =>
                    ndrysho(
                      "coachNotes",
                      event.target.value
                    )
                  }
                  placeholder="Shkruaj vlerësimin e trajnerit..."
                  className={inputClass}
                />
              </div>
            </div>

            <div className="shrink-0 flex justify-end gap-2 border-t border-slate-100 bg-white p-6">
              <button
                type="button"
                onClick={mbyllEditimin}
                disabled={dukeRuajtur}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={() =>
                  void ruajPerformancen()
                }
                disabled={dukeRuajtur}
                className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {dukeRuajtur
                  ? "Duke ruajtur..."
                  : "Ruaj performancën"}
              </button>
            </div>
          </div>
        </div>
      )}
      {performancePerFshirje && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-[2px]">
          <div className="w-full max-w-md rounded-[24px] bg-white p-6 shadow-2xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-600">
              <Trash2 size={22} />
            </div>

            <h2 className="mt-5 text-lg font-bold text-slate-950">
              Fshi performancën?
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Performanca e{" "}
              <span className="font-semibold text-slate-700">
                {
                  performancePerFshirje.player
                    .firstName
                }{" "}
                {
                  performancePerFshirje.player
                    .lastName
                }
              </span>{" "}
              do të fshihet nga kjo ndeshje.
            </p>

            <p className="mt-2 text-xs text-slate-400">
              Grumbullimi, minutat dhe ngjarjet e ndeshjes nuk do të preken.
            </p>

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setPerformancePerFshirje(
                    null
                  )
                }
                disabled={dukeFshire}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Anulo
              </button>

              <button
                type="button"
                onClick={() =>
                  void fshiPerformancen()
                }
                disabled={dukeFshire}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
              >
                <Trash2 size={15} />

                {dukeFshire
                  ? "Duke fshirë..."
                  : "Fshi performancën"}
              </button>
            </div>
          </div>
        </div>
      )}    </>
  );
}

function Kuti({
  etiketa,
  vlera,
}: {
  etiketa: string;
  vlera: string | number;
}) {
  return (
    <div className="min-h-[86px] rounded-2xl border border-slate-100 bg-slate-50 p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {etiketa}
      </p>

      <p className="mt-1 text-lg font-bold text-slate-950">
        {vlera}
      </p>
    </div>
  );
}

function FushaNumerike({
  etiketa,
  value,
  onChange,
}: {
  etiketa: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-slate-700">
        {etiketa}
      </label>

      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
        className={inputClass}
      />
    </div>
  );
}