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
test("academy settings API exposes subscription plan and usage data", () => {
  const source =
    readSource(
      "app/api/settings/academy/route.ts"
    );

  assert.match(
    source,
    /subscription:\s*\{/
  );

  assert.match(
    source,
    /plan:\s*\{/
  );

  assert.match(
    source,
    /monthlyPrice:\s*true/
  );

  assert.match(
    source,
    /maxPlayers:\s*true/
  );

  assert.match(
    source,
    /maxTeams:\s*true/
  );

  assert.match(
    source,
    /maxStaff:\s*true/
  );

  assert.match(
    source,
    /maxFacilities:\s*true/
  );

  assert.match(
    source,
    /maxAthleteAccounts:\s*true/
  );

  assert.match(
    source,
    /_count:\s*\{/
  );

  assert.match(
    source,
    /players:\s*true/
  );

  assert.match(
    source,
    /teams:\s*true/
  );

  assert.match(
    source,
    /staff:\s*true/
  );

  assert.match(
    source,
    /facilities:\s*true/
  );

  assert.match(
    source,
    /athleteAccounts:\s*true/
  );

  assert.match(
    source,
    /monthlyPrice\.toString\(\)/
  );
});

test("academy settings UI renders subscription usage and plan features", () => {
  const client =
    readSource(
      "components/cilesimet/academy-settings.tsx"
    );

  assert.match(
    client,
    /Plani & abonimi/
  );

  assert.match(
    client,
    /Përdorimi i planit/
  );

  assert.match(
    client,
    /Funksionalitetet e planit/
  );

  assert.match(
    client,
    /academy\._count\.players/
  );

  assert.match(
    client,
    /academy\._count\.teams/
  );

  assert.match(
    client,
    /academy\._count\.staff/
  );

  assert.match(
    client,
    /academy\._count\.facilities/
  );

  assert.match(
    client,
    /maxAthleteAccounts/
  );

  assert.match(
    client,
    /plan\.features\.map/
  );

  assert.match(
    client,
    /subscription\.currentPeriodEnd/
  );

  assert.match(
    client,
    /subscription\.trialEndsAt/
  );
});
