import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source =
  fs.readFileSync(
    "app/sportist/(portal)/performanca/page.tsx",
    "utf8"
  );

test("athlete performance aggregates career statistics in the database", () => {
  assert.match(
    source,
    /prisma\.matchPlayer\.aggregate/
  );

  assert.match(
    source,
    /prisma\.matchPlayer\.count/
  );

  assert.match(
    source,
    /prisma\.matchEvent\.groupBy/
  );

  assert.match(
    source,
    /prisma\.playerMatchPerformance\.aggregate/
  );
});

test("athlete performance does not load full match participation history", () => {
  assert.doesNotMatch(
    source,
    /prisma\.matchPlayer\.findMany/
  );

  assert.doesNotMatch(
    source,
    /prisma\.matchEvent\.findMany/
  );
});

test("athlete performance history is bounded to the latest eight rows", () => {
  assert.match(
    source,
    /recentPerformances/
  );

  assert.match(
    source,
    /take:\s*8/
  );
});

test("athlete performance rating trend is bounded to six rated matches", () => {
  assert.match(
    source,
    /recentRatings/
  );

  assert.match(
    source,
    /coachRating:\s*\{\s*not:\s*null/
  );

  assert.match(
    source,
    /take:\s*6/
  );
});

test("athlete performance runs statistics in one parallel batch", () => {
  const promiseCount =
    (
      source.match(
        /Promise\.all/g
      ) ?? []
    ).length;

  assert.equal(
    promiseCount,
    1
  );
});

test("athlete performance preserves tenant athlete and team scoping", () => {
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