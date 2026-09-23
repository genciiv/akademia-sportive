import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const login = fs.readFileSync(
  "app/hyrje/page.tsx",
  "utf8",
);

const athleteSession = fs.readFileSync(
  "app/api/athlete/session/route.ts",
  "utf8",
);

const authorizationAudit = fs.readFileSync(
  "tests/api-authorization-audit.test.ts",
  "utf8",
);

test("athlete session endpoint uses centralized athlete access", () => {
  assert.match(
    athleteSession,
    /requireAthleteAccess/,
  );

  assert.match(
    athleteSession,
    /athlete:\s*true/,
  );

  assert.match(
    athleteSession,
    /athlete:\s*false/,
  );
});

test("athlete session gives active staff membership routing priority", () => {
  assert.match(
    athleteSession,
    /prisma\.academyMembership\.findFirst/,
  );

  assert.match(
    athleteSession,
    /userId:\s*access\.userId/,
  );

  assert.match(
    athleteSession,
    /academyId:\s*access\.academyId/,
  );

  assert.match(
    athleteSession,
    /status:\s*"ACTIVE"/,
  );

  assert.match(
    athleteSession,
    /if\s*\(\s*activeStaffMembership\s*\)/,
  );
});

test("global API authorization audit recognizes the athlete access guard", () => {
  assert.match(
    authorizationAudit,
    /"requireAthleteAccess"/,
  );
});

test("login preserves the platform admin check", () => {
  assert.match(
    login,
    /\/api\/platform-admin\/session/,
  );

  assert.match(
    login,
    /platformAdminData\?\.platformAdmin\s*===\s*true/,
  );
});

test("login checks athlete access only for the default dashboard destination", () => {
  assert.match(
    login,
    /if\s*\(\s*destination\s*===\s*"\/dashboard"\s*\)/,
  );

  assert.match(
    login,
    /\/api\/athlete\/session/,
  );
});

test("login routes an eligible athlete to the athlete dashboard", () => {
  assert.match(
    login,
    /athleteData\?\.athlete\s*===\s*true/,
  );

  assert.match(
    login,
    /destination\s*=\s*[\s\S]*?"\/sportist\/dashboard"/,
  );
});

test("login preserves explicit next paths", () => {
  assert.match(
    login,
    /let destination = nextPath/,
  );

  assert.match(
    login,
    /safeNextPath/,
  );
});