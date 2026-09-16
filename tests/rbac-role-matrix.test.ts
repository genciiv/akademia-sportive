import assert from "node:assert/strict";
import test from "node:test";

import {
  ACADEMY_ROLES,
  getRolePermissions,
  hasPermission,
  PERMISSIONS,
} from "../lib/permissions";

const ALL_ROLES =
  Object.values(ACADEMY_ROLES);

test("every academy role has a permission mapping without duplicates", () => {
  for (const role of ALL_ROLES) {
    const permissions =
      getRolePermissions(role);

    assert.ok(
      Array.isArray(permissions),
      `${role} should have a permission array`
    );

    assert.equal(
      new Set(permissions).size,
      permissions.length,
      `${role} should not contain duplicate permissions`
    );
  }
});

test("audit logs are available only to OWNER and ADMIN", () => {
  const allowed =
    new Set([
      "OWNER",
      "ADMIN",
    ]);

  for (const role of ALL_ROLES) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.AUDIT_LOGS_VIEW
      ),
      allowed.has(role),
      `Unexpected AUDIT_LOGS_VIEW access for ${role}`
    );
  }
});

test("staff administration is available only to OWNER and ADMIN", () => {
  const allowed =
    new Set([
      "OWNER",
      "ADMIN",
    ]);

  const permissions = [
    PERMISSIONS.STAFF_INVITE,
    PERMISSIONS.STAFF_UPDATE,
    PERMISSIONS.STAFF_REMOVE,
  ];

  for (const role of ALL_ROLES) {
    for (
      const permission of
      permissions
    ) {
      assert.equal(
        hasPermission(
          role,
          permission
        ),
        allowed.has(role),
        `Unexpected ${permission} access for ${role}`
      );
    }
  }
});

test("SPORTS_DIRECTOR has sports management but no finance administration", () => {
  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.TEAMS_UPDATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.MATCHES_UPDATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.PERFORMANCE_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.FINANCE_VIEW
    ),
    false
  );

  assert.equal(
    hasPermission(
      "SPORTS_DIRECTOR",
      PERMISSIONS.PAYMENTS_MANAGE
    ),
    false
  );
});

test("HEAD_COACH manages sports operations but not staff or finance", () => {
  assert.equal(
    hasPermission(
      "HEAD_COACH",
      PERMISSIONS.TRAINING_UPDATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "HEAD_COACH",
      PERMISSIONS.ATTENDANCE_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "HEAD_COACH",
      PERMISSIONS.MATCH_SQUAD_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "HEAD_COACH",
      PERMISSIONS.STAFF_UPDATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "HEAD_COACH",
      PERMISSIONS.FINANCE_VIEW
    ),
    false
  );
});

test("COACH has coaching permissions but no staff administration", () => {
  assert.equal(
    hasPermission(
      "COACH",
      PERMISSIONS.TRAINING_CREATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "COACH",
      PERMISSIONS.ATTENDANCE_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "COACH",
      PERMISSIONS.PERFORMANCE_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "COACH",
      PERMISSIONS.STAFF_UPDATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "COACH",
      PERMISSIONS.PAYMENTS_MANAGE
    ),
    false
  );
});

test("ASSISTANT_COACH has limited operational access", () => {
  assert.equal(
    hasPermission(
      "ASSISTANT_COACH",
      PERMISSIONS.TRAINING_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ASSISTANT_COACH",
      PERMISSIONS.ATTENDANCE_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ASSISTANT_COACH",
      PERMISSIONS.MATCH_SQUAD_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "ASSISTANT_COACH",
      PERMISSIONS.TRAINING_CREATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "ASSISTANT_COACH",
      PERMISSIONS.PERFORMANCE_MANAGE
    ),
    false
  );
});

test("FINANCE has finance permissions but no sports administration", () => {
  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.PAYMENTS_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.EXPENSES_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.REPORTS_FINANCE_VIEW
    ),
    true
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.MATCHES_UPDATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "FINANCE",
      PERMISSIONS.TRAINING_UPDATE
    ),
    false
  );
});

test("RECEPTIONIST can manage front-desk operations without administrative RBAC", () => {
  assert.equal(
    hasPermission(
      "RECEPTIONIST",
      PERMISSIONS.PLAYERS_CREATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "RECEPTIONIST",
      PERMISSIONS.GUARDIANS_UPDATE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "RECEPTIONIST",
      PERMISSIONS.CALENDAR_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "RECEPTIONIST",
      PERMISSIONS.PAYMENTS_MANAGE
    ),
    true
  );

  assert.equal(
    hasPermission(
      "RECEPTIONIST",
      PERMISSIONS.STAFF_UPDATE
    ),
    false
  );

  assert.equal(
    hasPermission(
      "RECEPTIONIST",
      PERMISSIONS.FINANCE_VIEW
    ),
    false
  );
});

test("MEMBER has only basic dashboard, calendar and notification access", () => {
  const permissions = [
    ...getRolePermissions(
      "MEMBER"
    ),
  ].sort();

  const expected = [
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.CALENDAR_VIEW,
    PERMISSIONS.NOTIFICATIONS_VIEW,
  ].sort();

  assert.deepEqual(
    permissions,
    expected
  );
});