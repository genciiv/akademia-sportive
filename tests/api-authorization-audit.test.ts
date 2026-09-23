import assert from "node:assert/strict";
import test from "node:test";

import {
  readdirSync,
  readFileSync,
  statSync,
} from "node:fs";

import {
  join,
  relative,
} from "node:path";

function walk(
  directory: string
): string[] {
  const files: string[] = [];

  for (
    const entry of
    readdirSync(directory)
  ) {
    const fullPath =
      join(
        directory,
        entry
      );

    if (
      statSync(fullPath)
        .isDirectory()
    ) {
      files.push(
        ...walk(fullPath)
      );
    } else if (
      entry === "route.ts"
    ) {
      files.push(
        fullPath
      );
    }
  }

  return files;
}

function normalizePath(
  path: string
) {
  return path
    .replaceAll("\\", "/");
}

const PUBLIC_OR_SPECIAL_ROUTES =
  new Set([
    "app/api/auth/[...all]/route.ts",
    "app/api/academy/route.ts",
    "app/api/academy-applications/route.ts",
    "app/api/invitations/[token]/route.ts",
    "app/api/registration-invitations/[token]/route.ts",
    "app/api/athlete-invitations/public/[token]/route.ts",
  ]);

const ACCESS_GUARDS = [
  "requireAcademyPermission",
  "requireAnyAcademyPermission",
  "requireEveryAcademyPermission",
  "getCurrentAcademyAccess",
  "getPlatformAdminAccess",
];

test("all academy API routes use an access guard or are explicitly allowlisted", () => {
  const apiRoot =
    join(
      process.cwd(),
      "app",
      "api"
    );

  const routeFiles =
    walk(apiRoot);

  const unguarded:
    string[] = [];

  for (
    const fullPath of
    routeFiles
  ) {
    const relativePath =
      normalizePath(
        relative(
          process.cwd(),
          fullPath
        )
      );

    if (
      PUBLIC_OR_SPECIAL_ROUTES.has(
        relativePath
      )
    ) {
      continue;
    }

    const source =
      readFileSync(
        fullPath,
        "utf8"
      );

    const hasGuard =
      ACCESS_GUARDS.some(
        (guard) =>
          source.includes(
            guard
          )
      );

    if (!hasGuard) {
      unguarded.push(
        relativePath
      );
    }
  }

  assert.deepEqual(
    unguarded,
    [],
    [
      "",
      "API routes without a recognized academy access guard:",
      ...unguarded.map(
        (path) =>
          `- ${path}`
      ),
    ].join("\n")
  );
});

test("special routes keep their expected authentication model", () => {
  const academyRoute =
    readFileSync(
      join(
        process.cwd(),
        "app/api/academy/route.ts"
      ),
      "utf8"
    );

  assert.match(
    academyRoute,
    /auth\.api\.getSession/
  );

  const invitationRoute =
    readFileSync(
      join(
        process.cwd(),
        "app/api/invitations/[token]/route.ts"
      ),
      "utf8"
    );

  assert.match(
    invitationRoute,
    /auth\.api\.getSession/
  );

  const authRoute =
    readFileSync(
      join(
        process.cwd(),
        "app/api/auth/[...all]/route.ts"
      ),
      "utf8"
    );

  assert.match(
    authRoute,
    /toNextJsHandler\(auth\)/
  );
});