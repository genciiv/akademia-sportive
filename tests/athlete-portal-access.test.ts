import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync("lib/athlete-portal-access.ts", "utf8");

test("athlete portal access resolves lifecycle and effective subscription terms", () => {
  assert.match(source, /resolveSubscriptionStatus/);

  assert.match(source, /resolveEffectiveSubscriptionTerms/);

  assert.match(source, /resolveAthletePortalEntitlement/);
});

test("athlete portal account capacity is academy scoped", () => {
  assert.match(source, /prisma\.athleteAccount\.count/);

  assert.match(source, /where:\s*\{\s*academyId/);
});

test("athlete portal access enforces finite capacity and allows null unlimited capacity", () => {
  assert.match(
    source,
    /entitlement\.maxAthleteAccounts\s*!==\s*null/,
  );

  assert.match(
    source,
    /currentAthleteAccounts\s*>=\s*entitlement\.maxAthleteAccounts/,
  );

  assert.match(source, /reason:\s*"LIMIT_REACHED"/);
});

test("athlete portal access keeps missing subscriptions denied", () => {
  assert.match(source, /reason:\s*"NO_SUBSCRIPTION"/);
});

test("athlete portal access can skip capacity enforcement for existing accounts", () => {
  assert.match(source, /enforceCapacity\?:\s*boolean/);

  assert.match(source, /options\.enforceCapacity\s*!==\s*false/);

  assert.match(
    source,
    /currentAthleteAccounts\s*>=\s*entitlement\.maxAthleteAccounts/,
  );
});
