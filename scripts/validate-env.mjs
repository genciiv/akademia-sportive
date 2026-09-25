import "dotenv/config";

async function main() {
  const { validateProductionEnv } = await import(
    "../lib/env-validation.ts"
  );

  validateProductionEnv({
    ...process.env,
    NODE_ENV: "production",
  });

  console.log(
    "Production environment validation PASS.",
  );
}

main().catch((error) => {
  console.error(
    error instanceof Error
      ? error.message
      : "Production environment validation dështoi.",
  );
  process.exitCode = 1;
});
