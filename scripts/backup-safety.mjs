export function inspectBackupTarget(rawUrl) {
  if (!rawUrl) {
    throw new Error(
      "Backup blocked: BACKUP_DATABASE_URL is not configured."
    );
  }

  let parsed;

  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(
      "Backup blocked: BACKUP_DATABASE_URL is invalid."
    );
  }

  if (!["postgres:", "postgresql:"].includes(parsed.protocol)) {
    throw new Error(
      "Backup blocked: BACKUP_DATABASE_URL must use PostgreSQL."
    );
  }

  if (!parsed.hostname || parsed.pathname.length <= 1) {
    throw new Error(
      "Backup blocked: BACKUP_DATABASE_URL must include host and database."
    );
  }

  const hostname = parsed.hostname.toLowerCase();

  const local =
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname === "::1" ||
    hostname === "[::1]";

  return { local };
}

export function assertBackupOperationSafe(env) {
  const target = inspectBackupTarget(env.BACKUP_DATABASE_URL);

  if (!target.local && env.ALLOW_REMOTE_DB_BACKUP !== "true") {
    throw new Error(
      "Backup blocked: remote database requires ALLOW_REMOTE_DB_BACKUP=true."
    );
  }

  return target;
}
