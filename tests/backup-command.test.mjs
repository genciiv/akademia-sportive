import test from "node:test";
import assert from "node:assert/strict";

import {
  resolvePgDumpCommand,
  usesPathLookup,
} from "../scripts/backup-command.mjs";

test("Windows defaults to PostgreSQL 18 pg_dump executable", () => {
  assert.equal(
    resolvePgDumpCommand({}, "win32"),
    String.raw`C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`
  );
});

test("non-Windows platforms default to pg_dump from PATH", () => {
  assert.equal(resolvePgDumpCommand({}, "linux"), "pg_dump");
});

test("PG_DUMP_PATH overrides platform default", () => {
  assert.equal(
    resolvePgDumpCommand(
      { PG_DUMP_PATH: "/custom/postgres/bin/pg_dump" },
      "linux"
    ),
    "/custom/postgres/bin/pg_dump"
  );
});

test("plain pg_dump command uses PATH lookup", () => {
  assert.equal(usesPathLookup("pg_dump"), true);
});

test("absolute Unix path does not use PATH lookup", () => {
  assert.equal(
    usesPathLookup("/usr/lib/postgresql/18/bin/pg_dump"),
    false
  );
});

test("Windows executable path does not use PATH lookup", () => {
  assert.equal(
    usesPathLookup(
      String.raw`C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`
    ),
    false
  );
});
