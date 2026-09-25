import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

const switcher = readFileSync(
  join(root, "app/platform-admin/abonimet/plan-switcher.tsx"),
  "utf8",
);

const client = readFileSync(
  join(root, "app/platform-admin/abonimet/subscriptions-client.tsx"),
  "utf8",
);

test("plan switcher exposes the four fixed plans", () => {
  assert.match(switcher, /code:\s*"STARTER"/);
  assert.match(switcher, /code:\s*"PRO"/);
  assert.match(switcher, /code:\s*"PRO_PORTAL"/);
  assert.match(switcher, /code:\s*"UNLIMITED"/);
});

test("plan switcher calls the protected subscription endpoint", () => {
  assert.match(
    switcher,
    /\/api\/platform-admin\/subscriptions\/\$\{subscriptionId\}/,
  );

  assert.match(switcher, /method:\s*"PUT"/);

  assert.match(switcher, /JSON\.stringify\(\{\s*planCode/);
});

test("plan switcher requires confirmation before changing plan", () => {
  assert.match(switcher, /window\.confirm\(/);

  assert.match(switcher, /currentPlanName/);

  assert.match(switcher, /selectedPlan\.name/);
});

test("plan switcher blocks cancelled subscriptions in the UI", () => {
  assert.match(switcher, /subscriptionStatus === "CANCELLED"/);

  assert.match(switcher, /isCancelled/);

  assert.match(switcher, /blocked/);
});

test("plan switcher blocks any unexpired paid coverage in the UI", () => {
  assert.match(switcher, /currentPeriodEnd/);

  assert.match(switcher, /currentPeriodEndTime > Date\.now\(\)/);

  assert.match(switcher, /hasUnexpiredPaidCoverage/);
});

test("plan switcher refreshes server data after success", () => {
  assert.match(switcher, /useRouter/);

  assert.match(switcher, /router\.refresh\(\)/);
});

test("subscriptions page wires the fixed-plan switcher", () => {
  assert.match(client, /import \{ PlanSwitcher \}/);

  assert.match(client, /<PlanSwitcher/);

  assert.match(
    client,
    /currentPlanCode=\{selected\.plan\.code\}/
  );

  assert.match(
    client,
    /currentPeriodEnd=\{selected\.currentPeriodEnd\}/
  );

  assert.doesNotMatch(
    client,
    /<CustomOfferEditor/
  );
});

test("plan switcher blocks trialing subscriptions in the UI", () => {
  assert.match(switcher, /subscriptionStatus === "TRIALING"/);

  assert.match(switcher, /isTrialing/);

  assert.match(switcher, /Plani mund të ndryshohet pasi/);
});
