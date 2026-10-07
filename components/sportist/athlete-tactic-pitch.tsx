type Position = [number, number];

type AthleteTacticPitchProps = {
  formation: string | null;
  boardData: unknown;
};

const FORMATION_POSITIONS:
  Record<string, Position[]> = {
    "4-3-3": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [28, 52],
      [50, 57],
      [72, 52],
      [18, 27],
      [50, 20],
      [82, 27],
    ],

    "4-2-3-1": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [36, 57],
      [64, 57],
      [18, 36],
      [50, 40],
      [82, 36],
      [50, 18],
    ],

    "4-4-2": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [18, 48],
      [38, 52],
      [62, 52],
      [82, 48],
      [38, 22],
      [62, 22],
    ],

    "3-5-2": [
      [50, 90],
      [28, 73],
      [50, 77],
      [72, 73],
      [12, 49],
      [34, 53],
      [50, 57],
      [66, 53],
      [88, 49],
      [38, 22],
      [62, 22],
    ],

    "3-4-3": [
      [50, 90],
      [28, 73],
      [50, 77],
      [72, 73],
      [18, 49],
      [40, 54],
      [60, 54],
      [82, 49],
      [18, 24],
      [50, 18],
      [82, 24],
    ],

    "4-1-4-1": [
      [50, 90],
      [18, 72],
      [38, 75],
      [62, 75],
      [82, 72],
      [50, 59],
      [18, 40],
      [40, 43],
      [60, 43],
      [82, 40],
      [50, 18],
    ],
  };

function getBoardPositions(
  boardData: unknown,
  formation: string | null
): Position[] {
  if (
    boardData &&
    typeof boardData === "object" &&
    !Array.isArray(boardData) &&
    "positions" in boardData
  ) {
    const positions = (
      boardData as {
        positions?: unknown;
      }
    ).positions;

    if (Array.isArray(positions)) {
      const validPositions =
        positions.filter(
          (
            item
          ): item is Position =>
            Array.isArray(item) &&
            item.length === 2 &&
            typeof item[0] === "number" &&
            typeof item[1] === "number"
        );

      if (validPositions.length > 0) {
        return validPositions;
      }
    }
  }

  return (
    FORMATION_POSITIONS[
      formation || ""
    ] ??
    FORMATION_POSITIONS["4-3-3"]
  );
}

export function AthleteTacticPitch({
  formation,
  boardData,
}: AthleteTacticPitchProps) {
  const positions =
    getBoardPositions(
      boardData,
      formation
    );

  return (
    <div className="relative py-3">
      <div
        className="mx-auto max-w-[620px]"
        style={{
          perspective: "1100px",
        }}
      >
        <div
          className="relative aspect-[1.55/1] overflow-hidden rounded-[28px] border border-emerald-300/70 bg-gradient-to-b from-emerald-400 via-emerald-500 to-emerald-700 shadow-[0_30px_55px_rgba(5,150,105,0.28)]"
          style={{
            transform:
              "rotateX(7deg)",
            transformOrigin:
              "center bottom",
            transformStyle:
              "preserve-3d",
          }}
        >
          {/* Grass depth */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/5 via-transparent to-black/5" />

          {/* Grass stripes */}
          {Array.from({
            length: 8,
          }).map((_, index) => (
            <div
              key={index}
              className={[
                "absolute bottom-0 top-0",
                index % 2 === 0
                  ? "bg-white/[0.035]"
                  : "bg-black/[0.025]",
              ].join(" ")}
              style={{
                left: `${index * 12.5}%`,
                width: "12.5%",
              }}
            />
          ))}

          {/* Outer line */}
          <div className="absolute inset-[14px] rounded-[20px] border-2 border-white/80 shadow-[inset_0_0_20px_rgba(255,255,255,0.06)]" />

          {/* Halfway */}
          <div className="absolute bottom-[14px] left-1/2 top-[14px] w-[2px] -translate-x-1/2 bg-white/75" />

          {/* Center circle */}
          <div className="absolute left-1/2 top-1/2 h-[24%] aspect-square -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/75" />

          <div className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 shadow" />

          {/* Top penalty area */}
          <div className="absolute left-1/2 top-[14px] h-[20%] w-[43%] -translate-x-1/2 rounded-b-[18px] border-2 border-t-0 border-white/75" />

          <div className="absolute left-1/2 top-[14px] h-[8%] w-[20%] -translate-x-1/2 rounded-b-lg border-2 border-t-0 border-white/75" />

          {/* Bottom penalty area */}
          <div className="absolute bottom-[14px] left-1/2 h-[20%] w-[43%] -translate-x-1/2 rounded-t-[18px] border-2 border-b-0 border-white/75" />

          <div className="absolute bottom-[14px] left-1/2 h-[8%] w-[20%] -translate-x-1/2 rounded-t-lg border-2 border-b-0 border-white/75" />

          {/* Players */}
          {positions.map(
            ([x, y], index) => (
              <div
                key={`${x}-${y}-${index}`}
                className="absolute z-20"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform:
                    "translate(-50%, -50%) translateZ(34px)",
                }}
              >
                {/* Player shadow */}
                <div className="absolute left-1/2 top-[22px] h-3 w-8 -translate-x-1/2 rounded-full bg-black/25 blur-[3px]" />

                {/* Player token */}
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-slate-800 via-slate-950 to-black text-[11px] font-black text-white shadow-[0_10px_16px_rgba(15,23,42,0.5)] ring-1 ring-black/20 sm:h-10 sm:w-10 sm:text-xs">
                  <span className="relative z-10">
                    {index + 1}
                  </span>

                  <div className="absolute inset-[3px] rounded-full border border-white/15" />

                  <div className="absolute left-[18%] top-[12%] h-[25%] w-[32%] rounded-full bg-white/20 blur-[1px]" />
                </div>
              </div>
            )
          )}

          {/* Formation */}
          <div className="absolute bottom-4 right-4 z-30 rounded-xl border border-white/15 bg-slate-950/85 px-3 py-1.5 text-[11px] font-black text-white shadow-lg backdrop-blur-sm">
            {formation ||
              "Pa formacion"}
          </div>

          {/* Light */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10" />
        </div>

        {/* Ground shadow */}
        <div className="mx-auto -mt-1 h-6 w-[88%] rounded-[100%] bg-emerald-950/10 blur-xl" />
      </div>
    </div>
  );
}