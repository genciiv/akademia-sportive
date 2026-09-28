export function inspectRestoreTarget(rawUrl) {
  if (!rawUrl) {
    throw new Error(
      "Restore blocked: RESTORE_DATABASE_URL is not configured."
    );
  }

  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      "Restore blocked: RESTORE_DATABASE_URL is invalid."
    );
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(
      "Restore blocked: RESTORE_DATABASE_URL must use PostgreSQL."
    );
  }

  if (!parsed.hostname || parsed.pathname.length <= 1) {
    throw new Error(
      "Restore blocked: RESTORE_DATABASE_URL must include host and database."
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  const local =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]";

  if (!local) {
    throw new Error(
      "Restore blocked: only local PostgreSQL targets are allowed."
    );
  }

  const database = decodeURIComponent(
    parsed.pathname.slice(1)
  );

  if (database !== "akademia_restore_test") {
    throw new Error(
      "Restore blocked: target database must be akademia_restore_test."
    );
  }

  return {
    local: true,
    database,
  };
}

export function assertRestoreOperationSafe(env) {
  return inspectRestoreTarget(env.RESTORE_DATABASE_URL);
}
