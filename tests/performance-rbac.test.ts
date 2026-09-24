import assert from "node:assert/strict";
import test from "node:test";

import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  ACADEMY_ROLES,
  hasPermission,
  PERMISSIONS,
} from "../lib/permissions";

function readSource(relativePath: string) {
  return readFileSync(
    join(
      process.cwd(),
      ...relativePath.split("/")
    ),
    "utf8"
  );
}

const ALL_ROLES =
  Object.values(ACADEMY_ROLES);

test("performance permissions preserve the intended role matrix", () => {
  const canView = new Set([
    "OWNER",
    "ADMIN",
    "SPORTS_DIRECTOR",
    "HEAD_COACH",
    "COACH",
    "ASSISTANT_COACH",
  ]);

  const canManage = new Set([
    "OWNER",
    "ADMIN",
    "SPORTS_DIRECTOR",
    "HEAD_COACH",
    "COACH",
  ]);

  for (const role of ALL_ROLES) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.PERFORMANCE_VIEW
      ),
      canView.has(role),
      `Unexpected PERFORMANCE_VIEW access for ${role}`
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.PERFORMANCE_MANAGE
      ),
      canManage.has(role),
      `Unexpected PERFORMANCE_MANAGE access for ${role}`
    );
  }
});

test("assistant coach keeps performance read-only access", () => {
  assert.equal(
    hasPermission(
      ACADEMY_ROLES.ASSISTANT_COACH,
      PERMISSIONS.PERFORMANCE_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      ACADEMY_ROLES.ASSISTANT_COACH,
      PERMISSIONS.PERFORMANCE_MANAGE
    ),
    false
  );
});

test("performance dashboard API preserves view permission and resource scope", () => {
  const api = readSource(
    "app/api/performance/route.ts"
  );

  assert.match(
    api,
    /PERMISSIONS\.PERFORMANCE_VIEW/
  );

  assert.match(
    api,
    /academyId/
  );

  assert.match(
    api,
    /canAccessTeam/
  );

  assert.match(
    api,
    /canAccessPlayer/
  );

  assert.match(
    api,
    /getActiveTeamScope/
  );
});

test("match performance API preserves view manage boundary and match scope", () => {
  const api = readSource(
    "app/api/matches/[matchId]/performance/route.ts"
  );

  assert.match(
    api,
    /PERMISSIONS\.PERFORMANCE_VIEW/
  );

  const manageGuards =
    api.match(
      /PERMISSIONS\.PERFORMANCE_MANAGE/g
    ) ?? [];

  assert.equal(
    manageGuards.length >= 2,
    true
  );

  assert.match(
    api,
    /canAccessMatch/
  );

  assert.match(
    api,
    /academyId/
  );

  assert.match(
    api,
    /playerMatchPerformance\.upsert/
  );

  assert.match(
    api,
    /playerMatchPerformance\.delete/
  );
});

test("performance page and sidebar require performance view permission", () => {
  const page = readSource(
    "app/performanca/page.tsx"
  );

  const sidebar = readSource(
    "components/sidebar.tsx"
  );

  assert.match(
    page,
    /requireAcademyPermission/
  );

  assert.match(
    page,
    /PERMISSIONS\.PERFORMANCE_VIEW/
  );

  assert.match(
    sidebar,
    /href:\s*"\/performanca"/
  );

  assert.match(
    sidebar,
    /PERMISSIONS\.PERFORMANCE_VIEW/
  );
});

test("match performance UI gates mutations behind manage access", () => {
  const section = readSource(
    "components/ndeshjet/performance-section.tsx"
  );

  const api = readSource(
    "app/api/matches/[matchId]/performance/route.ts"
  );

  assert.match(
    api,
    /canManage/
  );

  assert.match(
    api,
    /PERMISSIONS\.PERFORMANCE_MANAGE/
  );

  assert.match(
    section,
    /canManage/
  );

  const manageGates =
    section.match(
      /\{canManage\s*&&/g
    ) ?? [];

  assert.equal(
    manageGates.length >= 3,
    true
  );

  assert.match(
    section,
    /Shto performancën/
  );

  assert.match(
    section,
    /Edito performancën/
  );

  assert.match(
    section,
    /Fshi performancën/
  );
});