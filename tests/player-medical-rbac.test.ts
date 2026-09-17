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

test("medical role matrix is enforced", () => {
  const manageRoles = [
    ACADEMY_ROLES.OWNER,
    ACADEMY_ROLES.ADMIN,
    ACADEMY_ROLES.SPORTS_DIRECTOR,
    ACADEMY_ROLES.HEAD_COACH,
  ] as const;

  const viewOnlyRoles = [
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
        PERMISSIONS.MEDICAL_VIEW
      ),
      true
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.MEDICAL_MANAGE
      ),
      true
    );
  }

  for (const role of viewOnlyRoles) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.MEDICAL_VIEW
      ),
      true
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.MEDICAL_MANAGE
      ),
      false
    );
  }

  for (const role of deniedRoles) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.MEDICAL_VIEW
      ),
      false
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.MEDICAL_MANAGE
      ),
      false
    );
  }
});

test("medical collection API preserves permission and player scope", () => {
  const collection =
    readSource(
      "app/api/players/[playerId]/medical-records/route.ts"
    );

  assert.match(
    collection,
    /PERMISSIONS\.MEDICAL_VIEW/
  );

  assert.match(
    collection,
    /PERMISSIONS\.MEDICAL_MANAGE/
  );

  assert.match(
    collection,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    collection,
    /canAccessPlayer/
  );

  assert.match(
    collection,
    /playerId:\s*player\.id/
  );

  assert.match(
    collection,
    /privateNotes:\s*canManageMedical/
  );

  assert.doesNotMatch(
    collection,
    /records:\s*safeRecords/
  );
});

test("medical item API requires manage permission and binds record to player", () => {
  const item =
    readSource(
      "app/api/players/[playerId]/medical-records/[recordId]/route.ts"
    );

  const manageGuards =
    item.match(
      /PERMISSIONS\.MEDICAL_MANAGE/g
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
    /canAccessPlayer/
  );

  assert.match(
    item,
    /id:\s*recordId/
  );

  assert.match(
    item,
    /playerId:\s*player\.id/
  );

  assert.match(
    item,
    /playerMedicalRecord\.update/
  );

  assert.match(
    item,
    /playerMedicalRecord\.delete/
  );
});

test("medical page and sidebar require medical view permission", () => {
  const page =
    readSource(
      "app/mjekesore/page.tsx"
    );

  const sidebar =
    readSource(
      "components/sidebar.tsx"
    );

  assert.match(
    page,
    /PERMISSIONS\.MEDICAL_VIEW/
  );

  assert.match(
    page,
    /PERMISSIONS\.MEDICAL_MANAGE/
  );

  assert.match(
    sidebar,
    /href:\s*"\/mjekesore"/
  );

  assert.match(
    sidebar,
    /PERMISSIONS\.MEDICAL_VIEW/
  );
});

test("medical UI gates mutations and private notes behind manage access", () => {
  const client =
    readSource(
      "components/mjekesore/medical-client.tsx"
    );

  assert.match(
    client,
    /canManageMedical\s*&&/
  );

  assert.match(
    client,
    /method:\s*"DELETE"/
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
    /record\.privateNotes/
  );

  assert.match(
    client,
    /Shënime private/
  );
});

test("medical schema defines player relation and medical lifecycle fields", () => {
  const schema =
    readSource(
      "prisma/schema.prisma"
    );

  assert.match(
    schema,
    /medicalRecords\s+PlayerMedicalRecord\[\]/
  );

  assert.match(
    schema,
    /model PlayerMedicalRecord/
  );

  assert.match(
    schema,
    /enum MedicalRecordType/
  );

  assert.match(
    schema,
    /enum MedicalRecordStatus/
  );

  assert.match(
    schema,
    /enum MedicalAvailability/
  );

  assert.match(
    schema,
    /privateNotes\s+String\?/
  );

  assert.match(
    schema,
    /onDelete:\s*Cascade/
  );
});
