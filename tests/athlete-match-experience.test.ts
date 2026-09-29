import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const pagePath = "app/sportist/(portal)/ndeshjet/page.tsx";
const navigationPath = "components/athlete-portal-nav.tsx";

test("athlete matches page exists", () => {
  assert.equal(fs.existsSync(pagePath), true);
});

test("athlete matches page requires centralized athlete access", () => {
  const page = fs.readFileSync(pagePath, "utf8");

  assert.match(page, /requireAthleteAccess/);
  assert.match(page, /\/hyrje\?next=\/sportist\/ndeshjet/);
});

test("athlete matches page resolves only active athlete teams", () => {
  const page = fs.readFileSync(pagePath, "utf8");

  assert.match(page, /prisma\.teamPlayer\.findMany/);
  assert.match(page, /playerId:\s*access\.playerId/);
  assert.match(page, /isActive:\s*true/);
  assert.match(page, /academyId:\s*access\.academyId/);
  assert.match(page, /status:\s*"ACTIVE"/);
});

test("athlete matches are scoped to academy and active teams", () => {
  const page = fs.readFileSync(pagePath, "utf8");

  assert.match(page, /prisma\.match\.findMany/);
  assert.match(page, /academyId:\s*access\.academyId/);
  assert.match(page, /teamId:\s*\{\s*in:\s*activeTeamIds/);
});

test("athlete matches page separates upcoming and completed matches", () => {
  const page = fs.readFileSync(pagePath, "utf8");

  assert.match(page, /upcomingMatches/);
  assert.match(page, /completedMatches/);
  assert.match(page, /status:\s*"SCHEDULED"/);
  assert.match(page, /status:\s*"COMPLETED"/);
});

test("athlete completed matches expose local result fields", () => {
  const page = fs.readFileSync(pagePath, "utf8");

  assert.match(page, /ourScore:\s*true/);
  assert.match(page, /opponentScore:\s*true/);
});

test("athlete match experience does not use academy staff permissions", () => {
  const page = fs.readFileSync(pagePath, "utf8");

  assert.doesNotMatch(
    page,
    /requireAcademyPermission|getCurrentAcademyAccess|PERMISSIONS\./,
  );
});

test("athlete portal navigation exposes matches", () => {
  const navigation = fs.readFileSync(navigationPath, "utf8");

  assert.match(navigation, /href:\s*"\/sportist\/ndeshjet"/);
  assert.match(navigation, /label:\s*"Ndeshjet"/);
});