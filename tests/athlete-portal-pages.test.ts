import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("app/sportist/(portal)/layout.tsx", "utf8");

const dashboard = fs.readFileSync(
  "app/sportist/(portal)/dashboard/page.tsx",
  "utf8",
);

test("athlete portal protected layout requires athlete access", () => {
  assert.match(layout, /requireAthleteAccess/);

  assert.match(layout, /access\.response\.status\s*===\s*401/);

  assert.match(layout, /\/hyrje\?next=\/sportist\/dashboard/);
});

test("athlete invitation page remains outside the protected portal route group", () => {
  assert.equal(fs.existsSync("app/sportist/ftesa/[token]/page.tsx"), true);

  assert.equal(
    fs.existsSync("app/sportist/(portal)/ftesa/[token]/page.tsx"),
    false,
  );
});

test("athlete dashboard queries only the linked player inside the linked academy", () => {
  assert.match(dashboard, /id:\s*access\.playerId/);

  assert.match(dashboard, /academyId:\s*access\.academyId/);

  assert.doesNotMatch(dashboard, /prisma\.player\.findMany/);
});

test("athlete dashboard exposes active team context only", () => {
  assert.match(dashboard, /teams:/);

  assert.match(dashboard, /isActive:\s*true/);

  assert.match(dashboard, /team:/);
});

test("athlete dashboard exposes only the latest physical measurement", () => {
  assert.match(dashboard, /physicalMeasurements:/);

  assert.match(dashboard, /measuredAt:\s*"desc"/);

  assert.match(dashboard, /take:\s*1/);
});

test("athlete dashboard does not use academy staff permissions", () => {
  assert.doesNotMatch(
    layout,
    /requireAcademyPermission|getCurrentAcademyAccess/,
  );

  assert.doesNotMatch(
    dashboard,
    /requireAcademyPermission|getCurrentAcademyAccess/,
  );
});
