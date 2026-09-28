import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { assertRestoreOperationSafe } from "./restore-safety.mjs";

let target;

try {
  target = assertRestoreOperationSafe(process.env);
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Restore blocked by safety validation."
  );
  process.exit(1);
}

const restoreUrl = process.env.RESTORE_DATABASE_URL;
const dumpPath = process.env.RESTORE_DUMP_PATH;

if (!dumpPath) {
  console.error(
    "Restore blocked: RESTORE_DUMP_PATH is not configured."
  );
  process.exit(1);
}

const dump = resolve(dumpPath);

if (!existsSync(dump) || !statSync(dump).isFile()) {
  console.error(
    "Restore blocked: dump file does not exist."
  );
  process.exit(1);
}

if (!dump.toLowerCase().endsWith(".dump")) {
  console.error(
    "Restore blocked: restore source must be a .dump archive."
  );
  process.exit(1);
}

const pgRestore =
  process.env.PG_RESTORE_PATH ||
  String.raw`C:\Program Files\PostgreSQL\18\bin\pg_restore.exe`;

if (!existsSync(pgRestore)) {
  console.error(
    "Restore failed: pg_restore executable was not found."
  );
  process.exit(1);
}

console.log(
  `Restore target validated (${target.database}, local only).`
);
console.log(`Restore source: ${dump}`);
console.log("Validating PostgreSQL archive...");

const archiveCheck = spawnSync(
  pgRestore,
  ["--list", dump],
  {
    stdio: ["ignore", "ignore", "inherit"],
    windowsHide: true,
  }
);

if (archiveCheck.error || archiveCheck.status !== 0) {
  console.error(
    "Restore blocked: PostgreSQL archive validation failed."
  );
  process.exit(archiveCheck.status ?? 1);
}

console.log("Archive validation passed.");
console.log("Starting restore into isolated local test database...");

const result = spawnSync(
  pgRestore,
  [
    "--dbname",
    restoreUrl,
    "--no-owner",
    "--no-privileges",
    "--exit-on-error",
    "--single-transaction",
    dump,
  ],
  {
    stdio: ["ignore", "inherit", "inherit"],
    windowsHide: true,
  }
);

if (result.error || result.status !== 0) {
  if (result.error) {
    console.error(`Restore failed: ${result.error.message}`);
  } else {
    console.error(
      `Restore failed with exit code ${result.status}.`
    );
  }

  process.exit(result.status ?? 1);
}

console.log("Restore completed successfully.");
