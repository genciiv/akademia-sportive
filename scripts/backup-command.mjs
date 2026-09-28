export function resolvePgDumpCommand(env = process.env, platform = process.platform) {
  return (
    env.PG_DUMP_PATH ||
    (platform === "win32"
      ? String.raw`C:\Program Files\PostgreSQL\18\bin\pg_dump.exe`
      : "pg_dump")
  );
}

export function usesPathLookup(command) {
  return !command.includes("/") && !command.includes("\\");
}
