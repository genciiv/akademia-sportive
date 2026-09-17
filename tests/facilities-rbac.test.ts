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
  PERMISSIONS,
  ROLE_PERMISSIONS,
} from "../lib/permissions";

type HttpMethod =
  | "GET"
  | "POST"
  | "PATCH"
  | "DELETE";

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

function hasPermission(
  role: keyof typeof ROLE_PERMISSIONS,
  permission:
    (typeof PERMISSIONS)[keyof typeof PERMISSIONS]
) {
  return ROLE_PERMISSIONS[
    role
  ].includes(permission);
}

function getHandlerBlock(
  source: string,
  method: HttpMethod
) {
  const pattern =
    /export\s+async\s+function\s+(GET|POST|PATCH|DELETE)\s*\(/g;

  const matches =
    Array.from(
      source.matchAll(pattern)
    );

  const index =
    matches.findIndex(
      (match) =>
        match[1] === method
    );

  assert.notEqual(
    index,
    -1,
    `Expected ${method} handler`
  );

  const start =
    matches[index].index ?? 0;

  const end =
    index + 1 < matches.length
      ? matches[index + 1].index ??
        source.length
      : source.length;

  return source.slice(
    start,
    end
  );
}

test("facilities role matrix is enforced", () => {
  const manageRoles = [
    ACADEMY_ROLES.OWNER,
    ACADEMY_ROLES.ADMIN,
  ] as const;

  const viewOnlyRoles = [
    ACADEMY_ROLES.SPORTS_DIRECTOR,
    ACADEMY_ROLES.HEAD_COACH,
    ACADEMY_ROLES.COACH,
    ACADEMY_ROLES.ASSISTANT_COACH,
  ] as const;

  const deniedRoles = [
    ACADEMY_ROLES.FINANCE,
    ACADEMY_ROLES.RECEPTIONIST,
    ACADEMY_ROLES.MEMBER,
  ] as const;

  for (const role of manageRoles) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.FACILITIES_VIEW
      ),
      true
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.FACILITIES_MANAGE
      ),
      true
    );
  }

  for (const role of viewOnlyRoles) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.FACILITIES_VIEW
      ),
      true
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.FACILITIES_MANAGE
      ),
      false
    );
  }

  for (const role of deniedRoles) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.FACILITIES_VIEW
      ),
      false
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.FACILITIES_MANAGE
      ),
      false
    );
  }
});

test("facilities collection API preserves permissions and academy scope", () => {
  const source =
    readSource(
      "app/api/facilities/route.ts"
    );

  const getBlock =
    getHandlerBlock(
      source,
      "GET"
    );

  const postBlock =
    getHandlerBlock(
      source,
      "POST"
    );

  assert.match(
    getBlock,
    /requireAcademyPermission\(\s*PERMISSIONS\.FACILITIES_VIEW\s*\)/
  );

  assert.match(
    postBlock,
    /requireAcademyPermission\(\s*PERMISSIONS\.FACILITIES_MANAGE\s*\)/
  );

  assert.match(
    getBlock,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    postBlock,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    postBlock,
    /prisma\.facility\.create/
  );

  assert.match(
    postBlock,
    /status:\s*201/
  );
});

test("facilities item API preserves view/manage boundary and academy scope", () => {
  const source =
    readSource(
      "app/api/facilities/[facilityId]/route.ts"
    );

  const getBlock =
    getHandlerBlock(
      source,
      "GET"
    );

  const patchBlock =
    getHandlerBlock(
      source,
      "PATCH"
    );

  const deleteBlock =
    getHandlerBlock(
      source,
      "DELETE"
    );

  assert.match(
    getBlock,
    /PERMISSIONS\.FACILITIES_VIEW/
  );

  assert.match(
    patchBlock,
    /PERMISSIONS\.FACILITIES_MANAGE/
  );

  assert.match(
    deleteBlock,
    /PERMISSIONS\.FACILITIES_MANAGE/
  );

  for (
    const block of [
      getBlock,
      patchBlock,
      deleteBlock,
    ]
  ) {
    assert.match(
      block,
      /id:\s*facilityId/
    );

    assert.match(
      block,
      /academyId:\s*access\.academyId/
    );
  }

  assert.match(
    patchBlock,
    /prisma\.facility\.update/
  );

  assert.match(
    deleteBlock,
    /prisma\.facility\.delete/
  );
});

test("facilities page and sidebar require facilities view permission", () => {
  const page =
    readSource(
      "app/ambientet/page.tsx"
    );

  const sidebar =
    readSource(
      "components/sidebar.tsx"
    );

  assert.match(
    page,
    /PERMISSIONS\.FACILITIES_VIEW/
  );

  assert.match(
    page,
    /PERMISSIONS\.FACILITIES_MANAGE/
  );

  assert.match(
    sidebar,
    /href:\s*"\/ambientet"/
  );

  assert.match(
    sidebar,
    /PERMISSIONS\.FACILITIES_VIEW/
  );
});

test("facilities UI keeps mutations behind manage access", () => {
  const client =
    readSource(
      "components/ambientet/facilities-client.tsx"
    );

  assert.match(
    client,
    /canManageFacilities\s*&&/
  );

  assert.match(
    client,
    /\?\s*"PATCH"/
  );

  assert.match(
    client,
    /:\s*"POST"/
  );

  assert.match(
    client,
    /method:\s*"DELETE"/
  );

  assert.match(
    client,
    /openEditForm/
  );

  assert.match(
    client,
    /handleDelete/
  );
});

test("facility schema preserves academy ownership and lifecycle fields", () => {
  const schema =
    readSource(
      "prisma/schema.prisma"
    );

  assert.match(
    schema,
    /facilities\s+Facility\[\]/
  );

  assert.match(
    schema,
    /model Facility/
  );

  assert.match(
    schema,
    /enum FacilityType/
  );

  assert.match(
    schema,
    /enum FacilityStatus/
  );

  assert.match(
    schema,
    /academy\s+Academy\s+@relation\(fields:\s*\[academyId\],\s*references:\s*\[id\],\s*onDelete:\s*Cascade\)/
  );

  assert.match(
    schema,
    /@@unique\(\[academyId,\s*name\]\)/
  );

  assert.match(
    schema,
    /isIndoor\s+Boolean\s+@default\(false\)/
  );

  assert.match(
    schema,
    /capacity\s+Int\?/
  );
});
