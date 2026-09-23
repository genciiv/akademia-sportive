import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const route = fs.readFileSync(
  "app/api/athlete-invitations/public/[token]/route.ts",
  "utf8",
);

test("public athlete invitation validates token length before lookup", () => {
  assert.match(route, /token\.length\s*<\s*16/);

  assert.match(route, /token\.length\s*>\s*512/);
});

test("public athlete invitation hashes the raw token before database lookup", () => {
  assert.match(route, /hashInvitationToken\(token\)/);

  assert.match(route, /token:\s*tokenHash/);
});

test("public athlete invitation rejects accepted revoked and expired invitations", () => {
  assert.match(route, /invitation\.acceptedAt\s*!==\s*null/);

  assert.match(route, /invitation\.revokedAt\s*!==\s*null/);

  assert.match(route, /invitation\.expiresAt\s*<=\s*now/);
});

test("public athlete invitation normalizes the invited email", () => {
  assert.match(route, /normalizeEmail/);

  assert.match(route, /\.trim\(\)/);

  assert.match(route, /\.toLowerCase\(\)/);
});

test("public athlete invitation reports whether the invited account already exists", () => {
  assert.match(route, /prisma\.user\.findUnique/);

  assert.match(route, /accountExists:\s*existingUser\s*!==\s*null/);
});

test("public athlete invitation identifies the registration type and next path", () => {
  assert.match(route, /type:\s*"ATHLETE"/);

  assert.match(route, /`\/sportist\/ftesa\/\$\{encodeURIComponent\(/);
});

test("public athlete invitation response never exposes token hashes", () => {
  const responseStart = route.lastIndexOf("return NextResponse.json({");

  assert.ok(responseStart >= 0);

  const responseBlock = route.slice(responseStart);

  assert.doesNotMatch(responseBlock, /tokenHash/);
});
