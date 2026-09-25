import assert from "node:assert/strict";
import test from "node:test";

import { validateProductionEnv } from "../lib/env-validation";

function productionEnv(
  overrides: Partial<NodeJS.ProcessEnv> = {},
): NodeJS.ProcessEnv {
  return {
    DATABASE_URL: "postgresql://user:pass@db.example.com:5432/app",
    DIRECT_URL: "postgresql://user:pass@db.example.com:5432/app",
    BETTER_AUTH_URL: "https://app.example.com",
    BETTER_AUTH_SECRET: "test-secret",
    NEXT_PUBLIC_APP_URL: "https://app.example.com",
    ...overrides,
    NODE_ENV: "production",
  };
}

test("production env i plotë kalon validimin", () => {
  assert.doesNotThrow(() => validateProductionEnv(productionEnv()));
});

test("validimi anashkalohet jashtë production", () => {
  assert.doesNotThrow(() =>
    validateProductionEnv({
      NODE_ENV: "development",
    }),
  );
});

test("mungesa e një variable kritike refuzohet", () => {
  assert.throws(
    () =>
      validateProductionEnv(
        productionEnv({
          DATABASE_URL: "",
        }),
      ),
    /DATABASE_URL/,
  );
});

test("DATABASE_URL jo PostgreSQL refuzohet", () => {
  assert.throws(
    () =>
      validateProductionEnv(
        productionEnv({
          DATABASE_URL: "https://db.example.com/app",
        }),
      ),
    /DATABASE_URL.*PostgreSQL/,
  );
});

test("DIRECT_URL pa database refuzohet", () => {
  assert.throws(
    () =>
      validateProductionEnv(
        productionEnv({
          DIRECT_URL: "postgresql://user:pass@db.example.com:5432/",
        }),
      ),
    /DIRECT_URL.*database/,
  );
});

test("URL jo e vlefshme refuzohet", () => {
  assert.throws(
    () =>
      validateProductionEnv(
        productionEnv({
          BETTER_AUTH_URL: "not-a-url",
        }),
      ),
    /BETTER_AUTH_URL/,
  );
});

test("http refuzohet për URL-të publike në production", () => {
  assert.throws(
    () =>
      validateProductionEnv(
        productionEnv({
          NEXT_PUBLIC_APP_URL: "http://app.example.com",
        }),
      ),
    /NEXT_PUBLIC_APP_URL.*https/,
  );
});

test("Brevo mund të mungojë plotësisht", () => {
  assert.doesNotThrow(() =>
    validateProductionEnv(
      productionEnv({
        BREVO_API_KEY: "",
        BREVO_SENDER_EMAIL: "",
      }),
    ),
  );
});

test("konfigurimi i pjesshëm Brevo refuzohet", () => {
  assert.throws(
    () =>
      validateProductionEnv(
        productionEnv({
          BREVO_API_KEY: "test-key",
          BREVO_SENDER_EMAIL: "",
        }),
      ),
    /Brevo.*paplotë/,
  );
});
