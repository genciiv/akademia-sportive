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
      ...relativePath.split("/")
    ),
    "utf8"
  );
}

const mainRoute =
  readSource(
    "app/api/inter-academy-match-requests/route.ts"
  );

const acceptRoute =
  readSource(
    "app/api/inter-academy-match-requests/[requestId]/accept/route.ts"
  );

const rejectRoute =
  readSource(
    "app/api/inter-academy-match-requests/[requestId]/reject/route.ts"
  );

const cancelRoute =
  readSource(
    "app/api/inter-academy-match-requests/[requestId]/cancel/route.ts"
  );

const auditLog =
  readSource(
    "lib/audit-log.ts"
  );

test("inter-academy request list preserves tenant and team scope", () => {
  assert.match(
    mainRoute,
    /PERMISSIONS\.MATCHES_VIEW/
  );

  assert.match(
    mainRoute,
    /getActiveTeamScope/
  );

  assert.match(
    mainRoute,
    /requesterAcademyId:\s*access\.academyId/
  );

  assert.match(
    mainRoute,
    /opponentAcademyId:\s*access\.academyId/
  );

  assert.match(
    mainRoute,
    /requesterTeamId:\s*\{\s*in:\s*teamScope\.teamIds/
  );

  assert.match(
    mainRoute,
    /opponentTeamId:\s*\{\s*in:\s*teamScope\.teamIds/
  );
});

test("inter-academy request creation validates tenant and domain boundaries", () => {
  assert.match(
    mainRoute,
    /PERMISSIONS\.MATCHES_CREATE/
  );

  assert.match(
    mainRoute,
    /canAccessTeam/
  );

  assert.match(
    mainRoute,
    /requesterAcademyId:\s*access\.academyId/
  );

  assert.match(
    mainRoute,
    /status:\s*"ACTIVE"/
  );

  assert.match(
    mainRoute,
    /requesterTeam\.sport\s*!==\s*opponentTeam\.sport/
  );

  assert.match(
    mainRoute,
    /startsAtDate\s*<=\s*new Date\(\)/
  );
});

test("inter-academy request creation is transactional and audited", () => {
  assert.match(
    mainRoute,
    /prisma\.\$transaction/
  );

  assert.match(
    mainRoute,
    /tx\.interAcademyMatchRequest\.create/
  );

  assert.match(
    mainRoute,
    /AUDIT_ACTIONS\.INTER_ACADEMY_MATCH_REQUEST_CREATED/
  );

  assert.match(
    mainRoute,
    /writeAuditLog/
  );

  assert.match(
    mainRoute,
    /\btx,\s*\}\);/
  );
});

test("accept is receiver-only, race-safe, transactional, and creates both local matches", () => {
  assert.match(
    acceptRoute,
    /PERMISSIONS\.MATCHES_CREATE/
  );

  assert.match(
    acceptRoute,
    /opponentAcademyId:\s*access\.academyId/
  );

  assert.match(
    acceptRoute,
    /canAccessTeam/
  );

  assert.match(
    acceptRoute,
    /status:\s*"PENDING"/
  );

  assert.match(
    acceptRoute,
    /tx\.interAcademyMatchRequest\.updateMany/
  );

  const localMatchCreates =
    acceptRoute.match(
      /tx\.match\.create/g
    ) ?? [];

  assert.equal(
    localMatchCreates.length,
    2
  );

  assert.match(
    acceptRoute,
    /tx\.interAcademyMatch\.create/
  );

  assert.match(
    acceptRoute,
    /status:\s*"ACCEPTED"/
  );

  assert.match(
    acceptRoute,
    /AUDIT_ACTIONS\.INTER_ACADEMY_MATCH_REQUEST_ACCEPTED/
  );

  assert.match(
    acceptRoute,
    /\btx,\s*\}\);/
  );
});

test("reject is receiver-only and only transitions pending requests", () => {
  assert.match(
    rejectRoute,
    /PERMISSIONS\.MATCHES_UPDATE/
  );

  assert.match(
    rejectRoute,
    /opponentAcademyId:\s*access\.academyId/
  );

  assert.match(
    rejectRoute,
    /matchRequest\.opponentTeamId/
  );

  assert.match(
    rejectRoute,
    /tx\.interAcademyMatchRequest\.updateMany/
  );

  assert.match(
    rejectRoute,
    /status:\s*"PENDING"/
  );

  assert.match(
    rejectRoute,
    /status:\s*"REJECTED"/
  );

  assert.match(
    rejectRoute,
    /AUDIT_ACTIONS\.INTER_ACADEMY_MATCH_REQUEST_REJECTED/
  );

  assert.match(
    rejectRoute,
    /\btx,\s*\}\);/
  );
});

test("cancel is sender-only and only transitions pending requests", () => {
  assert.match(
    cancelRoute,
    /PERMISSIONS\.MATCHES_UPDATE/
  );

  assert.match(
    cancelRoute,
    /requesterAcademyId:\s*access\.academyId/
  );

  assert.match(
    cancelRoute,
    /matchRequest\.requesterTeamId/
  );

  assert.match(
    cancelRoute,
    /tx\.interAcademyMatchRequest\.updateMany/
  );

  assert.match(
    cancelRoute,
    /status:\s*"PENDING"/
  );

  assert.match(
    cancelRoute,
    /status:\s*"CANCELLED"/
  );

  assert.match(
    cancelRoute,
    /AUDIT_ACTIONS\.INTER_ACADEMY_MATCH_REQUEST_CANCELLED/
  );

  assert.match(
    cancelRoute,
    /\btx,\s*\}\);/
  );
});

test("inter-academy audit actions remain registered", () => {
  for (
    const action of [
      "INTER_ACADEMY_MATCH_REQUEST_CREATED",
      "INTER_ACADEMY_MATCH_REQUEST_ACCEPTED",
      "INTER_ACADEMY_MATCH_REQUEST_REJECTED",
      "INTER_ACADEMY_MATCH_REQUEST_CANCELLED",
    ]
  ) {
    assert.match(
      auditLog,
      new RegExp(action)
    );
  }
});
