import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("lib/athlete-access.ts", "utf8");

test("athlete access requires an authenticated session", () => {
  assert.match(source, /auth\.api\.getSession/);

  assert.match(source, /session\?\.user\?\.id/);

  assert.match(source, /status:\s*401/);
});

test("athlete access resolves identity through AthleteAccount", () => {
  assert.match(source, /prisma\.athleteAccount\.findFirst/);

  assert.match(source, /userId:\s*session\.user\.id/);

  assert.match(source, /playerId:\s*athleteAccount\.playerId/);

  assert.match(source, /academyId:\s*athleteAccount\.academyId/);
});

test("athlete access never depends on academy membership", () => {
  assert.doesNotMatch(source, /academyMembership/);

  assert.doesNotMatch(source, /requireAcademyPermission/);

  assert.doesNotMatch(source, /getCurrentAcademyAccess/);
});

test("athlete access rejects authenticated users without an athlete account", () => {
  assert.match(source, /if\s*\(!athleteAccount\)/);

  assert.match(source, /status:\s*403/);
});

test("athlete access returns only the linked athlete player and academy context", () => {
  assert.match(source, /athleteAccountId:\s*athleteAccount\.id/);

  assert.match(source, /userId:\s*athleteAccount\.userId/);

  assert.match(source, /playerId:\s*athleteAccount\.playerId/);

  assert.match(source, /academyId:\s*athleteAccount\.academyId/);

  assert.match(source, /firstName:\s*athleteAccount\.player\.firstName/);

  assert.match(source, /name:\s*athleteAccount\.academy\.name/);
});

test("athlete access rechecks portal entitlement without applying creation capacity", () => {
  assert.match(source, /checkAthletePortalAccess/);

  assert.match(source, /athleteAccount\.academyId/);

  assert.match(source, /enforceCapacity:\s*false/);

  assert.match(source, /if\s*\(!portalAccess\.allowed\)/);

  assert.match(source, /status:\s*403/);
});
