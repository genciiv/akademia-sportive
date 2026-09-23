import assert from "node:assert/strict";
import test from "node:test";

import {
  isCustomOfferActive,
  resolveEffectiveCommercialTerms,
  resolveEffectiveSubscriptionTerms,
  type EffectiveCustomOffer,
  type EffectivePlan,
} from "../lib/effective-subscription";

const now = new Date("2026-09-22T12:00:00.000Z");

const plan: EffectivePlan = {
  code: "PRO",
  name: "PRO",
  monthlyPrice: 20000,
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

function offer(
  overrides: Partial<EffectiveCustomOffer> = {}
): EffectiveCustomOffer {
  return {
    monthlyPrice: null,
    currency: null,
    maxPlayers: null,
    maxTeams: null,
    maxStaff: null,
    maxFacilities: null,
    maxAthleteAccounts: null,
    overrideFeatures: false,
    features: [],
    validFrom: new Date("2026-09-01T00:00:00.000Z"),
    validUntil: null,
    isActive: true,
    ...overrides,
  };
}

test("falls back to the global plan when there is no custom offer", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    customOffer: null,
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.customOfferActive, false);
  assert.equal(result.monthlyPrice, "20000");
  assert.equal(result.currency, "ALL");
  assert.equal(result.maxPlayers, 300);
  assert.deepEqual(result.features, plan.features);
});

test("an active custom offer can override only the monthly price", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    customOffer: offer({
      monthlyPrice: 15000,
    }),
    now,
  });

  assert.equal(result.source, "CUSTOM_OFFER");
  assert.equal(result.monthlyPrice, "15000");
  assert.equal(result.currency, "ALL");
  assert.equal(result.maxPlayers, 300);
  assert.equal(result.maxTeams, 25);
  assert.equal(result.maxStaff, 50);
  assert.equal(result.maxFacilities, 15);
  assert.deepEqual(result.features, plan.features);
});

test("an active custom offer overrides selected limits and inherits the rest", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    customOffer: offer({
      maxPlayers: 500,
      maxStaff: 80,
    }),
    now,
  });

  assert.equal(result.maxPlayers, 500);
  assert.equal(result.maxTeams, 25);
  assert.equal(result.maxStaff, 80);
  assert.equal(result.maxFacilities, 15);
});

test("features inherit from the plan when overrideFeatures is false", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    customOffer: offer({
      overrideFeatures: false,
      features: ["MEDICAL"],
    }),
    now,
  });

  assert.deepEqual(result.features, plan.features);
});

test("features can be explicitly replaced with an empty list", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    customOffer: offer({
      overrideFeatures: true,
      features: [],
    }),
    now,
  });

  assert.deepEqual(result.features, []);
});

test("features can be explicitly replaced with a custom list", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "ACTIVE",
    plan,
    customOffer: offer({
      overrideFeatures: true,
      features: ["MEDICAL"],
    }),
    now,
  });

  assert.deepEqual(result.features, ["MEDICAL"]);
});

test("inactive future and expired offers are not active", () => {
  assert.equal(
    isCustomOfferActive(
      offer({
        isActive: false,
      }),
      now
    ),
    false
  );

  assert.equal(
    isCustomOfferActive(
      offer({
        validFrom: new Date("2026-09-23T00:00:00.000Z"),
      }),
      now
    ),
    false
  );

  assert.equal(
    isCustomOfferActive(
      offer({
        validUntil: new Date("2026-09-22T12:00:00.000Z"),
      }),
      now
    ),
    false
  );
});

test("offer is active exactly at validFrom", () => {
  assert.equal(
    isCustomOfferActive(
      offer({
        validFrom: new Date("2026-09-22T12:00:00.000Z"),
      }),
      now
    ),
    true
  );
});

test("TRIALING always keeps the global PRO terms", () => {
  const result = resolveEffectiveSubscriptionTerms({
    status: "TRIALING",
    plan,
    customOffer: offer({
      monthlyPrice: 10000,
      currency: "EUR",
      maxPlayers: 999,
      maxTeams: 99,
      maxStaff: 99,
      maxFacilities: 99,
      overrideFeatures: true,
      features: [],
    }),
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.customOfferActive, false);
  assert.equal(result.monthlyPrice, "20000");
  assert.equal(result.currency, "ALL");
  assert.equal(result.maxPlayers, 300);
  assert.equal(result.maxTeams, 25);
  assert.equal(result.maxStaff, 50);
  assert.equal(result.maxFacilities, 15);
  assert.deepEqual(result.features, plan.features);
});


test("commercial terms fall back to the global plan without a custom offer", () => {
  const result = resolveEffectiveCommercialTerms({
    plan,
    customOffer: null,
    now,
  });

  assert.equal(result.source, "GLOBAL_PLAN");
  assert.equal(result.customOfferActive, false);
  assert.equal(result.monthlyPrice, "20000");
  assert.equal(result.currency, "ALL");
});

test("commercial terms use an active custom offer during trial", () => {
  const customOffer = offer({
    monthlyPrice: 15000,
    currency: "ALL",
  });

  const access = resolveEffectiveSubscriptionTerms({
    status: "TRIALING",
    plan,
    customOffer,
    now,
  });

  const commercial = resolveEffectiveCommercialTerms({
    plan,
    customOffer,
    now,
  });

  assert.equal(access.source, "GLOBAL_PLAN");
  assert.equal(access.monthlyPrice, "20000");
  assert.equal(access.maxPlayers, 300);
  assert.deepEqual(access.features, plan.features);

  assert.equal(commercial.source, "CUSTOM_OFFER");
  assert.equal(commercial.customOfferActive, true);
  assert.equal(commercial.monthlyPrice, "15000");
  assert.equal(commercial.currency, "ALL");
});

test("commercial terms can override currency independently", () => {
  const result = resolveEffectiveCommercialTerms({
    plan,
    customOffer: offer({
      monthlyPrice: 175,
      currency: "EUR",
    }),
    now,
  });

  assert.equal(result.source, "CUSTOM_OFFER");
  assert.equal(result.customOfferActive, true);
  assert.equal(result.monthlyPrice, "175");
  assert.equal(result.currency, "EUR");
});

test("commercial terms ignore inactive future and expired custom offers", () => {
  const unavailableOffers = [
    offer({
      isActive: false,
      monthlyPrice: 10000,
    }),
    offer({
      validFrom: new Date("2026-09-23T00:00:00.000Z"),
      monthlyPrice: 10000,
    }),
    offer({
      validUntil: new Date("2026-09-22T12:00:00.000Z"),
      monthlyPrice: 10000,
    }),
  ];

  for (const customOffer of unavailableOffers) {
    const result = resolveEffectiveCommercialTerms({
      plan,
      customOffer,
      now,
    });

    assert.equal(result.source, "GLOBAL_PLAN");
    assert.equal(result.customOfferActive, false);
    assert.equal(result.monthlyPrice, "20000");
    assert.equal(result.currency, "ALL");
  }
});
