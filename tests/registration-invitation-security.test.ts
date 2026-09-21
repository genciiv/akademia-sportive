import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function readSource(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

test("public registration invitation validation preserves token security contracts", () => {
  const route = readSource("app/api/registration-invitations/[token]/route.ts");
  const adminListRoute = readSource(
    "app/api/platform-admin/academy-applications/route.ts",
  );

  assert.match(
    route,
    /hashInvitationToken\(token\)/,
    "Owner onboarding tokens must be hashed before lookup.",
  );

  assert.match(
    route,
    /ownerInvitation\?\.status === "APPROVED"/,
    "Owner invitations must require an approved application.",
  );

  assert.match(
    route,
    /ownerInvitation\.consumedAt === null/,
    "Owner invitations must reject consumed applications.",
  );

  assert.match(
    route,
    /ownerInvitation\.onboardingExpiresAt > now/,
    "Owner invitations must reject expired onboarding tokens.",
  );

  assert.match(
    route,
    /staffInvitation\.acceptedAt === null/,
    "Staff invitations must reject accepted invitations.",
  );

  assert.match(
    route,
    /staffInvitation\.revokedAt === null/,
    "Staff invitations must reject revoked invitations.",
  );

  assert.match(
    route,
    /staffInvitation\.expiresAt > now/,
    "Staff invitations must reject expired invitations.",
  );

  assert.doesNotMatch(
    route,
    /onboardingTokenHash\s*:/,
    "The public response must not expose the stored onboarding token hash.",
  );

  assert.match(
    adminListRoute,
    /\{ onboardingTokenHash: _onboardingTokenHash, \.\.\.application \}/,
    "The Platform Admin applications list must strip onboarding token hashes before responding.",
  );

  assert.match(
    adminListRoute,
    /applications: safeApplications/,
    "The Platform Admin applications response must return only sanitized applications.",
  );
});

test("email signup remains invitation-only on the server", () => {
  const auth = readSource("lib/auth.ts");

  assert.match(
    auth,
    /ctx\.path !== "\/sign-up\/email"/,
    "The Better Auth hook must guard email signup.",
  );

  assert.match(
    auth,
    /hashInvitationToken\(invitationToken\)/,
    "Owner signup must validate the hashed invitation token.",
  );

  assert.match(
    auth,
    /ownerInvitation\?\.status === "APPROVED"/,
    "Owner signup must require an approved application.",
  );

  assert.match(
    auth,
    /ownerInvitation\.consumedAt === null/,
    "Owner signup must reject consumed applications.",
  );

  assert.match(
    auth,
    /ownerInvitation\.onboardingExpiresAt > now/,
    "Owner signup must reject expired onboarding invitations.",
  );

  assert.match(
    auth,
    /staffInvitation\.acceptedAt === null/,
    "Staff signup must reject accepted invitations.",
  );

  assert.match(
    auth,
    /staffInvitation\.revokedAt === null/,
    "Staff signup must reject revoked invitations.",
  );

  assert.match(
    auth,
    /staffInvitation\.expiresAt > now/,
    "Staff signup must reject expired invitations.",
  );

  assert.match(
    auth,
    /normalizeEmail\(ownerInvitation\.email\) === email/,
    "Owner signup must bind the invitation to the authorized email.",
  );

  assert.match(
    auth,
    /normalizeEmail\(staffInvitation\.email\) === email/,
    "Staff signup must bind the invitation to the authorized email.",
  );
});

test("existing invited users are routed to login instead of signup", () => {
  const route = readSource("app/api/registration-invitations/[token]/route.ts");
  const page = readSource("app/regjistrohu/page.tsx");

  assert.match(
    route,
    /prisma\.user\.findUnique\(/,
    "Invitation validation must check whether the invited email already has an account.",
  );

  assert.equal(
    (route.match(/accountExists: existingAccount/g) ?? []).length,
    2,
    "Both owner and staff invitation responses must expose accountExists.",
  );

  assert.match(
    page,
    /accountExists: boolean;/,
    "The registration UI must model accountExists explicitly.",
  );

  const existingAccountBranch = page.indexOf("if (invitation.accountExists)");
  const registrationForm = page.indexOf("<form onSubmit={regjistrohu}");

  assert.ok(
    existingAccountBranch >= 0,
    "The registration page must handle existing invited accounts.",
  );

  assert.ok(
    registrationForm >= 0,
    "The registration form must still exist for new invited users.",
  );

  assert.ok(
    existingAccountBranch < registrationForm,
    "Existing-account handling must return before the signup form is rendered.",
  );

  assert.ok(
    page.includes("encodeURIComponent(invitation.nextPath)"),
    "Existing invited users must keep the invitation destination when they log in.",
  );
});

test("Platform Admin approval surfaces the one-time owner onboarding invitation", () => {
  const client = readSource(
    "app/platform-admin/aplikimet/applications-client.tsx",
  );

  assert.match(
    client,
    /status === "APPROVED"/,
    "The applications UI must handle the approved status explicitly.",
  );

  assert.match(
    client,
    /data\?\.onboarding\?\.token/,
    "The applications UI must consume the raw onboarding token returned by approval.",
  );

  assert.match(
    client,
    /encodeURIComponent\(data\.onboarding\.token\)/,
    "The raw onboarding token must be URL encoded.",
  );

  assert.match(
    client,
    /"\/regjistrohu\?invite="/,
    "The owner invitation must target invitation-only registration.",
  );

  assert.match(
    client,
    /navigator\.clipboard\.writeText\(/,
    "Platform Admin must be able to copy the generated onboarding link.",
  );

  assert.doesNotMatch(
    client,
    /localStorage|sessionStorage/,
    "The raw onboarding invitation must not be persisted in browser storage.",
  );

  assert.match(
    client,
    /token-i nuk mund të\s+rikthehet pas rifreskimit/,
    "The UI must warn that the one-time raw token is not recoverable after refresh.",
  );
});
