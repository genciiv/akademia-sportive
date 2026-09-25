import assert from "node:assert/strict";
import test from "node:test";

import {
  resolveAthletePortalEntitlement,
} from "../lib/athlete-portal-entitlement";
import type {
  EffectiveSubscriptionTerms,
} from "../lib/effective-subscription";

const baseTerms: EffectiveSubscriptionTerms = {
  source: "GLOBAL_PLAN",
  planCode: "PRO_PORTAL",
  planName: "Pro + Athlete Portal",
  monthlyPrice: "20000",
  currency: "ALL",
  maxPlayers: 300,
  maxTeams: 25,
  maxStaff: 50,
  maxFacilities: 15,
  maxAthleteAccounts: 50,
  features: [
    "MEDICAL",
    "PERFORMANCE",
    "ATHLETE_PORTAL",
  ],
};

test("athlete portal denies TRIALING even when the plan includes portal access", () => {
  const result = resolveAthletePortalEntitlement({
    status: "TRIALING",
    terms: baseTerms,
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "TRIAL_NOT_ELIGIBLE");
  assert.equal(result.maxAthleteAccounts, 50);
});

test("athlete portal allows ACTIVE subscriptions with feature and positive limit", () => {
  const result = resolveAthletePortalEntitlement({
    status: "ACTIVE",
    terms: baseTerms,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "ALLOWED");
});

test("athlete portal allows GRACE_PERIOD subscriptions", () => {
  const result = resolveAthletePortalEntitlement({
    status: "GRACE_PERIOD",
    terms: baseTerms,
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "ALLOWED");
});

test("athlete portal denies EXPIRED and CANCELLED subscriptions", () => {
  for (const status of ["EXPIRED", "CANCELLED"] as const) {
    const result = resolveAthletePortalEntitlement({
      status,
      terms: baseTerms,
    });

    assert.equal(result.allowed, false);
    assert.equal(result.reason, "SUBSCRIPTION_INACTIVE");
  }
});

test("athlete portal requires ATHLETE_PORTAL in plan features", () => {
  const result = resolveAthletePortalEntitlement({
    status: "ACTIVE",
    terms: {
      ...baseTerms,
      features: ["MEDICAL", "PERFORMANCE"],
    },
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "FEATURE_NOT_INCLUDED");
});

test("zero athlete account limit disables portal accounts", () => {
  const result = resolveAthletePortalEntitlement({
    status: "ACTIVE",
    terms: {
      ...baseTerms,
      maxAthleteAccounts: 0,
    },
  });

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "ACCOUNT_LIMIT_DISABLED");
});

test("null athlete account limit means unlimited capacity", () => {
  const result = resolveAthletePortalEntitlement({
    status: "ACTIVE",
    terms: {
      ...baseTerms,
      planCode: "UNLIMITED",
      planName: "Unlimited",
      monthlyPrice: "30000",
      maxAthleteAccounts: null,
    },
  });

  assert.equal(result.allowed, true);
  assert.equal(result.reason, "ALLOWED");
  assert.equal(result.maxAthleteAccounts, null);
});
