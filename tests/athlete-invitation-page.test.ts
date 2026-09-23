import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/sportist/ftesa/[token]/page.tsx", "utf8");

test("athlete invitation page loads the public athlete invitation", () => {
  assert.match(
    page,
    /\/api\/athlete-invitations\/public\/\$\{encodeURIComponent\(\s*token\s*,?\s*\)\}/,
  );

  assert.match(page, /method:\s*"GET"/);

  assert.match(page, /data\?\.type\s*!==\s*"ATHLETE"/);
});

test("athlete invitation page posts acceptance to the same public endpoint", () => {
  assert.match(page, /async function acceptInvitation/);

  assert.match(page, /method:\s*"POST"/);

  assert.match(page, /setSuccess\(true\)/);
});

test("athlete invitation page routes unauthenticated users back through login", () => {
  assert.match(page, /response\.status\s*===\s*401/);

  assert.match(
    page,
    /\/hyrje\?next=\$\{encodeURIComponent\(\s*nextPath\s*,?\s*\)\}/,
  );

  assert.match(page, /router\.push\(\s*loginHref\s*\)/);
});

test("athlete invitation page preserves the athlete invitation route as nextPath", () => {
  assert.match(
    page,
    /\/sportist\/ftesa\/\$\{encodeURIComponent\(\s*token\s*,?\s*\)\}/,
  );

  assert.match(page, /invitation\?\.nextPath/);
});

test("athlete invitation page routes new users through invitation-only registration", () => {
  assert.match(
    page,
    /\/regjistrohu\?invite=\$\{encodeURIComponent\(\s*token\s*,?\s*\)\}&next=\$\{encodeURIComponent\(\s*nextPath\s*,?\s*\)\}/,
  );

  assert.match(page, /Krijo llogari/);
});

test("athlete invitation page routes existing users to login", () => {
  assert.match(page, /invitation\.accountExists/);

  assert.match(page, /href=\{\s*loginHref\s*\}/);

  assert.match(page, /Hyr në llogari/);
});

test("athlete invitation page exposes no athlete invitation token hash", () => {
  assert.doesNotMatch(page, /tokenHash/);

  assert.doesNotMatch(page, /hashInvitationToken/);
});

test("athlete invitation page shows athlete academy email and expiry context", () => {
  assert.match(page, /invitation\.athleteName/);

  assert.match(page, /invitation\.academyName/);

  assert.match(page, /invitation\.email/);

  assert.match(page, /invitation\.expiresAt/);

  assert.match(page, /Europe\/Tirane/);
});

test("athlete invitation page redirects to the athlete dashboard after acceptance", () => {
  assert.match(page, /Ftesa u pranua me sukses\./);

  assert.match(
    page,
    /Llogaria jote tani është lidhur me profilin e sportistit\./,
  );

  assert.match(page, /router\.push\(\s*["'`]\/sportist\/dashboard["'`]\s*\)/);
});
