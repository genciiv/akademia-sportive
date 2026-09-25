import "dotenv/config";
import { spawnSync } from "node:child_process";

import { assertDatabaseOperationSafe } from "./db-safety.mjs";

try {
  assertDatabaseOperationSafe();

  console.log("DB safety check PASS.");
  console.log("Duke ekzekutuar Prisma migrate deploy...");

  const command = process.platform === "win32" ? "npx.cmd" : "npx";

  const result = spawnSync(
    command,
    ["prisma", "migrate", "deploy"],
    {
      stdio: "inherit",
      env: process.env,
    },
  );

  if (result.error) {
    throw result.error;
  }

  process.exitCode = result.status ?? 1;
} catch (error) {
  console.error(
    error instanceof Error
      ? error.message
      : "Migration u bllokua.",
  );
  process.exitCode = 1;
}
