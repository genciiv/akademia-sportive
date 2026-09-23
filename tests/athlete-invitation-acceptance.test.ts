import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync(
  "app/api/athlete-invitations/public/[token]/route.ts",
  "utf8",
);

function postBlock() {
  const start = route.indexOf("export async function POST");

  assert.ok(start >= 0, "POST handler duhet të ekzistojë");

  return route.slice(start);
}

test("athlete invitation acceptance requires an authenticated session", () => {
  const source = postBlock();

  assert.match(source, /auth\.api\.getSession/);

  assert.match(source, /status:\s*401/);
});

test("athlete invitation acceptance hashes the raw token before lookup", () => {
  const source = postBlock();

  assert.match(source, /hashInvitationToken\(token\)/);

  assert.match(source, /token:\s*tokenHash/);
});

test("athlete invitation acceptance rejects inactive invitations", () => {
  const source = postBlock();

  assert.match(source, /invitation\.acceptedAt\s*!==\s*null/);

  assert.match(source, /invitation\.revokedAt\s*!==\s*null/);

  assert.match(source, /invitation\.expiresAt\s*<=\s*now/);
});

test("athlete invitation acceptance binds the invitation to the signed-in email", () => {
  const source = postBlock();

  assert.match(
    source,
    /normalizeEmail\(\s*session\.user\.email\s*\|\|\s*""\s*\)/,
  );

  assert.match(source, /normalizeEmail\(\s*invitation\.email\s*\)/);

  assert.match(source, /sessionEmail\s*!==\s*invitationEmail/);

  assert.match(source, /status:\s*403/);
});

test("athlete invitation acceptance rechecks portal entitlement before linking", () => {
  const source = postBlock();

  assert.match(
    source,
    /checkAthletePortalAccess\(\s*invitation\.academyId\s*\)/,
  );

  assert.match(source, /if\s*\(\s*!portalAccess\.allowed\s*\)/);
});

test("athlete invitation acceptance uses a serializable transaction", () => {
  const source = postBlock();

  assert.match(source, /prisma\.\$transaction/);

  assert.match(source, /isolationLevel:\s*"Serializable"/);
});

test("athlete invitation acceptance rechecks invitation state inside the transaction", () => {
  const source = postBlock();

  assert.match(source, /tx\.athleteInvitation\.findUnique/);

  assert.match(source, /currentInvitation\.acceptedAt\s*!==\s*null/);

  assert.match(source, /currentInvitation\.revokedAt\s*!==\s*null/);

  assert.match(source, /currentInvitation\.expiresAt\s*<=/);
});

test("athlete invitation acceptance prevents duplicate player and user links", () => {
  const source = postBlock();

  assert.match(source, /tx\.athleteAccount\.findFirst/);

  assert.match(source, /playerId:\s*invitation\.playerId/);

  assert.match(source, /userId:\s*session\.user\.id/);

  assert.match(source, /PLAYER_ALREADY_LINKED/);

  assert.match(source, /USER_ALREADY_LINKED_IN_ACADEMY/);
});

test("athlete invitation acceptance rechecks academy capacity inside the transaction", () => {
  const source = postBlock();

  assert.match(source, /tx\.athleteAccount\.count/);

  assert.match(source, /academyId:\s*invitation\.academyId/);

  assert.match(
    source,
    /currentAthleteAccounts\s*>=\s*portalAccess\.maxAthleteAccounts/,
  );
});

test("athlete invitation acceptance creates only an athlete account and no academy membership", () => {
  const source = postBlock();

  assert.match(source, /tx\.athleteAccount\.create/);

  assert.doesNotMatch(source, /academyMembership\.(create|update|upsert)/);
});

test("athlete invitation acceptance marks the invitation accepted after account creation", () => {
  const source = postBlock();

  const createIndex = source.indexOf("tx.athleteAccount.create");

  const acceptIndex = source.indexOf("tx.athleteInvitation.update");

  assert.ok(createIndex >= 0);

  assert.ok(
    acceptIndex > createIndex,
    "acceptedAt duhet të vendoset pas krijimit të AthleteAccount",
  );

  assert.match(source.slice(acceptIndex), /acceptedAt/);
});

test("athlete invitation acceptance records ATHLETE_ACCOUNT_LINKED audit atomically", () => {
  const source = postBlock();

  assert.match(source, /writeAuditLog/);

  assert.match(source, /AUDIT_ACTIONS\.ATHLETE_ACCOUNT_LINKED/);

  assert.match(source, /tx,/);
});

test("athlete invitation acceptance audit never stores raw invitation token material", () => {
  const source = postBlock();

  const auditIndex = source.indexOf("await writeAuditLog");

  assert.ok(auditIndex >= 0);

  const auditBlock = source.slice(
    auditIndex,
    source.indexOf("return athleteAccount", auditIndex),
  );

  assert.doesNotMatch(auditBlock, /\btoken\b/);

  assert.doesNotMatch(auditBlock, /tokenHash/);

  assert.doesNotMatch(auditBlock, /invitePath/);
});

test("athlete invitation acceptance retries P2034 transaction conflicts", () => {
  assert.match(route, /MAX_ACCEPTANCE_TRANSACTION_RETRIES\s*=\s*3/);

  assert.match(route, /getPrismaErrorCode\(error\)\s*===\s*"P2034"/);

  assert.match(route, /for\s*\(\s*let attempt = 1;\s*;\s*attempt \+= 1\s*\)/);

  assert.match(route, /result = await acceptInvitationTransaction\(\)/);

  assert.match(route, /attempt >= MAX_ACCEPTANCE_TRANSACTION_RETRIES/);
});

test("athlete invitation acceptance maps concurrent unique link races to conflict", () => {
  assert.match(route, /prismaCode === "P2002"/);

  assert.match(route, /reason:\s*"CONCURRENT_LINK_CONFLICT"/);

  assert.match(route, /status:\s*409/);
});

test("athlete invitation acceptance maps exhausted P2034 retries to conflict", () => {
  assert.match(route, /prismaCode === "P2034"/);

  assert.match(route, /reason:\s*"TRANSACTION_CONFLICT"/);

  assert.match(route, /Provo përsëri\./);
});
