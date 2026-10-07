type PitchSlot = {
  slot: string;
  x: number;
  y: number;
};

type LineupPlayer = {
  id: string;
  playerId: string;
  role: "STARTER" | "SUBSTITUTE";
  lineupSlot: string | null;
  jerseyNumber: number | null;
  position: string | null;

  player: {
    id: string;
    firstName: string;
    lastName: string;
    position: string | null;
    jerseyNumber: number | null;
  };
};

type AthleteLineupPitchProps = {
  formation: string;
  players: LineupPlayer[];
  currentPlayerId: string;
};

const FORMATION_LAYOUTS: Record<
  string,
  PitchSlot[]
> = {
  "4-3-3": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LB", x: 14, y: 71 },
    { slot: "LCB", x: 38, y: 73 },
    { slot: "RCB", x: 62, y: 73 },
    { slot: "RB", x: 86, y: 71 },
    { slot: "LCM", x: 27, y: 50 },
    { slot: "CM", x: 50, y: 46 },
    { slot: "RCM", x: 73, y: 50 },
    { slot: "LW", x: 18, y: 23 },
    { slot: "ST", x: 50, y: 15 },
    { slot: "RW", x: 82, y: 23 },
  ],

  "4-4-2": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LB", x: 14, y: 71 },
    { slot: "LCB", x: 38, y: 73 },
    { slot: "RCB", x: 62, y: 73 },
    { slot: "RB", x: 86, y: 71 },
    { slot: "LM", x: 15, y: 48 },
    { slot: "LCM", x: 38, y: 51 },
    { slot: "RCM", x: 62, y: 51 },
    { slot: "RM", x: 85, y: 48 },
    { slot: "LST", x: 38, y: 20 },
    { slot: "RST", x: 62, y: 20 },
  ],

  "4-2-3-1": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LB", x: 14, y: 72 },
    { slot: "LCB", x: 38, y: 74 },
    { slot: "RCB", x: 62, y: 74 },
    { slot: "RB", x: 86, y: 72 },
    { slot: "LDM", x: 38, y: 57 },
    { slot: "RDM", x: 62, y: 57 },
    { slot: "LW", x: 20, y: 36 },
    { slot: "CAM", x: 50, y: 39 },
    { slot: "RW", x: 80, y: 36 },
    { slot: "ST", x: 50, y: 15 },
  ],

  "3-5-2": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LCB", x: 25, y: 71 },
    { slot: "CB", x: 50, y: 75 },
    { slot: "RCB", x: 75, y: 71 },
    { slot: "LWB", x: 12, y: 48 },
    { slot: "LCM", x: 34, y: 51 },
    { slot: "CM", x: 50, y: 44 },
    { slot: "RCM", x: 66, y: 51 },
    { slot: "RWB", x: 88, y: 48 },
    { slot: "LST", x: 38, y: 19 },
    { slot: "RST", x: 62, y: 19 },
  ],

  "5-3-2": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LWB", x: 10, y: 67 },
    { slot: "LCB", x: 30, y: 73 },
    { slot: "CB", x: 50, y: 76 },
    { slot: "RCB", x: 70, y: 73 },
    { slot: "RWB", x: 90, y: 67 },
    { slot: "LCM", x: 30, y: 47 },
    { slot: "CM", x: 50, y: 42 },
    { slot: "RCM", x: 70, y: 47 },
    { slot: "LST", x: 38, y: 18 },
    { slot: "RST", x: 62, y: 18 },
  ],

  "4-5-1": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LB", x: 14, y: 72 },
    { slot: "LCB", x: 38, y: 74 },
    { slot: "RCB", x: 62, y: 74 },
    { slot: "RB", x: 86, y: 72 },
    { slot: "LM", x: 12, y: 46 },
    { slot: "LCM", x: 31, y: 51 },
    { slot: "CM", x: 50, y: 43 },
    { slot: "RCM", x: 69, y: 51 },
    { slot: "RM", x: 88, y: 46 },
    { slot: "ST", x: 50, y: 16 },
  ],

  "3-4-3": [
    { slot: "GK", x: 50, y: 89 },
    { slot: "LCB", x: 25, y: 71 },
    { slot: "CB", x: 50, y: 75 },
    { slot: "RCB", x: 75, y: 71 },
    { slot: "LM", x: 13, y: 48 },
    { slot: "LCM", x: 38, y: 51 },
    { slot: "RCM", x: 62, y: 51 },
    { slot: "RM", x: 87, y: 48 },
    { slot: "LW", x: 20, y: 22 },
    { slot: "ST", x: 50, y: 15 },
    { slot: "RW", x: 80, y: 22 },
  ],
};

