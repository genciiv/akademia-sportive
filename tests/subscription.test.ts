import assert from "node:assert/strict";
import test from "node:test";

import {
  addUtcMonthsClamped,
  assertSubscriptionPaymentMonths,
  calculatePaidPeriod,
  calculatePaymentLifecycle,
  calculateSubscriptionTotal,
  isSubscriptionPaymentMonths,
  resolveSubscriptionStatus,
} from "../lib/subscription";

test("only 1 3 6 and 12 months are valid payment periods", () => {
  for (const months of [1, 3, 6, 12]) {
    assert.equal(
      isSubscriptionPaymentMonths(months),
      true
    );
  }

  for (const months of [0, 2, 4, 9, 24]) {
    assert.equal(
      isSubscriptionPaymentMonths(months),
      false
    );
  }

  assert.throws(
    () => assertSubscriptionPaymentMonths(2),
    /1, 3, 6 ose 12/
  );
});

test("STARTER totals are correct for all supported periods", () => {
  assert.equal(
    calculateSubscriptionTotal(12000, 1),
    12000
  );

  assert.equal(
    calculateSubscriptionTotal(12000, 3),
    36000
  );

  assert.equal(
    calculateSubscriptionTotal(12000, 6),
    72000
  );

  assert.equal(
    calculateSubscriptionTotal(12000, 12),
    144000
  );
});

test("PRO totals are correct for all supported periods", () => {
  assert.equal(
    calculateSubscriptionTotal(20000, 1),
    20000
  );

  assert.equal(
    calculateSubscriptionTotal(20000, 3),
    60000
  );

  assert.equal(
    calculateSubscriptionTotal(20000, 6),
    120000
  );

  assert.equal(
    calculateSubscriptionTotal(20000, 12),
    240000
  );
});

test("active subscription extends from current period end", () => {
  const paidAt =
    new Date("2026-09-17T12:00:00.000Z");

  const currentPeriodEnd =
    new Date("2026-10-01T12:00:00.000Z");

  const result = calculatePaidPeriod({
    paidAt,
    trialEndsAt: null,
    currentPeriodEnd,
    months: 3,
  });

  assert.equal(
    result.periodStart.toISOString(),
    "2026-10-01T12:00:00.000Z"
  );

  assert.equal(
    result.periodEnd.toISOString(),
    "2027-01-01T12:00:00.000Z"
  );
});

test("expired subscription starts from payment date", () => {
  const paidAt =
    new Date("2026-09-17T12:00:00.000Z");

  const currentPeriodEnd =
    new Date("2026-09-10T12:00:00.000Z");

  const result = calculatePaidPeriod({
    paidAt,
    trialEndsAt: null,
    currentPeriodEnd,
    months: 1,
  });

  assert.equal(
    result.periodStart.toISOString(),
    "2026-09-17T12:00:00.000Z"
  );

  assert.equal(
    result.periodEnd.toISOString(),
    "2026-10-17T12:00:00.000Z"
  );
});

test("payment during trial starts after the trial ends", () => {
  const paidAt =
    new Date("2026-09-25T12:00:00.000Z");

  const trialEndsAt =
    new Date("2026-09-29T12:00:00.000Z");

  const result = calculatePaidPeriod({
    paidAt,
    trialEndsAt,
    currentPeriodEnd: null,
    months: 3,
  });

  assert.equal(
    result.periodStart.toISOString(),
    "2026-09-29T12:00:00.000Z"
  );

  assert.equal(
    result.periodEnd.toISOString(),
    "2026-12-29T12:00:00.000Z"
  );
});

test("month addition clamps safely at the end of month", () => {
  assert.equal(
    addUtcMonthsClamped(
      new Date("2026-01-31T12:00:00.000Z"),
      1
    ).toISOString(),
    "2026-02-28T12:00:00.000Z"
  );

  assert.equal(
    addUtcMonthsClamped(
      new Date("2028-01-31T12:00:00.000Z"),
      1
    ).toISOString(),
    "2028-02-29T12:00:00.000Z"
  );
});

test("subscription status resolves from lifecycle dates", () => {
  const now =
    new Date("2026-09-17T12:00:00.000Z");

  assert.equal(
    resolveSubscriptionStatus({
      currentStatus: "ACTIVE",
      now,
      trialEndsAt: null,
      currentPeriodEnd:
        new Date("2026-10-17T12:00:00.000Z"),
      graceEndsAt: null,
      cancelledAt: null,
    }),
    "ACTIVE"
  );

  assert.equal(
    resolveSubscriptionStatus({
      currentStatus: "GRACE_PERIOD",
      now,
      trialEndsAt: null,
      currentPeriodEnd:
        new Date("2026-09-16T12:00:00.000Z"),
      graceEndsAt:
        new Date("2026-09-24T12:00:00.000Z"),
      cancelledAt: null,
    }),
    "GRACE_PERIOD"
  );

  assert.equal(
    resolveSubscriptionStatus({
      currentStatus: "TRIALING",
      now,
      trialEndsAt:
        new Date("2026-09-24T12:00:00.000Z"),
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelledAt: null,
    }),
    "TRIALING"
  );

  assert.equal(
    resolveSubscriptionStatus({
      currentStatus: "TRIALING",
      now,
      trialEndsAt:
        new Date("2026-09-16T12:00:00.000Z"),
      currentPeriodEnd: null,
      graceEndsAt: null,
      cancelledAt: null,
    }),
    "EXPIRED"
  );

  assert.equal(
    resolveSubscriptionStatus({
      currentStatus: "CANCELLED",
      now,
      trialEndsAt:
        new Date("2026-09-24T12:00:00.000Z"),
      currentPeriodEnd:
        new Date("2026-10-17T12:00:00.000Z"),
      graceEndsAt: null,
      cancelledAt:
        new Date("2026-09-15T12:00:00.000Z"),
    }),
    "CANCELLED"
  );
});

