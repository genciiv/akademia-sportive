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

  assert.match(dashboard, /team\.status\s*===\s*"ACTIVE"/);
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

test("athlete dashboard scopes upcoming training sessions to the athlete active teams and academy", () => {
  assert.match(dashboard, /prisma\.trainingSession\.findMany/);

  assert.match(dashboard, /academyId:\s*access\.academyId/);

  assert.match(dashboard, /teamId:\s*\{\s*in:\s*activeTeamIds/);

  assert.match(dashboard, /status:\s*"SCHEDULED"/);
});

test("athlete dashboard limits upcoming training sessions to three", () => {
  assert.match(dashboard, /prisma\.trainingSession\.findMany[\s\S]*?take:\s*3/);
});

test("athlete dashboard scopes upcoming matches to the athlete active teams and academy", () => {
  assert.match(dashboard, /prisma\.match\.findMany/);

  assert.match(dashboard, /teamId:\s*\{\s*in:\s*activeTeamIds/);

  assert.match(dashboard, /startsAt:\s*\{\s*gte:\s*now/);
});

test("athlete dashboard scopes attendance strictly to the linked athlete", () => {
  assert.match(dashboard, /prisma\.trainingAttendance\.findMany/);

  assert.match(dashboard, /playerId:\s*access\.playerId/);

  assert.match(
    dashboard,
    /trainingSession:\s*\{[\s\S]*?academyId:\s*access\.academyId/,
  );

  assert.match(
    dashboard,
    /trainingSession:\s*\{[\s\S]*?teamId:\s*\{\s*in:\s*activeTeamIds/,
  );
});

test("athlete dashboard limits recent attendance history to five", () => {
  assert.match(
    dashboard,
    /prisma\.trainingAttendance\.findMany[\s\S]*?take:\s*5/,
  );
});
