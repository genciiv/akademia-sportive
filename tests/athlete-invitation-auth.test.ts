import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const authSource = fs.readFileSync("lib/auth.ts", "utf8");

test("email signup accepts a valid athlete invitation through its token hash", () => {
  assert.match(authSource, /prisma\.athleteInvitation\.findUnique/);

  assert.match(authSource, /token:\s*onboardingTokenHash/);

  assert.match(authSource, /athleteAllowed/);
});

test("athlete signup requires an active invitation with matching email", () => {
  assert.match(authSource, /athleteInvitation\.acceptedAt\s*===\s*null/);

  assert.match(authSource, /athleteInvitation\.revokedAt\s*===\s*null/);

  assert.match(authSource, /athleteInvitation\.expiresAt\s*>\s*now/);

  assert.match(
    authSource,
    /normalizeEmail\(\s*athleteInvitation\.email\s*\)\s*===\s*email/,
  );
});

test("athlete signup does not create academy membership or athlete account", () => {
  assert.doesNotMatch(
    authSource,
    /prisma\.academyMembership\.(create|update|upsert)/,
  );

  assert.doesNotMatch(
    authSource,
    /prisma\.athleteAccount\.(create|update|upsert)/,
  );
});

test("athlete invitation is not consumed by the auth after hook", () => {
  const afterHookStart = authSource.indexOf("after: createAuthMiddleware");

  assert.ok(afterHookStart >= 0);

  const afterHook = authSource.slice(afterHookStart);

  assert.doesNotMatch(afterHook, /athleteInvitation/);

  assert.doesNotMatch(afterHook, /acceptedAt/);
});
