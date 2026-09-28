import test from "node:test";
import assert from "node:assert/strict";

import {
  inspectBackupTarget,
  assertBackupOperationSafe,
} from "../scripts/backup-safety.mjs";

test("localhost backup target is local", () => {
  assert.equal(
    inspectBackupTarget("postgresql://user:pass@localhost:5432/test").local,
    true
  );
});

test("127.0.0.1 backup target is local", () => {
  assert.equal(
    inspectBackupTarget("postgresql://user:pass@127.0.0.1:5432/test").local,
    true
  );
});

test("remote backup target is identified as remote", () => {
  assert.equal(
    inspectBackupTarget("postgresql://user:pass@example.com:5432/test").local,
    false
  );
});

test("local backup is allowed without remote opt-in", () => {
  assert.deepEqual(
    assertBackupOperationSafe({
      BACKUP_DATABASE_URL:
        "postgresql://user:pass@localhost:5432/test",
    }),
    { local: true }
  );
});

test("remote backup is blocked without explicit opt-in", () => {
  assert.throws(
    () =>
      assertBackupOperationSafe({
        BACKUP_DATABASE_URL:
          "postgresql://user:pass@example.com:5432/test",
      }),
    /ALLOW_REMOTE_DB_BACKUP=true/
  );
});

test("remote backup is allowed with explicit opt-in", () => {
  assert.deepEqual(
    assertBackupOperationSafe({
      BACKUP_DATABASE_URL:
        "postgresql://user:pass@example.com:5432/test",
      ALLOW_REMOTE_DB_BACKUP: "true",
    }),
    { local: false }
  );
});

test("missing backup URL is rejected", () => {
  assert.throws(
    () => assertBackupOperationSafe({}),
    /BACKUP_DATABASE_URL is not configured/
  );
});

test("non-PostgreSQL backup URL is rejected", () => {
  assert.throws(
    () =>
      inspectBackupTarget(
        "mysql://user:pass@example.com/database"
      ),
    /must use PostgreSQL/
  );
});

test("backup URL without database is rejected", () => {
  assert.throws(
    () =>
      inspectBackupTarget(
        "postgresql://user:pass@example.com"
      ),
    /must include host and database/
  );
});
