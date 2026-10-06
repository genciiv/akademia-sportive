import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const homeSource = readFileSync(
  join(process.cwd(), "app/page.tsx"),
  "utf8"
);

const pricingSource = readFileSync(
  join(
    process.cwd(),
    "components/public-pricing-plans.tsx"
  ),
  "utf8"
);

test("public homepage uses the dynamic pricing component", () => {
  assert.match(
    homeSource,
    /PublicPricingPlans/
  );

  assert.doesNotMatch(
    homeSource,
    /10,000/
  );

  assert.doesNotMatch(
    homeSource,
    /15,000/
  );

  assert.doesNotMatch(
    homeSource,
    /20,000/
  );

  assert.doesNotMatch(
    homeSource,
    /30,000/
  );
});

test("public pricing reads active plans from the database", () => {
  assert.match(
    pricingSource,
    /prisma\.plan\.findMany/
  );

  assert.match(
    pricingSource,
    /isActive:\s*true/
  );

  assert.match(
    pricingSource,
    /monthlyPrice/
  );

  assert.match(
    pricingSource,
    /maxAthleteAccounts/
  );

  assert.match(
    pricingSource,
    /features/
  );
});

test("public pricing keeps the four known plan presentation variants", () => {
  assert.match(
    pricingSource,
    /STARTER/
  );

  assert.match(
    pricingSource,
    /PRO/
  );

  assert.match(
    pricingSource,
    /PRO_PORTAL/
  );

  assert.match(
    pricingSource,
    /UNLIMITED/
  );

  assert.match(
    pricingSource,
    /\/apliko\?plan=/
  );
});

test("public pricing supports athlete portal configuration", () => {
  assert.match(
    pricingSource,
    /ATHLETE_PORTAL/
  );

  assert.match(
    pricingSource,
    /maxAthleteAccounts/
  );

  assert.match(
    pricingSource,
    /Portali i sportistit/
  );
});

test("public homepage keeps the seven day pro trial message", () => {
  assert.match(
    homeSource,
    /7 ditë PRO/
  );

  assert.match(
    homeSource,
    /falas për çdo akademi të re/
  );
});