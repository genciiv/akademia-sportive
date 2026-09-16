import assert from "node:assert/strict";
import test from "node:test";

import {
  getRolePermissions,
  hasPermission,
  PERMISSIONS,
} from "../lib/permissions";

test("OWNER has every defined permission", () => {
  const ownerPermissions =
    getRolePermissions("OWNER");

  const allPermissions =
    Object.values(PERMISSIONS);

  assert.equal(
    ownerPermissions.length,
    allPermissions.length
  );

  for (const permission of allPermissions) {
    assert.equal(
      hasPermission(
        "OWNER",
        permission
      ),
      true,
      `OWNER should have ${permission}`
    );
  }
});

test("ADMIN can fully manage staff and view audit logs", () => {
  assert.equal(
    hasPermission(
      "ADMIN",
      PERMISSIONS.STAFF_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ADMIN",
      PERMISSIONS.STAFF_INVITE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ADMIN",
      PERMISSIONS.STAFF_UPDATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ADMIN",
      PERMISSIONS.STAFF_REMOVE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ADMIN",
      PERMISSIONS.AUDIT_LOGS_VIEW
    ),
    true
  );
});

test("SPORTS_DIRECTOR can view staff but cannot administer staff or audit logs", () => {
  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.STAFF_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.STAFF_INVITE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.STAFF_UPDATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.STAFF_REMOVE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.AUDIT_LOGS_VIEW
    ),
    false
  );
});

test("FINANCE has finance access but no staff administration or audit access", () => {
  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.FINANCE_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.PAYMENTS_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.STAFF_UPDATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.AUDIT_LOGS_VIEW
    ),
    false
  );
});

test("unknown roles receive no permissions", () => {
  assert.deepEqual(
    getRolePermissions(
      "UNKNOWN_ROLE"
    ),
    []
  );

  assert.equal(
    hasPermission(
      "UNKNOWN_ROLE",
      PERMISSIONS.DASHBOARD_VIEW
    ),
    false
  );
});