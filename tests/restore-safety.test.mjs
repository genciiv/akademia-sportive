import test from "node:test";
import assert from "node:assert/strict";

import {
  inspectRestoreTarget,
  assertRestoreOperationSafe,
} from "../scripts/restore-safety.mjs";

test("localhost restore test database is allowed", () => {
  assert.deepEqual(
    inspectRestoreTarget(
      "postgresql://postgres:secret@localhost:5434/akademia_restore_test"
    ),
    {
      local: true,
      database: "akademia_restore_test",
    }
  );
});

test("127.0.0.1 restore test database is allowed", () => {
  assert.deepEqual(
    inspectRestoreTarget(
      "postgresql://postgres:secret@127.0.0.1:5434/akademia_restore_test"
    ),
    {
      local: true,
      database: "akademia_restore_test",
    }
  );
});

test("remote restore target is always blocked", () => {
  assert.throws(
    () =>
      inspectRestoreTarget(
        "postgresql://postgres:secret@example.com:5432/akademia_restore_test"
      ),
    /only local PostgreSQL targets are allowed/
  );
});

test("remote restore cannot be enabled with an opt-in", () => {
  assert.throws(
    () =>
      assertRestoreOperationSafe({
        RESTORE_DATABASE_URL:
          "postgresql://postgres:secret@example.com:5432/akademia_restore_test",
        ALLOW_REMOTE_DB_RESTORE: "true",
      }),
    /only local PostgreSQL targets are allowed/
  );
});

test("wrong local database name is blocked", () => {
  assert.throws(
    () =>
      inspectRestoreTarget(
        "postgresql://postgres:secret@127.0.0.1:5434/postgres"
      ),
    /target database must be akademia_restore_test/
  );
});

test("production-looking local database name is blocked", () => {
  assert.throws(
    () =>
      inspectRestoreTarget(
        "postgresql://postgres:secret@127.0.0.1:5434/neondb"
      ),
    /target database must be akademia_restore_test/
  );
});

test("missing restore URL is blocked", () => {
  assert.throws(
    () => assertRestoreOperationSafe({}),
    /RESTORE_DATABASE_URL is not configured/
  );
});

test("non-PostgreSQL restore URL is blocked", () => {
  assert.throws(
    () =>
      inspectRestoreTarget(
        "mysql://user:secret@127.0.0.1/akademia_restore_test"
      ),
    /must use PostgreSQL/
  );
});

test("URL without database is blocked", () => {
  assert.throws(
    () =>
      inspectRestoreTarget(
        "postgresql://postgres:secret@127.0.0.1:5434"
      ),
    /must include host and database/
  );
});
