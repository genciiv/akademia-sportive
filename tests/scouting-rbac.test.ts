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

test("scouting permissions preserve the intended role matrix", () => {
  const canView = new Set([
    "OWNER",
    "ADMIN",
    "SPORTS_DIRECTOR",
    "HEAD_COACH",
  ]);

  const canManage = new Set([
    "OWNER",
    "ADMIN",
    "SPORTS_DIRECTOR",
  ]);

  for (const role of ALL_ROLES) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.SCOUTING_VIEW
      ),
      canView.has(role),
      `Unexpected SCOUTING_VIEW access for ${role}`
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.SCOUTING_MANAGE
      ),
      canManage.has(role),
      `Unexpected SCOUTING_MANAGE access for ${role}`
    );
  }
});

test("head coach keeps scouting read-only access", () => {
  assert.equal(
    hasPermission(
      ACADEMY_ROLES.HEAD_COACH,
      PERMISSIONS.SCOUTING_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      ACADEMY_ROLES.HEAD_COACH,
      PERMISSIONS.SCOUTING_MANAGE
    ),
    false
  );
});

test("scouting candidate APIs preserve permissions and academy isolation", () => {
  const collection = readSource(
    "app/api/scouting/route.ts"
  );

  const item = readSource(
    "app/api/scouting/[candidateId]/route.ts"
  );

  assert.match(
    collection,
    /PERMISSIONS\.SCOUTING_VIEW/
  );

  assert.match(
    collection,
    /PERMISSIONS\.SCOUTING_MANAGE/
  );

  assert.match(
    collection,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    item,
    /PERMISSIONS\.SCOUTING_VIEW/
  );

  const manageGuards =
    item.match(
      /PERMISSIONS\.SCOUTING_MANAGE/g
    ) ?? [];

  assert.equal(
    manageGuards.length >= 2,
    true
  );

  assert.match(
    item,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    item,
    /scoutingCandidate\.update/
  );

  assert.match(
    item,
    /scoutingCandidate\.delete/
  );
});

test("scouting observation APIs preserve candidate and academy scope", () => {
  const collection = readSource(
    "app/api/scouting/[candidateId]/observations/route.ts"
  );

  const item = readSource(
    "app/api/scouting/[candidateId]/observations/[observationId]/route.ts"
  );

  assert.match(
    collection,
    /PERMISSIONS\.SCOUTING_VIEW/
  );

  assert.match(
    collection,
    /PERMISSIONS\.SCOUTING_MANAGE/
  );

  assert.match(
    collection,
    /academyId/
  );

  assert.match(
    collection,
    /candidateId:\s*candidate\.id/
  );

  const manageGuards =
    item.match(
      /PERMISSIONS\.SCOUTING_MANAGE/g
    ) ?? [];

  assert.equal(
    manageGuards.length >= 2,
    true
  );

  assert.match(
    item,
    /candidate:\s*\{\s*academyId/
  );

  assert.match(
    item,
    /scoutingObservation\.update/
  );

  assert.match(
    item,
    /scoutingObservation\.delete/
  );
});

test("scouting page and sidebar require scouting view permission", () => {
  const page = readSource(
    "app/skautimi/page.tsx"
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
    /PERMISSIONS\.SCOUTING_VIEW/
  );

  assert.match(
    sidebar,
    /href:\s*"\/skautimi"/
  );

  assert.match(
    sidebar,
    /PERMISSIONS\.SCOUTING_VIEW/
  );
});

test("scouting UI gates mutations behind manage access", () => {
  const client = readSource(
    "components/skautimi/scouting-client.tsx"
  );

  const details = readSource(
    "components/skautimi/candidate-details.tsx"
  );

  assert.match(
    client,
    /canManage/
  );

  assert.match(
    client,
    /\{canManage\s*&&\s*\(/
  );

  assert.match(
    client,
    /canManage=\{canManage\}/
  );

  assert.match(
    details,
    /canManage:\s*boolean/
  );

  const manageGates =
    details.match(
      /\{canManage\s*&&\s*\(/g
    ) ?? [];

  assert.equal(
    manageGates.length >= 3,
    true
  );

  assert.match(
    details,
    /Shto vëzhgim/
  );

  assert.match(
    details,
    /Edito vëzhgimin/
  );

  assert.match(
    details,
    /Fshi vëzhgimin/
  );

  assert.match(
    details,
    /Edito kandidatin/
  );

  assert.match(
    details,
    /Fshi kandidatin/
  );
});