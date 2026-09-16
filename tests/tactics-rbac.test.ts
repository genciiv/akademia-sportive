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
  getRolePermissions,
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

test("tactics permissions preserve the intended role matrix", () => {
  const canView =
    new Set([
      "OWNER",
      "ADMIN",
      "SPORTS_DIRECTOR",
      "HEAD_COACH",
      "COACH",
      "ASSISTANT_COACH",
    ]);

  const canManage =
    new Set([
      "OWNER",
      "ADMIN",
      "SPORTS_DIRECTOR",
      "HEAD_COACH",
      "COACH",
    ]);

  for (
    const role of
    ALL_ROLES
  ) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.TACTICS_VIEW
      ),
      canView.has(role),
      `Unexpected TACTICS_VIEW access for ${role}`
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.TACTICS_MANAGE
      ),
      canManage.has(role),
      `Unexpected TACTICS_MANAGE access for ${role}`
    );
  }
});

test("assistant coach keeps tactics read-only access", () => {
  const permissions =
    getRolePermissions(
      "ASSISTANT_COACH"
    );

  assert.equal(
    permissions.includes(
      PERMISSIONS.TACTICS_VIEW
    ),
    true
  );

  assert.equal(
    permissions.includes(
      PERMISSIONS.TACTICS_MANAGE
    ),
    false
  );
});

test("tactics API preserves academy and team scope enforcement", () => {
  const collection =
    readSource(
      "app/api/tactics/route.ts"
    );

  const detail =
    readSource(
      "app/api/tactics/[tacticId]/route.ts"
    );

  assert.match(
    collection,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    collection,
    /getActiveTeamScope/
  );

  assert.match(
    collection,
    /teamScope\.isScoped/
  );

  assert.match(
    collection,
    /teamScope\.teamIds\.includes/
  );

  assert.match(
    collection,
    /isTeamScoped:\s*teamScope\.isScoped/
  );

  assert.match(
    detail,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    detail,
    /getActiveTeamScope/
  );

  assert.match(
    detail,
    /teamScope\.teamIds\.includes/
  );

  assert.match(
    detail,
    /!existing\.teamId/
  );
});

test("tactics page and UI preserve permission-aware actions", () => {
  const page =
    readSource(
      "app/taktikat/page.tsx"
    );

  const client =
    readSource(
      "components/taktikat/taktikat-client.tsx"
    );

  assert.match(
    page,
    /requireAcademyPermission/
  );

  assert.match(
    page,
    /PERMISSIONS\.TACTICS_VIEW/
  );

  assert.match(
    client,
    /tactic\.canManage/
  );

  assert.match(
    client,
    /isTeamScoped/
  );
});