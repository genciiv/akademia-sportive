import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source =
  fs.readFileSync(
    "app/sportist/(portal)/dashboard/page.tsx",
    "utf8"
  );

test("athlete dashboard runs independent queries in one parallel batch", () => {
  const count =
    (
      source.match(
        /Promise\.all/g
      ) ?? []
    ).length;

  assert.equal(
    count,
    1
  );
});

test("athlete dashboard avoids duplicate match player queries", () => {
  const count =
    (
      source.match(
        /prisma\.matchPlayer\.findMany/g
      ) ?? []
    ).length;

  assert.equal(
    count,
    1
  );
});

test("athlete dashboard uses grouped attendance statistics", () => {
  assert.match(
    source,
    /prisma\.trainingAttendance\.groupBy/
  );

  assert.match(
    source,
    /_count:\s*\{\s*_all:\s*true/
  );
});

test("athlete dashboard derives recent appearances from shared match data", () => {
  assert.match(
    source,
    /const recentAppearances\s*=\s*completedMatchPlayers/
  );

  assert.match(
    source,
    /\.slice\(0,\s*5\)/
  );
});

test("athlete dashboard preserves academy player and team scoping", () => {
  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /playerId:\s*access\.playerId/
  );

  assert.match(
    source,
    /in:\s*activeTeamIds/
  );
});