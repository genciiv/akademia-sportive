import assert from "node:assert/strict";
import test from "node:test";

import {
  assertDatabaseOperationSafe,
  inspectDatabaseTarget,
} from "../scripts/db-safety.mjs";

test("DIRECT_URL lokal identifikohet si local", () => {
  const target = inspectDatabaseTarget(
    "postgresql://user:pass@localhost:5432/app",
  );

  assert.equal(target.local, true);
});

test("127.0.0.1 identifikohet si local", () => {
  const target = inspectDatabaseTarget(
    "postgresql://user:pass@127.0.0.1:5432/app",
  );

  assert.equal(target.local, true);
});

test("database remote identifikohet si remote", () => {
  const target = inspectDatabaseTarget(
    "postgresql://user:pass@db.example.com:5432/app",
  );

  assert.equal(target.local, false);
});

test("operacioni lokal lejohet pa opt-in", () => {
  assert.doesNotThrow(() =>
    assertDatabaseOperationSafe({
      DIRECT_URL: "postgresql://user:pass@localhost:5432/app",
    }),
  );
});

test("operacioni remote bllokohet pa opt-in", () => {
  assert.throws(
    () =>
      assertDatabaseOperationSafe({
        DIRECT_URL: "postgresql://user:pass@db.example.com:5432/app",
      }),
    /ALLOW_REMOTE_DB_OPERATIONS=true/,
  );
});

test("operacioni remote lejohet vetëm me opt-in eksplicit", () => {
  assert.doesNotThrow(() =>
    assertDatabaseOperationSafe({
      DIRECT_URL: "postgresql://user:pass@db.example.com:5432/app",
      ALLOW_REMOTE_DB_OPERATIONS: "true",
    }),
  );
});

test("DIRECT_URL që mungon refuzohet", () => {
  assert.throws(
    () => assertDatabaseOperationSafe({}),
    /DIRECT_URL/,
  );
});

test("URL jo PostgreSQL refuzohet", () => {
  assert.throws(
    () =>
      inspectDatabaseTarget(
        "https://db.example.com/app",
      ),
    /PostgreSQL/,
  );
});

test("URL pa database refuzohet", () => {
  assert.throws(
    () =>
      inspectDatabaseTarget(
        "postgresql://user:pass@localhost:5432/",
      ),
    /database/,
  );
});
