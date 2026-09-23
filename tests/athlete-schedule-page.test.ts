import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/sportist/(portal)/orari/page.tsx", "utf8");

const layout = fs.readFileSync("app/sportist/(portal)/layout.tsx", "utf8");

const navigation = fs.readFileSync("components/athlete-portal-nav.tsx", "utf8");

test("athlete schedule page requires athlete access", () => {
  assert.match(page, /requireAthleteAccess/);

  assert.match(page, /\/hyrje\?next=\/sportist\/orari/);
});

test("athlete schedule resolves active teams from the linked player", () => {
  assert.match(page, /prisma\.teamPlayer\.findMany/);

  assert.match(page, /playerId:\s*access\.playerId/);

  assert.match(page, /isActive:\s*true/);

  assert.match(page, /academyId:\s*access\.academyId/);

  assert.match(page, /status:\s*"ACTIVE"/);
});

test("athlete schedule scopes training sessions to active teams and academy", () => {
  assert.match(page, /prisma\.trainingSession\.findMany/);

  assert.match(page, /academyId:\s*access\.academyId/);

  assert.match(page, /teamId:\s*\{\s*in:\s*activeTeamIds/);

  assert.match(page, /status:\s*"SCHEDULED"/);
});

test("athlete schedule scopes matches to active teams and academy", () => {
  assert.match(page, /prisma\.match\.findMany/);

  assert.match(page, /teamId:\s*\{\s*in:\s*activeTeamIds/);

  assert.match(page, /startsAt:\s*\{\s*gte:\s*now/);
});

test("athlete schedule combines training sessions and matches chronologically", () => {
  assert.match(page, /scheduleItems/);

  assert.match(page, /\.sort\(/);

  assert.match(page, /a\.startsAt\.getTime\(\)/);

  assert.match(page, /b\.startsAt\.getTime\(\)/);
});

test("athlete schedule does not use academy staff permissions", () => {
  assert.doesNotMatch(
    page,
    /requireAcademyPermission|getCurrentAcademyAccess|PERMISSIONS\./,
  );
});

test("athlete portal navigation exposes the schedule page", () => {
  assert.match(layout, /AthletePortalNav/);

  assert.match(navigation, /href:\s*"\/sportist\/orari"/);

  assert.match(navigation, /label:\s*"Orari"/);
});
