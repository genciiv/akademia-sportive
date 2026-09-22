export const SUBSCRIPTION_PAYMENT_MONTHS = [1, 3, 6, 12] as const;

export type SubscriptionPaymentMonths =
  (typeof SUBSCRIPTION_PAYMENT_MONTHS)[number];

export type SubscriptionAccessStatus =
  | "TRIALING"
  | "ACTIVE"
  | "GRACE_PERIOD"
  | "EXPIRED"
  | "CANCELLED";

export function isSubscriptionPaymentMonths(
  value: number
): value is SubscriptionPaymentMonths {
  return SUBSCRIPTION_PAYMENT_MONTHS.includes(
    value as SubscriptionPaymentMonths
  );
}

export function assertSubscriptionPaymentMonths(
  value: number
): asserts value is SubscriptionPaymentMonths {
  if (!isSubscriptionPaymentMonths(value)) {
    throw new Error(
      "Periudha e pagesës duhet të jetë 1, 3, 6 ose 12 muaj."
    );
  }
}

export function calculateSubscriptionTotal(
  monthlyPrice: number,
  months: SubscriptionPaymentMonths
) {
  if (!Number.isFinite(monthlyPrice) || monthlyPrice < 0) {
    throw new Error("Çmimi mujor është i pavlefshëm.");
  }

  const monthlyMinorUnits = Math.round(monthlyPrice * 100);

  return (monthlyMinorUnits * months) / 100;
}

export function addUtcMonthsClamped(
  date: Date,
  months: number
) {
  const result = new Date(date);
  const originalDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const lastDayOfTargetMonth = new Date(
    Date.UTC(
      result.getUTCFullYear(),
      result.getUTCMonth() + 1,
      0
    )
  ).getUTCDate();

  result.setUTCDate(
    Math.min(originalDay, lastDayOfTargetMonth)
  );

  return result;
}

export function calculatePaidPeriod(input: {
  paidAt: Date;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  months: SubscriptionPaymentMonths;
}) {
  const {
    paidAt,
    trialEndsAt,
    currentPeriodEnd,
    months,
  } = input;

  const futureBoundaries = [
    currentPeriodEnd,
    trialEndsAt,
  ].filter(
    (date): date is Date =>
      date !== null &&
      date.getTime() > paidAt.getTime()
  );

  const periodStart =
    futureBoundaries.length > 0
      ? new Date(
          Math.max(
            ...futureBoundaries.map((date) =>
              date.getTime()
            )
          )
        )
      : new Date(paidAt);

  const periodEnd = addUtcMonthsClamped(
    periodStart,
    months
  );

  return {
    periodStart,
    periodEnd,
  };
}

export function calculatePaymentLifecycle(input: {
  currentStatus: SubscriptionAccessStatus;
  paidAt: Date;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  cancelledAt: Date | null;
  months: SubscriptionPaymentMonths;
}) {
  const {
    currentStatus,
    paidAt,
    trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    graceEndsAt,
    cancelledAt,
    months,
  } = input;

  const statusBeforePayment =
    resolveSubscriptionStatus({
      currentStatus,
      now: paidAt,
      trialEndsAt,
      currentPeriodStart,
      currentPeriodEnd,
      graceEndsAt,
      cancelledAt,
    });

  if (statusBeforePayment === "CANCELLED") {
    throw new Error(
      "Abonimi i anuluar duhet t? riaktivizohet para regjistrimit t? pages?s."
    );
  }

  const {
    periodStart,
    periodEnd,
  } = calculatePaidPeriod({
    paidAt,
    trialEndsAt,
    currentPeriodEnd,
    months,
  });

  const status: SubscriptionAccessStatus =
    statusBeforePayment === "TRIALING" &&
    periodStart.getTime() > paidAt.getTime()
      ? "TRIALING"
      : "ACTIVE";

  const hasFuturePaidCoverage =
    currentPeriodEnd !== null &&
    currentPeriodEnd.getTime() > paidAt.getTime();

  const subscriptionPeriodStart =
    hasFuturePaidCoverage
      ? currentPeriodStart
      : periodStart;

  return {
    statusBeforePayment,
    status,
    periodStart,
    periodEnd,
    subscriptionPeriodStart,
    graceEndsAt: null,
  };
}

export function resolveSubscriptionStatus(input: {
  currentStatus: SubscriptionAccessStatus;
  now: Date;
  trialEndsAt: Date | null;
  currentPeriodStart?: Date | null;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  cancelledAt: Date | null;
}): SubscriptionAccessStatus {
  const {
    currentStatus,
    now,
    trialEndsAt,
    currentPeriodStart,
    currentPeriodEnd,
    graceEndsAt,
    cancelledAt,
  } = input;

  if (
    currentStatus === "CANCELLED" ||
    cancelledAt
  ) {
    return "CANCELLED";
  }

  if (
    currentPeriodEnd &&
    currentPeriodEnd.getTime() > now.getTime() &&
    (
      !currentPeriodStart ||
      currentPeriodStart.getTime() <= now.getTime()
    )
  ) {
    return "ACTIVE";
  }

  if (
    graceEndsAt &&
    graceEndsAt.getTime() > now.getTime()
  ) {
    return "GRACE_PERIOD";
  }

  if (
    trialEndsAt &&
    trialEndsAt.getTime() > now.getTime()
  ) {
    return "TRIALING";
  }

  return "EXPIRED";
}