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

test("current plan schema uses nullable limits and no custom-offer model", () => {
  const schema = readFileSync(
    join(root, "prisma/schema.prisma"),
    "utf8"
  );

  assert.match(schema, /maxPlayers\s+Int\?/);
  assert.match(schema, /maxTeams\s+Int\?/);
  assert.match(schema, /maxStaff\s+Int\?/);
  assert.match(schema, /maxFacilities\s+Int\?/);
  assert.match(schema, /maxAthleteAccounts\s+Int\?/);

  assert.doesNotMatch(
    schema,
    /model AcademyCustomOffer\s*\{/
  );

  assert.doesNotMatch(
    schema,
    /customOffer\s+AcademyCustomOffer/
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

test("fixed-plan migration updates prices, adds UNLIMITED, and preserves the legacy custom-offer table for deployment safety", () => {
  const migration = readFileSync(
    join(
      root,
      "prisma/migrations/20260925070000_fixed_plans_unlimited/migration.sql"
    ),
    "utf8"
  );

  assert.match(migration, /10000\.00/);
  assert.match(migration, /15000\.00/);
  assert.match(migration, /20000\.00/);
  assert.match(migration, /30000\.00/);

  assert.match(
    migration,
    /WHERE "code" = 'STARTER'/
  );

  assert.match(
    migration,
    /WHERE "code" = 'PRO'/
  );

  assert.match(
    migration,
    /WHERE "code" = 'PRO_PORTAL'/
  );

  assert.match(
    migration,
    /'UNLIMITED'/
  );

  assert.match(
    migration,
    /ALTER COLUMN "maxPlayers" DROP NOT NULL/
  );

  assert.match(
    migration,
    /ALTER COLUMN "maxTeams" DROP NOT NULL/
  );

  assert.match(
    migration,
    /ALTER COLUMN "maxStaff" DROP NOT NULL/
  );

  assert.match(
    migration,
    /ALTER COLUMN "maxFacilities" DROP NOT NULL/
  );

  assert.match(
    migration,
    /ALTER COLUMN "maxAthleteAccounts" DROP NOT NULL/
  );

  assert.match(
    migration,
    /"planId"\s*=\s*'plan_pro_portal'/
  );

  assert.match(
    migration,
    /'ATHLETE_PORTAL'::"PlanFeature"/
  );

  assert.doesNotMatch(
    migration,
    /DROP TABLE\s+"AcademyCustomOffer"/
  );
});

test("platform admin payment API records immutable commercial snapshots atomically", () => {
  const source = readFileSync(
    join(
      root,
      "app/api/platform-admin/subscriptions/[subscriptionId]/payments/route.ts"
    ),
    "utf8"
  );

  assert.match(
    source,
    /getPlatformAdminAccess\(\)/
  );

  assert.match(
    source,
    /export async function POST/
  );

  assert.match(
    source,
    /assertSubscriptionPaymentMonths\(rawMonths\)/
  );

  assert.match(
    source,
    /method !== "CASH"/
  );

  assert.match(
    source,
    /const paidAt = new Date\(\)/
  );

  assert.doesNotMatch(
    source,
    /body\.paidAt/
  );

  assert.match(
    source,
    /prisma\.\$transaction\(/
  );

  assert.match(
    source,
    /isolationLevel:\s*"Serializable"/
  );

  assert.match(
    source,
    /const MAX_TRANSACTION_RETRIES = 3/
  );

  assert.match(
    source,
    /error\.code === "P2034"/
  );

  assert.match(
    source,
    /attempt >= MAX_TRANSACTION_RETRIES/
  );

  assert.match(
    source,
    /resolveEffectiveCommercialTerms\(/
  );

  assert.match(
    source,
    /calculatePaymentLifecycle\(/
  );

  assert.match(
    source,
    /tx\.subscriptionPayment\.create/
  );

  assert.match(
    source,
    /monthlyPrice:\s*commercial\.monthlyPrice/
  );

  assert.match(
    source,
    /totalAmount:\s*totalAmount\.toFixed\(2\)/
  );

  assert.match(
    source,
    /currency:\s*commercial\.currency/
  );

  assert.match(
    source,
    /recordedById:\s*access\.user\.id/
  );

  assert.match(
    source,
    /periodStart:\s*lifecycle\.periodStart/
  );

  assert.match(
    source,
    /periodEnd:\s*lifecycle\.periodEnd/
  );

  assert.match(
    source,
    /tx\.academySubscription\.update/
  );

  assert.match(
    source,
    /status:\s*lifecycle\.status/
  );

  assert.match(
    source,
    /currentPeriodStart:\s*lifecycle\.subscriptionPeriodStart/
  );

  assert.match(
    source,
    /currentPeriodEnd:\s*lifecycle\.periodEnd/
  );

  assert.match(
    source,
    /graceEndsAt:\s*lifecycle\.graceEndsAt/
  );

  assert.match(
    source,
    /kind:\s*"CANCELLED"/
  );

  assert.match(
    source,
    /status:\s*409/
  );
});

test("platform admin subscriptions serialize the resolved lifecycle status", () => {
  const source = readFileSync(
    join(
      root,
      "app/platform-admin/abonimet/page.tsx"
    ),
    "utf8"
  );

  assert.match(
    source,
    /resolveSubscriptionStatus/
  );

  assert.match(
    source,
    /const now = new Date\(\)/
  );

  assert.match(
    source,
    /status:\s*resolveSubscriptionStatus\(/
  );

  assert.match(
    source,
    /currentStatus:\s*subscription\.status/
  );

  assert.match(
    source,
    /trialEndsAt:\s*subscription\.trialEndsAt/
  );

  assert.match(
    source,
    /currentPeriodStart:\s*subscription\.currentPeriodStart/
  );

  assert.match(
    source,
    /currentPeriodEnd:\s*subscription\.currentPeriodEnd/
  );

  assert.match(
    source,
    /graceEndsAt:\s*subscription\.graceEndsAt/
  );

  assert.match(
    source,
    /cancelledAt:\s*subscription\.cancelledAt/
  );
});

test("platform admin payment UI uses effective commercial terms and preserves payment lifecycle rules", () => {
  const pageSource = readFileSync(
    join(
      root,
      "app/platform-admin/abonimet/page.tsx"
    ),
    "utf8"
  );

  const clientSource = readFileSync(
    join(
      root,
      "app/platform-admin/abonimet/subscriptions-client.tsx"
    ),
    "utf8"
  );

  const recorderSource = readFileSync(
    join(
      root,
      "app/platform-admin/abonimet/payment-recorder.tsx"
    ),
    "utf8"
  );

  assert.match(
    pageSource,
    /resolveEffectiveCommercialTerms/
  );

  assert.match(
    pageSource,
    /commercialTerms:\s*resolveEffectiveCommercialTerms\(/
  );

  assert.match(
    clientSource,
    /subscription\s*\.commercialTerms\s*\.monthlyPrice/
  );

  assert.match(
    clientSource,
    /selected\.commercialTerms\s*\.monthlyPrice/
  );

  assert.match(
    clientSource,
    /<PaymentRecorder/
  );

  assert.match(
    clientSource,
    /commercialTerms=\{\s*selected\.commercialTerms\s*\}/
  );

  assert.match(
    recorderSource,
    /const PAYMENT_MONTHS = \[\s*1,\s*3,\s*6,\s*12,\s*\] as const/
  );

  assert.match(
    recorderSource,
    /subscriptionStatus === "CANCELLED"/
  );

  assert.match(
    recorderSource,
    /subscriptionStatus ===\s*"TRIALING"/
  );

  assert.match(
    recorderSource,
    /method: "CASH"/
  );

  assert.match(
    recorderSource,
    /\/api\/platform-admin\/subscriptions\/\$\{subscriptionId\}\/payments/
  );

  assert.match(
    recorderSource,
    /method: "POST"/
  );

  assert.match(
    recorderSource,
    /window\.confirm\(/
  );

  assert.match(
    recorderSource,
    /router\.refresh\(\)/
  );

  assert.match(
    recorderSource,
    /maxLength=\{2000\}/
  );

  // payment recorder must avoid locale-dependent SSR formatting
  assert.doesNotMatch(
    recorderSource,
    /new Intl\.DateTimeFormat|toLocaleString/
  );

  assert.match(
    recorderSource,
    /getUTCDate\(\)[\s\S]*getUTCMonth\(\)[\s\S]*getUTCFullYear\(\)/
  );

  assert.doesNotMatch(
    recorderSource,
    /monthlyPrice\s*:.*JSON\.stringify/
  );

  assert.doesNotMatch(
    recorderSource,
    /totalAmount\s*:.*JSON\.stringify/
  );
});

test("plan limits use fixed subscription terms and treat null as unlimited", () => {
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
    /resolveSubscriptionStatus/
  );

  assert.match(
    source,
    /limit:\s*number\s*\|\s*null/
  );

  assert.match(source, /effective\.maxPlayers/);
  assert.match(source, /effective\.maxTeams/);
  assert.match(source, /effective\.maxStaff/);
  assert.match(source, /effective\.maxFacilities/);

  assert.match(
    source,
    /limit\s*!==\s*null\s*&&\s*current\s*>=\s*limit/
  );

  assert.match(
    source,
    /planCode:\s*effective\.planCode/
  );

  assert.doesNotMatch(
    source,
    /customOffer:/
  );
});
