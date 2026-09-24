import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

const source = readFileSync(
  join(root, "app/api/platform-admin/subscriptions/[subscriptionId]/route.ts"),
  "utf8",
);

test("subscription plan switch requires platform admin access", () => {
  assert.match(source, /getPlatformAdminAccess\(\)/);

  assert.match(source, /access\.status === 401/);

  assert.match(source, /Nuk ke akses në Platform Admin/);
});

test("subscription plan switch only allows standard plan codes", () => {
  assert.match(source, /"STARTER"/);

  assert.match(source, /"PRO"/);

  assert.match(source, /"PRO_PORTAL"/);

  assert.doesNotMatch(source, /"CUSTOM"/);
});

test("subscription plan switch requires an active target plan", () => {
  assert.match(source, /tx\.plan\.findUnique/);

  assert.match(source, /isActive:\s*true/);

  assert.match(source, /!targetPlan\s*\|\|\s*!targetPlan\.isActive/);
});

test("subscription plan switch resolves lifecycle before changing plan", () => {
  assert.match(source, /resolveSubscriptionStatus/);

  assert.match(source, /currentStatus:\s*subscription\.status/);

  assert.match(
    source,
    /currentPeriodStart:\s*subscription\.currentPeriodStart/,
  );

  assert.match(source, /currentPeriodEnd:\s*subscription\.currentPeriodEnd/);
});

test("subscription plan switch rejects cancelled subscriptions", () => {
  assert.match(source, /resolvedStatus === "CANCELLED"/);

  assert.match(source, /status:\s*409/);
});

test("subscription plan switch rejects any unexpired paid coverage", () => {
  assert.match(source, /const hasPaidCoverage/);

  assert.match(source, /currentPeriodEnd\.getTime\(\)\s*>\s*now\.getTime\(\)/);

  assert.match(source, /ACTIVE_PAID_PERIOD/);
});

test("subscription plan switch changes only the current subscription plan", () => {
  assert.match(source, /tx\.academySubscription\.update/);

  assert.match(source, /planId:\s*targetPlan\.id/);

  assert.doesNotMatch(
    source,
    /subscriptionPayment\.(update|delete|updateMany|deleteMany)/,
  );

  assert.doesNotMatch(
    source,
    /academyCustomOffer\.(update|delete|upsert|create)/,
  );
});

test("subscription plan switch uses a serializable transaction", () => {
  assert.match(source, /prisma\.\$transaction/);

  assert.match(source, /isolationLevel:\s*"Serializable"/);
});

test("subscription plan switch is idempotent when the plan is unchanged", () => {
  assert.match(source, /subscription\.plan\.code === planCode/);

  assert.match(source, /kind:\s*"UNCHANGED"/);

  assert.match(source, /changed:\s*false/);
});

test("subscription plan switch rejects trialing subscriptions", () => {
  assert.match(source, /resolvedStatus === "TRIALING"/);

  assert.match(source, /kind:\s*"TRIALING"/);

  assert.match(source, /Plani mund të ndryshohet pasi të përfundojë trial-i/);
});
