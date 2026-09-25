import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const configPath = path.join(process.cwd(), "next.config.mjs");
const configSource = fs.readFileSync(configPath, "utf8");

test("Next config applies baseline security headers globally", () => {
  assert.match(configSource, /source:\s*"\/:path\*"/);

  assert.match(configSource, /Content-Security-Policy/);
  assert.match(configSource, /X-Content-Type-Options/);
  assert.match(configSource, /X-Frame-Options/);
  assert.match(configSource, /Referrer-Policy/);
  assert.match(configSource, /Permissions-Policy/);

  assert.match(configSource, /default-src 'self'/);
  assert.match(configSource, /frame-ancestors 'none'/);
  assert.match(configSource, /object-src 'none'/);
});

test("HSTS is enabled only for production", () => {
  assert.match(
    configSource,
    /const isProduction = process\.env\.NODE_ENV === "production"/
  );
  assert.match(configSource, /Strict-Transport-Security/);
  assert.match(configSource, /max-age=31536000; includeSubDomains/);
});
