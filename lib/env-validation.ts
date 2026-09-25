const REQUIRED_PRODUCTION_ENV = [
  "DATABASE_URL",
  "DIRECT_URL",
  "BETTER_AUTH_URL",
  "BETTER_AUTH_SECRET",
  "NEXT_PUBLIC_APP_URL",
] as const;

const REQUIRED_EMAIL_ENV = [
  "BREVO_API_KEY",
  "BREVO_SENDER_EMAIL",
] as const;

function hasValue(value: string | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function requireValidHttpUrl(
  env: NodeJS.ProcessEnv,
  name: "BETTER_AUTH_URL" | "NEXT_PUBLIC_APP_URL",
) {
  const value = env[name]?.trim();

  if (!value) return;

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} duhet të jetë URL e vlefshme.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} duhet të përdorë http ose https.`);
  }

  if (env.NODE_ENV === "production" && url.protocol !== "https:") {
    throw new Error(`${name} duhet të përdorë https në production.`);
  }
}

function requireValidPostgresUrl(
  env: NodeJS.ProcessEnv,
  name: "DATABASE_URL" | "DIRECT_URL",
) {
  const value = env[name]?.trim();

  if (!value) return;

  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} duhet të jetë URL PostgreSQL e vlefshme.`);
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(`${name} duhet të përdorë PostgreSQL.`);
  }

  if (!url.hostname) {
    throw new Error(`${name} duhet të ketë hostname të vlefshëm.`);
  }

  if (!url.pathname || url.pathname === "/") {
    throw new Error(`${name} duhet të përcaktojë database.`);
  }
}

export function validateProductionEnv(
  env: NodeJS.ProcessEnv = process.env,
) {
  if (env.NODE_ENV !== "production") {
    return;
  }

  const missing = REQUIRED_PRODUCTION_ENV.filter(
    (name) => !hasValue(env[name]),
  );

  if (missing.length > 0) {
    throw new Error(
      `Mungojnë variablat e detyrueshme të production: ${missing.join(", ")}.`,
    );
  }

  requireValidPostgresUrl(env, "DATABASE_URL");
  requireValidPostgresUrl(env, "DIRECT_URL");

  requireValidHttpUrl(env, "BETTER_AUTH_URL");
  requireValidHttpUrl(env, "NEXT_PUBLIC_APP_URL");

  const configuredEmail = REQUIRED_EMAIL_ENV.filter((name) =>
    hasValue(env[name]),
  );

  if (
    configuredEmail.length > 0 &&
    configuredEmail.length !== REQUIRED_EMAIL_ENV.length
  ) {
    throw new Error(
      "Konfigurimi Brevo është i paplotë: BREVO_API_KEY dhe BREVO_SENDER_EMAIL duhet të vendosen së bashku.",
    );
  }
}
