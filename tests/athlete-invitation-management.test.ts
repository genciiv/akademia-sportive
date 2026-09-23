import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const listRoute = fs.readFileSync(
  "app/api/athlete-invitations/route.ts",
  "utf8",
);

const revokeRoute = fs.readFileSync(
  "app/api/athlete-invitations/[invitationId]/route.ts",
  "utf8",
);

const resendRoute = fs.readFileSync(
  "app/api/athlete-invitations/[invitationId]/resend/route.ts",
  "utf8",
);

test("athlete invitation list requires PLAYERS_UPDATE", () => {
  assert.match(listRoute, /PERMISSIONS\.PLAYERS_UPDATE/);
});

test("athlete invitation list is academy scoped", () => {
  assert.match(listRoute, /academyId:\s*access\.academyId/);
});

test("athlete invitation list preserves team scope", () => {
  assert.match(listRoute, /getActiveTeamScope/);

  assert.match(listRoute, /teamScope\.isScoped/);

  assert.match(listRoute, /teamScope\.teamIds/);

  assert.match(listRoute, /teamId:\s*\{\s*in:\s*teamScope\.teamIds/);
});

test("athlete invitation list never exposes token material", () => {
  assert.doesNotMatch(listRoute, /\btoken\b/);
});

test("athlete invitation list resolves lifecycle status", () => {
  assert.match(listRoute, /"ACCEPTED"/);

  assert.match(listRoute, /"REVOKED"/);

  assert.match(listRoute, /"EXPIRED"/);

  assert.match(listRoute, /"PENDING"/);
});

test("athlete invitation revoke requires PLAYERS_UPDATE and academy scope", () => {
  assert.match(revokeRoute, /PERMISSIONS\.PLAYERS_UPDATE/);

  assert.match(revokeRoute, /academyId:\s*access\.academyId/);
});

test("athlete invitation revoke enforces player scope", () => {
  assert.match(revokeRoute, /canAccessPlayer/);

  assert.match(revokeRoute, /invitation\.playerId/);
});

test("athlete invitation revoke marks invitation revoked atomically with audit", () => {
  assert.match(revokeRoute, /prisma\.\$transaction/);

  assert.match(revokeRoute, /tx\.athleteInvitation\.update/);

  assert.match(revokeRoute, /revokedAt/);

  assert.match(revokeRoute, /ATHLETE_INVITATION_REVOKED/);
});

test("athlete invitation revoke audit never stores token material", () => {
  assert.doesNotMatch(revokeRoute, /tokenHash|invitationToken|invitePath/);
});

test("athlete invitation resend requires PLAYERS_UPDATE and academy scope", () => {
  assert.match(resendRoute, /PERMISSIONS\.PLAYERS_UPDATE/);

  assert.match(resendRoute, /academyId:\s*access\.academyId/);
});

test("athlete invitation resend enforces player scope", () => {
  assert.match(resendRoute, /canAccessPlayer/);

  assert.match(resendRoute, /invitation\.playerId/);
});

test("athlete invitation resend rechecks athlete portal entitlement and capacity", () => {
  assert.match(resendRoute, /checkAthletePortalAccess/);

  assert.match(resendRoute, /portalAccess\.allowed/);

  assert.match(resendRoute, /LIMIT_REACHED/);
});

test("athlete invitation resend creates a new hashed token", () => {
  assert.match(resendRoute, /createInvitationToken/);

  assert.match(resendRoute, /hashInvitationToken\(token\)/);

  assert.match(resendRoute, /token:\s*tokenHash/);
});

test("athlete invitation resend revokes old invitation before creating replacement", () => {
  const revokePosition = resendRoute.indexOf(
    "await tx.athleteInvitation.update",
  );

  const createPosition = resendRoute.indexOf(
    "await tx.athleteInvitation.create",
  );

  assert.ok(revokePosition >= 0);
  assert.ok(createPosition > revokePosition);
});

test("athlete invitation resend persists replacement before sending email", () => {
  const createPosition = resendRoute.indexOf(
    "await tx.athleteInvitation.create",
  );

  const emailPosition = resendRoute.indexOf("await sendAthleteInvitationEmail");

  assert.ok(createPosition >= 0);
  assert.ok(emailPosition > createPosition);
});

test("athlete invitation resend audit never stores token material", () => {
  const auditStart = resendRoute.indexOf("await writeAuditLog({");

  const auditEnd = resendRoute.indexOf("return created;", auditStart);

  assert.ok(auditStart >= 0);
  assert.ok(auditEnd > auditStart);

  const auditBlock = resendRoute.slice(auditStart, auditEnd);

  assert.doesNotMatch(auditBlock, /tokenHash|invitationToken|invitePath/);

  assert.match(auditBlock, /ATHLETE_INVITATION_RESENT/);
});

test("athlete invitation resend exposes raw token only through delivery response", () => {
  assert.match(resendRoute, /invitationToken:\s*token/);

  assert.match(resendRoute, /invitePath:\s*`\/sportist\/ftesa\/\$\{token\}`/);
});
