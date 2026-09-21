import { createHash, randomBytes } from "crypto";

export const ONBOARDING_INVITATION_DURATION_DAYS = 7;

export function createInvitationToken() {
  return randomBytes(32).toString("hex");
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createOnboardingExpiry(now = new Date()) {
  const expiresAt = new Date(now);

  expiresAt.setUTCDate(
    expiresAt.getUTCDate() + ONBOARDING_INVITATION_DURATION_DAYS,
  );

  return expiresAt;
}
