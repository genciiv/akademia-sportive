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

test("custom academy offers are defined as subscription overrides", () => {
  const schema = readFileSync(
    join(root, "prisma/schema.prisma"),
    "utf8"
  );

  assert.match(
    schema,
    /model AcademyCustomOffer\s*\{/
  );

  assert.match(
    schema,
    /subscriptionId\s+String\s+@unique/
  );

  assert.match(
    schema,
    /subscription\s+AcademySubscription\s+@relation/
  );

  assert.match(
    schema,
    /monthlyPrice\s+Decimal\?/
  );

  assert.match(
    schema,
    /maxPlayers\s+Int\?/
  );

  assert.match(
    schema,
    /maxTeams\s+Int\?/
  );

  assert.match(
    schema,
    /maxStaff\s+Int\?/
  );

  assert.match(
    schema,
    /maxFacilities\s+Int\?/
  );

  assert.match(
    schema,
    /overrideFeatures\s+Boolean\s+@default\(false\)/
  );

  assert.match(
    schema,
    /features\s+PlanFeature\[\]\s+@default\(\[\]\)/
  );

  assert.match(
    schema,
    /customOffer\s+AcademyCustomOffer\?/
  );
});

test("custom offer migration enforces database safety constraints", () => {
  const migration = readFileSync(
    join(
      root,
      "prisma/migrations/20260922111456_add_academy_custom_offers/migration.sql"
    ),
    "utf8"
  );

  assert.match(
    migration,
    /CREATE TABLE "AcademyCustomOffer"/
  );

  assert.match(
    migration,
    /CREATE UNIQUE INDEX "AcademyCustomOffer_subscriptionId_key"/
  );

  assert.match(
    migration,
    /CONSTRAINT "AcademyCustomOffer_monthlyPrice_check"/
  );

  assert.match(
    migration,
    /CONSTRAINT "AcademyCustomOffer_maxPlayers_check"/
  );

  assert.match(
    migration,
    /CONSTRAINT "AcademyCustomOffer_maxTeams_check"/
  );

  assert.match(
    migration,
    /CONSTRAINT "AcademyCustomOffer_maxStaff_check"/
  );

  assert.match(
    migration,
    /CONSTRAINT "AcademyCustomOffer_maxFacilities_check"/
  );

  assert.match(
    migration,
    /CONSTRAINT "AcademyCustomOffer_validity_check"/
  );

  assert.match(
    migration,
    /ON DELETE CASCADE ON UPDATE CASCADE/
  );
});

test("platform admin custom offer API is protected and preserves audit history", () => {
  const source = readFileSync(
    join(
      root,
      "app/api/platform-admin/subscriptions/[subscriptionId]/custom-offer/route.ts"
    ),
    "utf8"
  );

  assert.match(
    source,
    /getPlatformAdminAccess\(\)/
  );

  assert.match(
    source,
    /export async function PUT/
  );

  assert.match(
    source,
    /academyCustomOffer\.upsert/
  );

  assert.match(
    source,
    /createdById:\s*access\.user\.id/
  );

  assert.match(
    source,
    /updatedById:\s*access\.user\.id/
  );

  assert.match(
    source,
    /export async function DELETE/
  );

  assert.match(
    source,
    /academyCustomOffer\.update/
  );

  assert.match(
    source,
    /isActive:\s*false/
  );

  assert.doesNotMatch(
    source,
    /academyCustomOffer\.delete\s*\(/
  );
});

test("plan limits resolve custom offers through the centralized entitlement resolver", () => {
  const source = readFileSync(
    join(root, "lib/plan-limits.ts"),
    "utf8"
  );

  assert.match(
    source,
    /resolveEffectiveSubscriptionTerms/
  );

  assert.match(
    source,
    /customOffer:/
  );

  assert.match(
    source,
    /resolveSubscriptionStatus/
  );

  assert.match(
    source,
    /effective\.maxPlayers/
  );

  assert.match(
    source,
    /effective\.maxTeams/
  );

  assert.match(
    source,
    /effective\.maxStaff/
  );

  assert.match(
    source,
    /effective\.maxFacilities/
  );

  assert.match(
    source,
    /planCode: effective\.planCode/
  );
});
