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
      <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-slate-950 px-3 py-1.5 text-xs font-bold text-white">
          {formation}
        </span>

        <span className="rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
          Formacion i publikuar
        </span>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <div className="mx-auto w-full max-w-[680px]">
          <div className="relative aspect-[3/4] min-h-[600px] overflow-hidden rounded-[30px] border-4 border-emerald-800 bg-emerald-600 shadow-inner">
            <div className="absolute inset-4 rounded-2xl border-2 border-white/75" />

            <div className="absolute left-4 right-4 top-1/2 border-t-2 border-white/75" />

            <div className="absolute left-1/2 top-1/2 h-28 w-28 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/75" />

            <div className="absolute left-1/2 top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/80" />

            <div className="absolute left-1/2 top-4 h-[18%] w-[48%] -translate-x-1/2 border-x-2 border-b-2 border-white/75" />

            <div className="absolute bottom-4 left-1/2 h-[18%] w-[48%] -translate-x-1/2 border-x-2 border-t-2 border-white/75" />

            <div className="absolute left-1/2 top-4 h-[8%] w-[24%] -translate-x-1/2 border-x-2 border-b-2 border-white/75" />

            <div className="absolute bottom-4 left-1/2 h-[8%] w-[24%] -translate-x-1/2 border-x-2 border-t-2 border-white/75" />

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
                    className={`absolute z-10 flex w-[92px] -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded-2xl border px-2 py-2 text-center shadow-lg sm:w-[108px] ${
                      isMe
                        ? "border-amber-300 bg-amber-300 text-slate-950 ring-4 ring-amber-100/70"
                        : "border-slate-700 bg-slate-950 text-white"
                    }`}
                  >
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black ${
                        isMe
                          ? "bg-slate-950 text-white"
                          : "bg-white/10"
                      }`}
                    >
                      {initials(
                        player.player
                          .firstName,
                        player.player
                          .lastName
                      )}
                    </span>

                    <span className="mt-1 max-w-full truncate text-xs font-black">
                      {player.player.firstName}
                    </span>

                    <span className="max-w-full truncate text-[10px] font-semibold opacity-80">
                      {player.player.lastName}
                    </span>

                    <span
                      className={`mt-1 rounded-full px-2 py-0.5 text-[9px] font-black ${
                        isMe
                          ? "bg-slate-950 text-white"
                          : "bg-white/10 text-white"
                      }`}
                    >
                      {isMe
                        ? `TI - ${slot}`
                        : slot}
                    </span>
                  </div>
                );
              }
            )}
          </div>
        </div>

        <aside className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <h3 className="font-black text-slate-950">
            Stoli
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            Zëvendësuesit e publikuar për këtë ndeshje.
          </p>

          <div className="mt-4 space-y-2">
            {substitutes.length === 0 ? (
              <p className="rounded-xl bg-white p-3 text-xs text-slate-500">
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
                      className={`flex items-center gap-3 rounded-xl p-3 ${
                        isMe
                          ? "border border-amber-200 bg-amber-50"
                          : "bg-white"
                      }`}
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-xs font-black text-white">
                        {initials(
                          item.player
                            .firstName,
                          item.player
                            .lastName
                        )}
                      </div>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-slate-900">
                          {item.player.firstName}{" "}
                          {item.player.lastName}
                        </p>

                        <p className="truncate text-xs text-slate-500">
                          {isMe
                            ? "TI - Zëvendësues"
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
        </aside>
      </div>
    </div>
  );
}