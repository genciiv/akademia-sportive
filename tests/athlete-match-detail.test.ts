import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const detailPath =
  "app/sportist/(portal)/ndeshjet/[matchId]/page.tsx";

const listPath =
  "app/sportist/(portal)/ndeshjet/page.tsx";

test("athlete match detail page exists", () => {
  assert.equal(fs.existsSync(detailPath), true);
});

test("athlete match detail requires centralized athlete access", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /requireAthleteAccess/);
  assert.match(
    page,
    /\/hyrje\?next=\/sportist\/ndeshjet\//
  );
});

test("athlete match detail resolves active teams for the linked player", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /prisma\.teamPlayer\.findMany/);
  assert.match(page, /playerId:\s*access\.playerId/);
  assert.match(page, /isActive:\s*true/);
  assert.match(page, /academyId:\s*access\.academyId/);
  assert.match(page, /status:\s*"ACTIVE"/);
});

test("athlete match detail scopes the match to academy and active teams", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /prisma\.match\.findFirst/);
  assert.match(page, /academyId:\s*access\.academyId/);
  assert.match(page, /teamId:\s*\{\s*in:\s*activeTeamIds/);
});

test("athlete match detail exposes squad and match events", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /matchPlayers:/);
  assert.match(page, /events:/);

  assert.match(page, /STARTER/);
  assert.match(page, /SUBSTITUTE/);

  assert.match(page, /GOAL/);
  assert.match(page, /ASSIST/);
  assert.match(page, /YELLOW_CARD/);
  assert.match(page, /RED_CARD/);
  assert.match(page, /SUBSTITUTION_IN/);
  assert.match(page, /SUBSTITUTION_OUT/);
});

test("athlete match detail exposes only the linked athlete performance", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /playerMatchPerformance\.findFirst/);
  assert.match(page, /playerId:\s*access\.playerId/);
  assert.match(page, /matchId:/);
});

test("athlete match detail never exposes coach private notes", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.doesNotMatch(page, /coachNotes:\s*true/);
});

test("athlete match detail does not use academy staff permissions", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.doesNotMatch(
    page,
    /requireAcademyPermission|getCurrentAcademyAccess|PERMISSIONS\./,
  );
});

test("athlete match list links matches to the detail page", () => {
  const page = fs.readFileSync(listPath, "utf8");

  assert.match(page, /href=\{`\/sportist\/ndeshjet\/\$\{match\.id\}`\}/);
});
test("athlete match detail exposes personal event summary", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /athleteGoals/);
  assert.match(page, /athleteAssists/);
  assert.match(page, /athleteYellowCards/);
  assert.match(page, /athleteRedCards/);
});

test("athlete match detail exposes extended personal performance", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(page, /interceptions/);
  assert.match(page, /foulsCommitted/);
  assert.match(page, /foulsWon/);
  assert.match(page, /passAccuracy/);
  assert.match(page, /dribbleAccuracy/);
});

test("athlete match detail keeps event timeline chronological", () => {
  const page = fs.readFileSync(detailPath, "utf8");

  assert.match(
    page,
    /orderBy:\s*\[\s*\{\s*minute:\s*"asc"/
  );

  assert.match(
    page,
    /\{\s*extraMinute:\s*"asc"/
  );
});
test("match squad edit sends minutes played to the API", () => {
  const clientPath =
    "components/ndeshjet/ndeshjet-client.tsx";

  const client = fs.readFileSync(clientPath, "utf8");

  assert.match(
    client,
    /method:\s*"PATCH"[\s\S]*matchPlayerId:[\s\S]*role:\s*roliNeEditim,[\s\S]*jerseyNumber,[\s\S]*minutesPlayed,[\s\S]*position:/
  );
});