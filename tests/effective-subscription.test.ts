import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveEffectiveCommercialTerms,
  resolveEffectiveSubscriptionTerms,
  type EffectivePlan,
} from "../lib/effective-subscription";

const now = new Date("2026-09-25T12:00:00.000Z");

const plan: EffectivePlan = {
  code: "PRO",
  name: "Pro",
  monthlyPrice: 15000,
  currency: "ALL",
  maxPlayers: 300,
  maxTeams: 25,
  maxStaff: 50,
  maxFacilities: 15,
  maxAthleteAccounts: 0,
  features: [
    "MEDICAL",
    "PERFORMANCE",
    "ADVANCED_REPORTS",
  ],
};

test("subscription terms come only from the fixed global plan", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.planCode, "PRO");
  assert.equal(result.planName, "Pro");
  assert.equal(result.monthlyPrice, "15000");
  assert.equal(result.currency, "ALL");
  assert.equal(result.maxPlayers, 300);
  assert.equal(result.maxTeams, 25);
  assert.equal(result.maxStaff, 50);
  assert.equal(result.maxFacilities, 15);
  assert.equal(result.maxAthleteAccounts, 0);
  assert.deepEqual(result.features, plan.features);
});

test("trial status does not change the fixed plan terms", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "TRIALING",
    plan,
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.planCode, "PRO");
  assert.equal(result.monthlyPrice, "15000");
  assert.equal(result.maxPlayers, 300);
  assert.deepEqual(result.features, plan.features);
});

test("null plan limits are preserved as unlimited", () => {
  const unlimitedPlan: EffectivePlan = {
    code: "UNLIMITED",
    name: "Unlimited",
    monthlyPrice: 30000,
    currency: "ALL",
    maxPlayers: null,
    maxTeams: null,
    maxStaff: null,
    maxFacilities: null,
    maxAthleteAccounts: null,
    features: [
      "MEDICAL",
      "PHYSICAL_PROFILE",
      "PERFORMANCE",
      "SCOUTING",
      "TACTICS",
      "KNOWLEDGE_BASE",
      "FACILITY_SCHEDULING",
      "ADVANCED_REPORTS",
      "ATHLETE_PORTAL",
    ],
  };

  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan: unlimitedPlan,
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.planCode, "UNLIMITED");
  assert.equal(result.planName, "Unlimited");
  assert.equal(result.monthlyPrice, "30000");
  assert.equal(result.maxPlayers, null);
  assert.equal(result.maxTeams, null);
  assert.equal(result.maxStaff, null);
  assert.equal(result.maxFacilities, null);
  assert.equal(result.maxAthleteAccounts, null);
  assert.ok(result.features.includes("ATHLETE_PORTAL"));
});

test("commercial terms come only from the fixed global plan", () => {
  const result = resolveEffectiveCommercialTerms({
    plan,
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.planCode, "PRO");
  assert.equal(result.planName, "Pro");
  assert.equal(result.monthlyPrice, "15000");
  assert.equal(result.currency, "ALL");
});
