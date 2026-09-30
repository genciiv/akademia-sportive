import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const dashboardPath =
  "app/sportist/(portal)/dashboard/page.tsx";

const dashboard =
  fs.readFileSync(
    dashboardPath,
    "utf8"
  );

test("professional athlete dashboard uses only the linked athlete", () => {
  assert.match(
    dashboard,
    /playerId:\s*access\.playerId/
  );

  assert.match(
    dashboard,
    /academyId:\s*access\.academyId/
  );

  assert.doesNotMatch(
    dashboard,
    /requireAcademyPermission|getCurrentAcademyAccess/
  );
});

test("professional athlete dashboard aggregates completed match participation", () => {
  assert.match(
    dashboard,
    /prisma\.matchPlayer\.findMany/
  );

  assert.match(
    dashboard,
    /status:\s*"COMPLETED"/
  );

  assert.match(
    dashboard,
    /appearanceMatchIds/
  );

  assert.match(
    dashboard,
    /minutesPlayed/
  );

  assert.match(
    dashboard,
    /role === "STARTER"/
  );
});

test("professional athlete dashboard aggregates goals and assists", () => {
  assert.match(
    dashboard,
    /prisma\.matchEvent\.findMany/
  );

  assert.match(
    dashboard,
    /event\.type === "GOAL"/
  );

  assert.match(
    dashboard,
    /event\.type === "ASSIST"/
  );
});

test("professional athlete dashboard exposes average coach rating without private notes", () => {
  assert.match(
    dashboard,
    /prisma\.playerMatchPerformance\.findMany/
  );

  assert.match(
    dashboard,
    /coachRating:\s*true/
  );

  assert.match(
    dashboard,
    /averageRating/
  );

  assert.doesNotMatch(
    dashboard,
    /coachNotes:\s*true/
  );
});

test("professional athlete dashboard renders career statistics", () => {
  assert.match(
    dashboard,
    /Statistikat e karrierës/
  );

  assert.match(
    dashboard,
    /professionalStats\.appearances/
  );

  assert.match(
    dashboard,
    /professionalStats\.starts/
  );

  assert.match(
    dashboard,
    /professionalStats\.minutes/
  );

  assert.match(
    dashboard,
    /professionalStats\.goals/
  );

  assert.match(
    dashboard,
    /professionalStats\.assists/
  );

  assert.match(
    dashboard,
    /professionalStats\.averageRating/
  );
});
test("professional athlete dashboard renders the professional athlete hero", () => {
  assert.match(
    dashboard,
    /Profili i sportistit/
  );

  assert.match(
    dashboard,
    /athleteInitials/
  );

  assert.match(
    dashboard,
    /player\.photo/
  );

  assert.match(
    dashboard,
    /\/sportist\/ndeshjet/
  );

  assert.match(
    dashboard,
    /\/sportist\/orari/
  );
});

test("professional athlete dashboard calculates attendance rate for the linked athlete", () => {
  assert.match(
    dashboard,
    /attendanceHistory/
  );

  assert.match(
    dashboard,
    /playerId:\s*access\.playerId/
  );

  assert.match(
    dashboard,
    /attendanceRate/
  );

  assert.match(
    dashboard,
    /attendance\.status === "PRESENT"/
  );

  assert.match(
    dashboard,
    /attendance\.status === "LATE"/
  );
});

test("professional athlete dashboard exposes the next scheduled match", () => {
  assert.match(
    dashboard,
    /const nextMatch\s*=\s*upcomingMatches\[0\]/
  );

  assert.match(
    dashboard,
    /Ndeshja e radhës/
  );

  assert.match(
    dashboard,
    /Detajet e ndeshjes/
  );
});

test("professional athlete dashboard exposes the last five appearances", () => {
  assert.match(
    dashboard,
    /recentAppearances/
  );

  assert.match(
    dashboard,
    /take:\s*5/
  );

  assert.match(
    dashboard,
    /minutesPlayed:\s*\{\s*gt:\s*0/
  );

  assert.match(
    dashboard,
    /Forma e fundit/
  );

  assert.match(
    dashboard,
    /appearance\.outcome/
  );
});