test("scheduled paid period preserves trial until its start date", () => {
  const trialEndsAt =
    new Date("2026-09-29T12:00:00.000Z");

  const currentPeriodStart =
    new Date("2026-09-29T12:00:00.000Z");

  const currentPeriodEnd =
    new Date("2026-12-29T12:00:00.000Z");

  const beforePaidPeriod =
    resolveSubscriptionStatus({
      currentStatus: "TRIALING",
      now: new Date("2026-09-25T12:00:00.000Z"),
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      graceEndsAt: null,
      cancelledAt: null,
    });

  assert.equal(beforePaidPeriod, "TRIALING");

  const atPaidPeriodStart =
    resolveSubscriptionStatus({
      currentStatus: "TRIALING",
      now: new Date("2026-09-29T12:00:00.000Z"),
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      graceEndsAt: null,
      cancelledAt: null,
    });

  assert.equal(atPaidPeriodStart, "ACTIVE");
});


test("payment lifecycle preserves an active trial", () => {
  const result = calculatePaymentLifecycle({
    currentStatus: "TRIALING",
    paidAt: new Date("2026-09-25T12:00:00.000Z"),
    trialEndsAt:
      new Date("2026-09-29T12:00:00.000Z"),
    currentPeriodStart: null,
    currentPeriodEnd: null,
    graceEndsAt: null,
    cancelledAt: null,
    months: 3,
  });

  assert.equal(
    result.statusBeforePayment,
    "TRIALING"
  );
  assert.equal(result.status, "TRIALING");
  assert.equal(
    result.periodStart.toISOString(),
    "2026-09-29T12:00:00.000Z"
  );
  assert.equal(
    result.periodEnd.toISOString(),
    "2026-12-29T12:00:00.000Z"
  );
  assert.equal(
    result.subscriptionPeriodStart?.toISOString(),
    "2026-09-29T12:00:00.000Z"
  );
  assert.equal(result.graceEndsAt, null);
});

test("payment lifecycle extends an active paid period", () => {
  const result = calculatePaymentLifecycle({
    currentStatus: "ACTIVE",
    paidAt: new Date("2026-09-25T12:00:00.000Z"),
    trialEndsAt:
      new Date("2026-09-20T12:00:00.000Z"),
    currentPeriodStart:
      new Date("2026-09-20T12:00:00.000Z"),
    currentPeriodEnd:
      new Date("2026-10-20T12:00:00.000Z"),
    graceEndsAt: null,
    cancelledAt: null,
    months: 3,
  });

  assert.equal(
    result.statusBeforePayment,
    "ACTIVE"
  );
  assert.equal(result.status, "ACTIVE");
  assert.equal(
    result.periodStart.toISOString(),
    "2026-10-20T12:00:00.000Z"
  );
  assert.equal(
    result.periodEnd.toISOString(),
    "2027-01-20T12:00:00.000Z"
  );
  assert.equal(
    result.subscriptionPeriodStart?.toISOString(),
    "2026-09-20T12:00:00.000Z"
  );
});

test("payment lifecycle reactivates an expired subscription", () => {
  const paidAt =
    new Date("2026-09-25T12:00:00.000Z");

  const result = calculatePaymentLifecycle({
    currentStatus: "EXPIRED",
    paidAt,
    trialEndsAt:
      new Date("2026-09-10T12:00:00.000Z"),
    currentPeriodStart:
      new Date("2026-08-10T12:00:00.000Z"),
    currentPeriodEnd:
      new Date("2026-09-10T12:00:00.000Z"),
    graceEndsAt: null,
    cancelledAt: null,
    months: 1,
  });

  assert.equal(
    result.statusBeforePayment,
    "EXPIRED"
  );
  assert.equal(result.status, "ACTIVE");
  assert.equal(
    result.periodStart.toISOString(),
    paidAt.toISOString()
  );
  assert.equal(
    result.periodEnd.toISOString(),
    "2026-10-25T12:00:00.000Z"
  );
});

test("payment lifecycle clears grace period and activates subscription", () => {
  const paidAt =
    new Date("2026-09-25T12:00:00.000Z");

  const result = calculatePaymentLifecycle({
    currentStatus: "GRACE_PERIOD",
    paidAt,
    trialEndsAt:
      new Date("2026-08-01T12:00:00.000Z"),
    currentPeriodStart:
      new Date("2026-08-20T12:00:00.000Z"),
    currentPeriodEnd:
      new Date("2026-09-20T12:00:00.000Z"),
    graceEndsAt:
      new Date("2026-09-30T12:00:00.000Z"),
    cancelledAt: null,
    months: 1,
  });

  assert.equal(
    result.statusBeforePayment,
    "GRACE_PERIOD"
  );
  assert.equal(result.status, "ACTIVE");
  assert.equal(
    result.periodStart.toISOString(),
    paidAt.toISOString()
  );
  assert.equal(
    result.periodEnd.toISOString(),
    "2026-10-25T12:00:00.000Z"
  );
  assert.equal(result.graceEndsAt, null);
});

test("payment lifecycle rejects a cancelled subscription", () => {
  assert.throws(
    () =>
      calculatePaymentLifecycle({
        currentStatus: "CANCELLED",
        paidAt:
          new Date("2026-09-25T12:00:00.000Z"),
        trialEndsAt: null,
        currentPeriodStart: null,
        currentPeriodEnd: null,
        graceEndsAt: null,
        cancelledAt:
          new Date("2026-09-20T12:00:00.000Z"),
        months: 1,
      }),
    /riaktivizohet/
  );
});
