import "dotenv/config";
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";
import { assertBackupOperationSafe } from "./backup-safety.mjs";
import { resolvePgDumpCommand, usesPathLookup } from "./backup-command.mjs";

let target;

try {
  target = assertBackupOperationSafe(process.env);
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Backup blocked by safety validation."
  );
  process.exit(1);
}

const backupUrl = process.env.BACKUP_DATABASE_URL;

const pgDump = resolvePgDumpCommand(process.env, process.platform);

const pgDumpUsesPathLookup = usesPathLookup(pgDump);

if (!pgDumpUsesPathLookup && !existsSync(pgDump)) {
  console.error("Backup failed: pg_dump executable was not found.");
  process.exit(1);
}

const backupDir = resolve(".backups");
mkdirSync(backupDir, { recursive: true });

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const output = resolve(
  backupDir,
  `akademia-sportive-${timestamp}.dump`
);

console.log(
  `Backup target validated (${target.local ? "local" : "remote"}).`
);
console.log("Backup format: PostgreSQL custom archive.");
console.log(`Backup destination: ${output}`);
console.log("Starting read-only database dump...");

const result = spawnSync(
  pgDump,
  [
    "--dbname",
    backupUrl,
    "--format=custom",
    "--no-owner",
    "--no-privileges",
    "--file",
    output,
  ],
  {
    stdio: ["ignore", "inherit", "inherit"],
    windowsHide: true,
  }
);

if (result.error || result.status !== 0) {
  rmSync(output, { force: true });

  if (result.error) {
    console.error(`Backup failed: ${result.error.message}`);
  } else {
    console.error(`Backup failed with exit code ${result.status}.`);
  }

  process.exit(result.status ?? 1);
}

console.log("Backup completed successfully.");
