import assert from "node:assert/strict";
import test from "node:test";

import {
  readFileSync,
} from "node:fs";

import {
  join,
} from "node:path";

import {
  ACADEMY_ROLES,
  hasPermission,
  PERMISSIONS,
} from "../lib/permissions";

function readSource(
  relativePath: string
) {
  return readFileSync(
    join(
      process.cwd(),
      ...relativePath.split("/")
    ),
    "utf8"
  );
}

const ALL_ROLES =
  Object.values(
    ACADEMY_ROLES
  );

test("academy settings permissions preserve the owner and admin boundary", () => {
  const allowed =
    new Set([
      "OWNER",
      "ADMIN",
    ]);

  for (
    const role of
    ALL_ROLES
  ) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.SETTINGS_VIEW
      ),
      allowed.has(role),
      `Unexpected SETTINGS_VIEW access for ${role}`
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.SETTINGS_MANAGE
      ),
      allowed.has(role),
      `Unexpected SETTINGS_MANAGE access for ${role}`
    );
  }
});

test("academy settings API preserves academy isolation and read write permissions", () => {
  const source =
    readSource(
      "app/api/settings/academy/route.ts"
    );

  assert.match(
    source,
    /PERMISSIONS\.SETTINGS_VIEW/
  );

  assert.match(
    source,
    /PERMISSIONS\.SETTINGS_MANAGE/
  );

  assert.match(
    source,
    /id:\s*access\.academyId/
  );

  assert.match(
    source,
    /canManage/
  );

  assert.match(
    source,
    /data:\s*\{[\s\S]*?name,[\s\S]*?email,[\s\S]*?phone,[\s\S]*?address,[\s\S]*?city,[\s\S]*?country,[\s\S]*?\}/
  );
});

test("academy settings page keeps its settings view guard", () => {
  const page =
    readSource(
      "app/cilesimet/page.tsx"
    );

  assert.match(
    page,
    /requireAcademyPermission/
  );

  assert.match(
    page,
    /PERMISSIONS\.SETTINGS_VIEW/
  );

  assert.match(
    page,
    /<AcademySettings\s*\/>/
  );

  assert.match(
    page,
    /<SeasonsSettings\s*\/>/
  );
});

test("academy settings UI keeps mutations permission aware", () => {
  const client =
    readSource(
      "components/cilesimet/academy-settings.tsx"
    );

  assert.match(
    client,
    /\/api\/settings\/academy/
  );

  assert.match(
    client,
    /method:\s*"PATCH"/
  );

  assert.match(
    client,
    /canManage/
  );

  assert.match(
    client,
    /!canManage\s*\|\|\s*saving/
  );

  assert.match(
    client,
    /Ruaj ndryshimet/
  );
});