import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync(
  "app/api/players/[playerId]/athlete-invite/route.ts",
  "utf8",
);

test("athlete invitation creation requires PLAYERS_UPDATE and academy/player scope", () => {
  assert.match(route, /PERMISSIONS\.PLAYERS_UPDATE/);

  assert.match(route, /academyId:\s*access\.academyId/);

  assert.match(route, /canAccessPlayer/);
});

test("athlete invitation creation rejects an already linked player", () => {
  assert.match(route, /player\.athleteAccount/);

  assert.match(route, /status:\s*409/);
});

test("athlete invitation creation requires a player email", () => {
  assert.match(route, /player\.email/);

  assert.match(route, /Sportisti duhet të ketë një email/);
});

test("athlete invitation creation enforces portal entitlement and capacity", () => {
  assert.match(route, /checkAthletePortalAccess/);

  assert.match(route, /if\s*\(!portalAccess\.allowed\)/);

  assert.match(route, /LIMIT_REACHED/);
});

test("athlete invitation lookup is academy and player scoped", () => {
  assert.match(route, /prisma\.athleteInvitation\.findFirst/);

  assert.match(
    route,
    /academyId:\s*access\.academyId[\s\S]*playerId:\s*player\.id/,
  );

  assert.match(route, /acceptedAt:\s*null/);

  assert.match(route, /revokedAt:\s*null/);
});

test("athlete invitation stores only the hashed token", () => {
  assert.match(route, /const tokenHash\s*=\s*hashInvitationToken\(token\)/);

  assert.match(route, /token:\s*tokenHash/);
});

test("expired athlete invitations are revoked before a replacement is created", () => {
  const revokePosition = route.indexOf("await tx.athleteInvitation.updateMany");

  const createPosition = route.indexOf("await tx.athleteInvitation.create");

  assert.ok(revokePosition >= 0);
  assert.ok(createPosition > revokePosition);

  assert.match(route, /expiresAt:\s*\{\s*lte:\s*now/);
});

test("athlete invitation audit payload never stores token material", () => {
  const auditStart = route.indexOf("await writeAuditLog({");

  const auditEnd = route.indexOf("return created;", auditStart);

  assert.ok(auditStart >= 0);
  assert.ok(auditEnd > auditStart);

  const auditBlock = route.slice(auditStart, auditEnd);

  assert.doesNotMatch(auditBlock, /invitationToken|tokenHash|invitePath/);

  assert.match(auditBlock, /ATHLETE_INVITATION_CREATED/);
});

test("athlete invitation email is sent only after persistence", () => {
  const createPosition = route.indexOf("await tx.athleteInvitation.create");

  const emailPosition = route.indexOf("await sendAthleteInvitationEmail");

  assert.ok(createPosition >= 0);
  assert.ok(emailPosition > createPosition);
});

test("raw athlete invitation token is exposed only through the delivery path", () => {
  assert.match(route, /invitationToken:\s*token/);

  assert.match(route, /invitePath:\s*`\/sportist\/ftesa\/\$\{token\}`/);
});
