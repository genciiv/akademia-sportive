import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const root = process.cwd();

test("academy onboarding creates an atomic 7-day PRO trial", () => {
  const source = readFileSync(
    join(root, "app/api/academy/route.ts"),
    "utf8"
  );

  assert.match(
    source,
    /prisma\.\$transaction\(async \(tx\) =>/
  );

  assert.match(
    source,
    /tx\.plan\.findUnique\(\{[\s\S]*code:\s*"PRO"/
  );

  assert.match(
    source,
    /trialEndsAt\.setUTCDate\([\s\S]*\+\s*7/
  );

  assert.match(
    source,
    /tx\.academySubscription\.create/
  );

  assert.match(
    source,
    /planId:\s*proPlan\.id/
  );

  assert.match(
    source,
    /status:\s*"TRIALING"/
  );

  assert.match(source, /trialStartsAt/);
  assert.match(source, /trialEndsAt/);
});

test("Prisma schema defines plans subscriptions and cash payments", () => {
  const schema = readFileSync(
    join(root, "prisma/schema.prisma"),
    "utf8"
  );

  assert.match(schema, /model Plan\s*\{/);
  assert.match(schema, /model AcademySubscription\s*\{/);
  assert.match(schema, /model SubscriptionPayment\s*\{/);

  assert.match(schema, /enum SubscriptionStatus\s*\{/);
  assert.match(schema, /TRIALING/);
  assert.match(schema, /ACTIVE/);
  assert.match(schema, /GRACE_PERIOD/);
  assert.match(schema, /EXPIRED/);
  assert.match(schema, /CANCELLED/);

  assert.match(
    schema,
    /enum SubscriptionPaymentMethod\s*\{[\s\S]*CASH/
  );
});

test("migration seeds STARTER and PRO with the expected limits and prices", () => {
  const migration = readFileSync(
    join(
      root,
      "prisma/migrations/20260917211032_add_plans_subscriptions/migration.sql"
    ),
    "utf8"
  );

  assert.match(migration, /'STARTER'/);
  assert.match(migration, /12000\.00/);
  assert.match(migration, /\b35\b/);
  assert.match(migration, /\b5\b/);

  assert.match(migration, /'PRO'/);
  assert.match(migration, /20000\.00/);
  assert.match(migration, /\b300\b/);
  assert.match(migration, /\b25\b/);
  assert.match(migration, /\b50\b/);
  assert.match(migration, /\b15\b/);
});

test("migration restricts payment periods to 1 3 6 or 12 months", () => {
  const migration = readFileSync(
    join(
      root,
      "prisma/migrations/20260917211032_add_plans_subscriptions/migration.sql"
    ),
    "utf8"
  );

  assert.match(
    migration,
    /CHECK\s*\(\s*"months"\s+IN\s*\(\s*1\s*,\s*3\s*,\s*6\s*,\s*12\s*\)\s*\)/
  );
});

test("migration grants existing academies a fresh 7-day PRO trial", () => {
  const migration = readFileSync(
    join(
      root,
      "prisma/migrations/20260917211032_add_plans_subscriptions/migration.sql"
    ),
    "utf8"
  );

  assert.match(
    migration,
    /plan\."code"\s*=\s*'PRO'/
  );

  assert.match(
    migration,
    /'TRIALING'::"SubscriptionStatus"/
  );

  assert.match(
    migration,
    /CURRENT_TIMESTAMP\s*\+\s*INTERVAL\s*'7 days'/
  );

  assert.match(
    migration,
    /ON CONFLICT\s*\("academyId"\)\s*DO NOTHING/
  );
});