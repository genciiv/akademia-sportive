import assert from "node:assert/strict";
import test from "node:test";
import {
  readFileSync,
} from "node:fs";
import {
  join,
} from "node:path";

function readSource(
  relativePath: string
) {
  return readFileSync(
    join(
      process.cwd(),
      relativePath
    ),
    "utf8"
  );
}

function assertPermissionGuard(
  source: string,
  permission: string
) {
  const pattern = new RegExp(
    `requireAcademyPermission\\(\\s*PERMISSIONS\\.${permission}\\s*\\)`
  );

  assert.match(
    source,
    pattern,
    `Expected ${permission} permission guard`
  );
}

function assertAcademyScoped(
  source: string
) {
  assert.match(
    source,
    /academyId:\s*access\.academyId/,
    "Expected academyId to be scoped to access.academyId"
  );
}

function auditBlocks(
  source: string
) {
  return Array.from(
    source.matchAll(
      /writeAuditLog\(\{([\s\S]*?)\n\s*\}\);/g
    )
  ).map(
    (match) =>
      match[1] || ""
  );
}

test("staff PATCH and DELETE use separate administration permissions", () => {
  const source = readSource(
    "app/api/staff/[membershipId]/route.ts"
  );

  assertPermissionGuard(
    source,
    "STAFF_UPDATE"
  );

  assertPermissionGuard(
    source,
    "STAFF_REMOVE"
  );

  assertAcademyScoped(source);
});

test("staff administration protects OWNER, self-management and ADMIN hierarchy", () => {
  const source = readSource(
    "app/api/staff/[membershipId]/route.ts"
  );

  assert.match(
    source,
    /targetRole === "OWNER"/
  );

  assert.match(
    source,
    /target\.id ===\s*access\.membership\.id/
  );

  assert.match(
    source,
    /targetRole === "ADMIN" &&\s*access\.role !== "OWNER"/
  );

  assert.match(
    source,
    /body\.role === "ADMIN" &&\s*access\.role !== "OWNER"/
  );
});

test("staff mutations preserve expected audit actions", () => {
  const source = readSource(
    "app/api/staff/[membershipId]/route.ts"
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_ROLE_CHANGED/
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_ACCESS_CHANGED/
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_REMOVED/
  );
});

test("invitation list requires STAFF_INVITE and academy scope", () => {
  const source = readSource(
    "app/api/staff/invitations/route.ts"
  );

  assertPermissionGuard(
    source,
    "STAFF_INVITE"
  );

  assertAcademyScoped(source);

  assert.match(
    source,
    /access\.role !== "OWNER"/
  );

  assert.match(
    source,
    /notIn:\s*\[\s*"OWNER",\s*"ADMIN"/
  );
});

test("invitation creation requires STAFF_INVITE and protects ADMIN invitations", () => {
  const source = readSource(
    "app/api/staff/profiles/[staffId]/invite/route.ts"
  );

  assertPermissionGuard(
    source,
    "STAFF_INVITE"
  );

  assertAcademyScoped(source);

  assert.match(
    source,
    /role === "ADMIN" &&\s*access\.role !== "OWNER"/
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_INVITATION_CREATED/
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_ACCOUNT_LINKED/
  );
});

test("invitation resend requires STAFF_INVITE, academy scope and OWNER control for ADMIN", () => {
  const source = readSource(
    "app/api/staff/invitations/[invitationId]/resend/route.ts"
  );

  assertPermissionGuard(
    source,
    "STAFF_INVITE"
  );

  assertAcademyScoped(source);

  assert.match(
    source,
    /invitation\.role === "ADMIN" &&\s*access\.role !== "OWNER"/
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_INVITATION_RESENT/
  );
});

test("invitation revoke requires STAFF_INVITE, academy scope and OWNER control for ADMIN", () => {
  const source = readSource(
    "app/api/staff/invitations/[invitationId]/route.ts"
  );

  assertPermissionGuard(
    source,
    "STAFF_INVITE"
  );

  assertAcademyScoped(source);

  assert.match(
    source,
    /invitation\.role === "ADMIN" &&\s*access\.role !== "OWNER"/
  );

  assert.match(
    source,
    /AUDIT_ACTIONS\.STAFF_INVITATION_REVOKED/
  );
});

test("audit log endpoint requires AUDIT_LOGS_VIEW and academy scope", () => {
  const source = readSource(
    "app/api/staff/audit-logs/route.ts"
  );

  assertPermissionGuard(
    source,
    "AUDIT_LOGS_VIEW"
  );

  assertAcademyScoped(source);

  assert.match(
    source,
    /take:\s*100/
  );
});

test("invitation audit payloads never store invitation tokens", () => {
  const paths = [
    "app/api/staff/profiles/[staffId]/invite/route.ts",
    "app/api/staff/invitations/[invitationId]/resend/route.ts",
    "app/api/staff/invitations/[invitationId]/route.ts",
  ];

  let blocksChecked = 0;

  for (const path of paths) {
    const source =
      readSource(path);

    for (
      const block of
      auditBlocks(source)
    ) {
      blocksChecked += 1;

      assert.doesNotMatch(
        block,
        /\btoken\s*:/,
        `Audit payload in ${path} must not store token`
      );

      assert.doesNotMatch(
        block,
        /\binvitePath\s*:/,
        `Audit payload in ${path} must not store invitePath`
      );
    }
  }

  assert.ok(
    blocksChecked >= 4,
    "Expected invitation audit blocks to be checked"
  );
});