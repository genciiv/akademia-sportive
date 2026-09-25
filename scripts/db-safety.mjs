import "dotenv/config";

const REMOTE_CONFIRMATION = "ALLOW_REMOTE_DB_OPERATIONS";

function isLocalHost(hostname) {
  return ["localhost", "127.0.0.1", "::1"].includes(
    hostname.toLowerCase(),
  );
}

export function inspectDatabaseTarget(rawUrl) {
  if (!rawUrl || !rawUrl.trim()) {
    throw new Error("DIRECT_URL nuk është vendosur.");
  }

  let url;

  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("DIRECT_URL nuk është URL PostgreSQL e vlefshme.");
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DIRECT_URL duhet të përdorë PostgreSQL.");
  }

  if (!url.hostname) {
    throw new Error("DIRECT_URL nuk ka hostname të vlefshëm.");
  }

  if (!url.pathname || url.pathname === "/") {
    throw new Error("DIRECT_URL nuk përcakton database.");
  }

  return {
    local: isLocalHost(url.hostname),
  };
}

export function assertDatabaseOperationSafe(
  env = process.env,
) {
  const target = inspectDatabaseTarget(env.DIRECT_URL);

  if (target.local) {
    return;
  }

  if (env[REMOTE_CONFIRMATION] !== "true") {
    throw new Error(
      `Operacioni DB u bllokua: DIRECT_URL është remote. Vendos ${REMOTE_CONFIRMATION}=true vetëm kur synon qëllimisht një database remote.`,
    );
  }
}

function main() {
  assertDatabaseOperationSafe();

  console.log(
    "DB safety check PASS: target-i është i autorizuar për operacione administrative.",
  );
}

const isDirectExecution =
  process.argv[1] &&
  import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href;

if (isDirectExecution) {
  try {
    main();
  } catch (error) {
    console.error(
      error instanceof Error ? error.message : "DB safety check dështoi.",
    );
    process.exitCode = 1;
  }
}
