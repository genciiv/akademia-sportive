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
  currentPeriodEnd: Date | null;
  months: SubscriptionPaymentMonths;
}) {
  const { paidAt, currentPeriodEnd, months } = input;

  const periodStart =
    currentPeriodEnd &&
    currentPeriodEnd.getTime() > paidAt.getTime()
      ? new Date(currentPeriodEnd)
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

export function resolveSubscriptionStatus(input: {
  currentStatus: SubscriptionAccessStatus;
  now: Date;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  graceEndsAt: Date | null;
  cancelledAt: Date | null;
}): SubscriptionAccessStatus {
  const {
    currentStatus,
    now,
    trialEndsAt,
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
    currentPeriodEnd.getTime() > now.getTime()
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