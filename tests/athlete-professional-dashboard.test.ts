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
    /Aktiviteti i ardhshëm/
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

test("professional athlete dashboard exposes derived career metrics", () => {
  assert.match(
    dashboard,
    /minutesPerAppearance/
  );

  assert.match(
    dashboard,
    /goalContributions/
  );

  assert.match(
    dashboard,
    /Min \/ ndeshje/
  );

  assert.match(
    dashboard,
    /G\+A/
  );
});

test("professional athlete dashboard renders the coach rating performance trend", () => {
  assert.match(
    dashboard,
    /performanceTrend/
  );

  assert.match(
    dashboard,
    /Ecuria e Performancës/
  );

  assert.match(
    dashboard,
    /opponentName:\s*true/
  );

  assert.match(
    dashboard,
    /startsAt:\s*true/
  );

  assert.match(
    dashboard,
    /\.slice\(0,\s*5\)/
  );

  assert.doesNotMatch(
    dashboard,
    /coachNotes:\s*true/
  );
});

test("professional athlete dashboard renders last match performance", () => {
  assert.match(dashboard, /Performanca në Ndeshjen e Fundit/);
  assert.match(dashboard, /lastMatchPerformance/);
  assert.match(dashboard, /lastPassAccuracy/);
  assert.match(dashboard, /lastDribbleAccuracy/);
  assert.match(dashboard, /shotsOnTarget/);
  assert.match(dashboard, /passesCompleted/);
  assert.match(dashboard, /dribblesCompleted/);
  assert.match(dashboard, /duelsWon/);
  assert.match(dashboard, /tackles/);
  assert.match(dashboard, /interceptions/);
  assert.match(dashboard, /foulsCommitted/);
  assert.match(dashboard, /foulsWon/);
  assert.match(dashboard, /teamId:\s*\{\s*in:\s*activeTeamIds/);
  assert.doesNotMatch(dashboard, /coachNotes:\s*true/);
});

test("professional athlete dashboard loads physical progress history", () => {
  assert.match(dashboard, /physicalMeasurements/);
  assert.match(dashboard, /take:\s*8/);
  assert.match(dashboard, /physicalProgress/);
  assert.match(dashboard, /weightKg:\s*true/);
  assert.match(dashboard, /bodyFatPercent:\s*true/);
  assert.match(dashboard, /muscleMassKg:\s*true/);
  assert.match(dashboard, /heightCm:\s*true/);
});

test("professional athlete dashboard renders physical progress", () => {
  assert.match(dashboard, /Progresi Fizik/);
  assert.match(dashboard, /maxPhysicalWeight/);
  assert.match(dashboard, /maxPhysicalBodyFat/);
  assert.match(dashboard, /maxPhysicalMuscleMass/);
  assert.match(dashboard, /latestMeasurement\.weightKg/);
  assert.match(dashboard, /latestMeasurement\.bodyFatPercent/);
  assert.match(dashboard, /latestMeasurement\.muscleMassKg/);
  assert.match(dashboard, /latestMeasurement\.heightCm/);
  assert.match(dashboard, /physicalProgress\.map/);
});

test("professional athlete dashboard derives the closest next activity", () => {
  assert.match(dashboard, /const nextSession/);
  assert.match(dashboard, /const nextActivity/);
  assert.match(dashboard, /type:\s*"TRAINING"/);
  assert.match(dashboard, /type:\s*"MATCH"/);
  assert.match(dashboard, /nextSession\.startsAt\.getTime/);
  assert.match(dashboard, /nextMatch\.startsAt\.getTime/);
  assert.match(dashboard, /href:\s*"\/sportist\/orari"/);
  assert.match(dashboard, /\/sportist\/ndeshjet\/\$\{nextMatch\.id\}/);
});

test("professional athlete dashboard renders the next activity card", () => {
  assert.match(dashboard, /Aktiviteti i ardhshëm/);
  assert.match(dashboard, /Çfarë ke më pas/);
  assert.match(dashboard, /nextActivity\.title/);
  assert.match(dashboard, /nextActivity\.subtitle/);
  assert.match(dashboard, /nextActivity\.startsAt/);
  assert.match(dashboard, /nextActivity\.location/);
  assert.match(dashboard, /href=\{nextActivity\.href\}/);
  assert.match(dashboard, /"Ndeshje"/);
  assert.match(dashboard, /"Stërvitje"/);
});

test("professional athlete dashboard scopes academy updates for the athlete", () => {
  assert.match(dashboard, /prisma\.notification\.findMany/);
  assert.match(dashboard, /status:\s*"ACTIVE"/);
  assert.match(dashboard, /expiresAt:\s*null/);
  assert.match(dashboard, /expiresAt:\s*\{\s*gte:\s*now/);
  assert.match(dashboard, /audience:\s*"ALL"/);
  assert.match(dashboard, /audience:\s*"TEAM"/);
  assert.match(dashboard, /teamId:\s*\{\s*in:\s*activeTeamIds/);
  assert.match(dashboard, /userId:\s*access\.userId/);
  assert.match(dashboard, /take:\s*5/);
  assert.match(dashboard, /Përditësimet e Akademisë/);
  assert.match(dashboard, /notification\.notificationReads\.length/);
  assert.match(dashboard, /I palexuar/);
  assert.match(dashboard, /I lexuar/);
  assert.match(dashboard, /Urgjent/);
  assert.match(dashboard, /I rëndësishëm/);
});