function initials(
  firstName: string,
  lastName: string
) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`
    .toUpperCase();
}

export function AthleteLineupPitch({
  formation,
  players,
  currentPlayerId,
}: AthleteLineupPitchProps) {
  const layout =
    FORMATION_LAYOUTS[formation];

  if (!layout) {
    return (
      <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
        Formacioni i publikuar nuk mund të paraqitet vizualisht.
      </div>
    );
  }

  const startersBySlot =
    new Map(
      players
        .filter(
          (item) =>
            item.role === "STARTER" &&
            item.lineupSlot
        )
        .map(
          (item) => [
            item.lineupSlot as string,
            item,
          ]
        )
    );

  const substitutes =
    players.filter(
      (item) =>
        item.role === "SUBSTITUTE"
    );

  return (
    <div className="mt-5">
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-black text-white shadow-sm">
          {formation}
        </span>

        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Formacion i publikuar
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_270px]">
        <div className="mx-auto w-full max-w-[760px] px-3 pb-10 pt-2">
          <div className="relative [perspective:1400px]">
            <div className="pointer-events-none absolute inset-x-[8%] bottom-[-34px] h-16 rounded-[50%] bg-slate-950/20 blur-2xl" />

            <div className="relative origin-bottom [transform:rotateX(7deg)]">
              <div className="relative aspect-[3/4] min-h-[620px] overflow-hidden rounded-[34px] border-[5px] border-emerald-950/70 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_35px_70px_rgba(15,23,42,0.35)]">
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.30),transparent_32%)]" />

                <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,transparent_55%,rgba(0,0,0,0.18)_100%)]" />

                <div className="pointer-events-none absolute inset-0 opacity-25">
                  <div className="h-full w-full bg-[repeating-linear-gradient(to_bottom,rgba(255,255,255,0.13)_0px,rgba(255,255,255,0.13)_46px,transparent_46px,transparent_92px)]" />
                </div>

                <div className="pointer-events-none absolute inset-4 rounded-[26px] border-2 border-white/85" />

                <div className="pointer-events-none absolute left-4 right-4 top-1/2 border-t-2 border-white/85" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/85" />

                <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow" />

                <div className="pointer-events-none absolute left-1/2 top-4 h-[19%] w-[50%] -translate-x-1/2 rounded-b-[24px] border-x-2 border-b-2 border-white/85" />

                <div className="pointer-events-none absolute left-1/2 top-4 h-[9%] w-[25%] -translate-x-1/2 rounded-b-[16px] border-x-2 border-b-2 border-white/85" />

                <div className="pointer-events-none absolute bottom-4 left-1/2 h-[19%] w-[50%] -translate-x-1/2 rounded-t-[24px] border-x-2 border-t-2 border-white/85" />

                <div className="pointer-events-none absolute bottom-4 left-1/2 h-[9%] w-[25%] -translate-x-1/2 rounded-t-[16px] border-x-2 border-t-2 border-white/85" />

                <div className="pointer-events-none absolute left-1/2 top-[14%] h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white/90" />

                <div className="pointer-events-none absolute bottom-[14%] left-1/2 h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-white/90" />

                <div className="pointer-events-none absolute left-1/2 top-0 h-3 w-[22%] -translate-x-1/2 rounded-b-xl border-x-2 border-b-2 border-white/55 bg-emerald-900/25" />

                <div className="pointer-events-none absolute bottom-0 left-1/2 h-3 w-[22%] -translate-x-1/2 rounded-t-xl border-x-2 border-t-2 border-white/55 bg-emerald-900/25" />

                {layout.map(
                  ({
                    slot,
                    x,
                    y,
                  }) => {
                    const player =
                      startersBySlot.get(
                        slot
                      );

                    if (!player) {
                      return null;
                    }

                    const isMe =
                      player.playerId ===
                      currentPlayerId;

                    return (
                      <div
                        key={slot}
                        style={{
                          left: `${x}%`,
                          top: `${y}%`,
                        }}
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
                      >
                        <div
                          className={[
                            "relative flex w-[86px] flex-col items-center rounded-2xl border px-2 py-2 text-center transition duration-200 hover:-translate-y-1 sm:w-[102px]",
                            isMe
                              ? "border-amber-200 bg-gradient-to-b from-amber-300 via-yellow-300 to-amber-400 text-slate-950 shadow-[0_16px_32px_rgba(245,158,11,0.42)] ring-4 ring-amber-100/70"
                              : "border-slate-700/80 bg-gradient-to-b from-slate-900 via-slate-950 to-black text-white shadow-[0_16px_30px_rgba(2,6,23,0.45)]",
                          ].join(" ")}
                        >
                          <div
                            className={[
                              "flex h-8 w-8 items-center justify-center rounded-full text-[10px] font-black",
                              isMe
                                ? "bg-slate-950 text-white"
                                : "bg-white/10 text-white ring-1 ring-white/10",
                            ].join(" ")}
                          >
                            {initials(
                              player.player.firstName,
                              player.player.lastName
                            )}
                          </div>

                          <span className="mt-1 max-w-full truncate text-[11px] font-black sm:text-xs">
                            {player.player.firstName}
                          </span>

                          <span
                            className={[
                              "max-w-full truncate text-[9px] font-semibold sm:text-[10px]",
                              isMe
                                ? "text-slate-700"
                                : "text-slate-300",
                            ].join(" ")}
                          >
                            {player.player.lastName}
                          </span>

                          <span
                            className={[
                              "mt-1 rounded-full px-2 py-0.5 text-[8px] font-black sm:text-[9px]",
                              isMe
                                ? "bg-slate-950 text-white"
                                : "bg-white/10 text-white",
                            ].join(" ")}
                          >
                            {isMe
                              ? `TI · ${slot}`
                              : slot}
                          </span>

                          {isMe ? (
                            <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full border-2 border-white bg-violet-600 text-[8px] font-black text-white shadow-md">
                              TI
                            </span>
                          ) : null}
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-[24px] border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="font-black text-slate-950">
                  Stoli
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Zëvendësuesit e publikuar.
                </p>
              </div>

              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-bold text-slate-600">
                {substitutes.length}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              {substitutes.length ===
              0 ? (
                <p className="rounded-xl border border-dashed border-slate-200 bg-white p-4 text-xs text-slate-500">
                  Nuk ka zëvendësues.
                </p>
              ) : (
                substitutes.map(
                  (item) => {
                    const isMe =
                      item.playerId ===
                      currentPlayerId;

                    return (
                      <div
                        key={item.id}
                        className={[
                          "flex items-center gap-3 rounded-2xl border p-3 transition",
                          isMe
                            ? "border-amber-200 bg-amber-50 shadow-sm"
                            : "border-slate-100 bg-white hover:border-slate-200",
                        ].join(" ")}
                      >
                        <div
                          className={[
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black",
                            isMe
                              ? "bg-amber-300 text-slate-950"
                              : "bg-slate-950 text-white",
                          ].join(" ")}
                        >
                          {initials(
                            item.player.firstName,
                            item.player.lastName
                          )}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-bold text-slate-900">
                            {item.player.firstName}{" "}
                            {item.player.lastName}
                          </p>

                          <p className="mt-0.5 truncate text-xs text-slate-500">
                            {isMe
                              ? "TI · Zëvendësues"
                              : item.position ||
                                item.player.position ||
                                "Zëvendësues"}
                          </p>
                        </div>
                      </div>
                    );
                  }
                )
              )}
            </div>
          </div>

          <div className="rounded-[24px] border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-blue-50 p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-violet-600">
              Në këtë ndeshje
            </p>

            <h3 className="mt-1 font-black text-slate-950">
              Roli im
            </h3>

            <p className="mt-2 text-sm text-slate-500">
              Pozicioni yt dallohet me kartën e verdhë në fushë ose në stol.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}