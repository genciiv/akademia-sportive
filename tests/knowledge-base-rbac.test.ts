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

test("knowledge base permissions preserve the intended role matrix", () => {
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
    ]);

  for (
    const role of
    ALL_ROLES
  ) {
    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.KNOWLEDGE_VIEW
      ),
      canView.has(role),
      `Unexpected KNOWLEDGE_VIEW access for ${role}`
    );

    assert.equal(
      hasPermission(
        role,
        PERMISSIONS.KNOWLEDGE_MANAGE
      ),
      canManage.has(role),
      `Unexpected KNOWLEDGE_MANAGE access for ${role}`
    );
  }
});

test("coaching roles keep knowledge base read-only access", () => {
  for (
    const role of [
      "HEAD_COACH",
      "COACH",
      "ASSISTANT_COACH",
    ]
  ) {
    const permissions =
      getRolePermissions(role);

    assert.equal(
      permissions.includes(
        PERMISSIONS.KNOWLEDGE_VIEW
      ),
      true
    );

    assert.equal(
      permissions.includes(
        PERMISSIONS.KNOWLEDGE_MANAGE
      ),
      false
    );
  }
});

test("knowledge API preserves academy isolation and publication visibility", () => {
  const collection =
    readSource(
      "app/api/knowledge/route.ts"
    );

  const detail =
    readSource(
      "app/api/knowledge/[articleId]/route.ts"
    );

  assert.match(
    collection,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    collection,
    /PERMISSIONS\.KNOWLEDGE_VIEW/
  );

  assert.match(
    collection,
    /PERMISSIONS\.KNOWLEDGE_MANAGE/
  );

  assert.match(
    collection,
    /status:\s*"PUBLISHED"/
  );

  assert.match(
    collection,
    /authorId:\s*access\.session\.user\.id/
  );

  assert.match(
    detail,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    detail,
    /status:\s*"PUBLISHED"/
  );

  assert.match(
    detail,
    /PERMISSIONS\.KNOWLEDGE_MANAGE/
  );

  assert.match(
    detail,
    /publishedAt/
  );
});

test("knowledge page and UI preserve permission-aware actions", () => {
  const page =
    readSource(
      "app/baza-njohurive/page.tsx"
    );

  const client =
    readSource(
      "components/knowledge/knowledge-base-client.tsx"
    );

  assert.match(
    page,
    /requireAcademyPermission/
  );

  assert.match(
    page,
    /PERMISSIONS\.KNOWLEDGE_VIEW/
  );

  assert.match(
    client,
    /canManage/
  );

  assert.match(
    client,
    /\/api\/knowledge/
  );

  assert.match(
    client,
    /Shto material/
  );

  assert.match(
    client,
    /Lexo materialin/
  );
});