import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const liveSource = readFileSync(
  "app/api/health/live/route.ts",
  "utf8"
);

const readySource = readFileSync(
  "app/api/health/ready/route.ts",
  "utf8"
);

test("live health endpoint is public and reports process liveness", () => {
  assert.match(
    liveSource,
    /status:\s*"ok"/
  );

  assert.match(
    liveSource,
    /status:\s*200/
  );

  assert.doesNotMatch(
    liveSource,
    /requireAcademyPermission|requireAthleteAccess|getPlatformAdminAccess/
  );
});

test("ready health endpoint verifies database readiness", () => {
  assert.match(
    readySource,
    /prisma\.\$queryRaw/
  );

  assert.match(
    readySource,
    /SELECT 1/
  );

  assert.match(
    readySource,
    /status:\s*"ready"/
  );

  assert.match(
    readySource,
    /status:\s*"unavailable"/
  );

  assert.match(
    readySource,
    /status:\s*503/
  );
});

test("health endpoints are explicitly allowlisted as public routes", () => {
  const auditSource = readFileSync(
    "tests/api-authorization-audit.test.ts",
    "utf8"
  );

  assert.match(
    auditSource,
    /app\/api\/health\/live\/route\.ts/
  );

  assert.match(
    auditSource,
    /app\/api\/health\/ready\/route\.ts/
  );
});
