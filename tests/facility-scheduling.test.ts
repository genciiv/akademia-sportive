import assert from "node:assert/strict";
import test from "node:test";

import {
  readFileSync,
} from "node:fs";

import {
  join,
} from "node:path";

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

function sourceBetween(
  source: string,
  startMarker: string,
  endMarker?: string
) {
  const start =
    source.indexOf(startMarker);

  assert.notEqual(
    start,
    -1,
    `Expected marker: ${startMarker}`
  );

  if (!endMarker) {
    return source.slice(start);
  }

  const end =
    source.indexOf(
      endMarker,
      start + startMarker.length
    );

  assert.notEqual(
    end,
    -1,
    `Expected marker: ${endMarker}`
  );

  return source.slice(
    start,
    end
  );
}

test("facility scheduling schema links training sessions and matches safely", () => {
  const schema =
    readSource(
      "prisma/schema.prisma"
    );

  assert.match(
    schema,
    /trainingSessions\s+TrainingSession\[\]/
  );

  assert.match(
    schema,
    /matches\s+Match\[\]/
  );

  assert.match(
    schema,
    /facilityId\s+String\?/
  );

  assert.match(
    schema,
    /facility\s+Facility\?\s+@relation\(fields:\s*\[facilityId\],\s*references:\s*\[id\],\s*onDelete:\s*SetNull\)/
  );

  assert.match(
    schema,
    /endsAt\s+DateTime\?/
  );

  assert.match(
    schema,
    /@@index\(\[academyId,\s*facilityId,\s*startsAt\]\)/
  );
});

test("facility availability is academy scoped and blocks unavailable facilities", () => {
  const helper =
    readSource(
      "lib/facility-scheduling.ts"
    );

  const facilityBlock =
    sourceBetween(
      helper,
      "prisma.facility.findFirst",
      "prisma.trainingSession.findFirst"
    );

  assert.match(
    facilityBlock,
    /id:\s*facilityId/
  );

  assert.match(
    facilityBlock,
    /academyId/
  );

  assert.match(
    helper,
    /facility\.status\s*===\s*"MAINTENANCE"/
  );

  assert.match(
    helper,
    /facility\.status\s*!==\s*"ACTIVE"/
  );
});

test("training conflicts use half-open overlap and cancelled sessions do not block", () => {
  const helper =
    readSource(
      "lib/facility-scheduling.ts"
    );

  const trainingBlock =
    sourceBetween(
      helper,
      "prisma.trainingSession.findFirst",
      "prisma.match.findFirst"
    );

  assert.match(
    trainingBlock,
    /academyId/
  );

  assert.match(
    trainingBlock,
    /facilityId/
  );

  assert.match(
    trainingBlock,
    /status:\s*\{\s*not:\s*"CANCELLED"/
  );

  assert.match(
    trainingBlock,
    /startsAt:\s*\{\s*lt:\s*endsAt/
  );

  assert.match(
    trainingBlock,
    /endsAt:\s*\{\s*gt:\s*startsAt/
  );

  assert.match(
    trainingBlock,
    /excludeTrainingSessionId/
  );

  assert.match(
    trainingBlock,
    /not:\s*excludeTrainingSessionId/
  );
});

test("match conflicts use half-open overlap and cancelled or postponed matches do not block", () => {
  const helper =
    readSource(
      "lib/facility-scheduling.ts"
    );

  const matchBlock =
    sourceBetween(
      helper,
      "prisma.match.findFirst"
    );

  assert.match(
    matchBlock,
    /academyId/
  );

  assert.match(
    matchBlock,
    /facilityId/
  );

  assert.match(
    matchBlock,
    /status:\s*\{\s*notIn:\s*\[\s*"CANCELLED",\s*"POSTPONED",?\s*\]/
  );

  assert.match(
    matchBlock,
    /startsAt:\s*\{\s*lt:\s*endsAt/
  );

  assert.match(
    matchBlock,
    /endsAt:\s*\{\s*gt:\s*startsAt/
  );

  assert.match(
    matchBlock,
    /excludeMatchId/
  );

  assert.match(
    matchBlock,
    /not:\s*excludeMatchId/
  );
});

test("training create and update enforce facility availability and exclusive location", () => {
  const collection =
    readSource(
      "app/api/training-sessions/route.ts"
    );

  const item =
    readSource(
      "app/api/training-sessions/[sessionId]/route.ts"
    );

  const postBlock =
    getHandlerBlock(
      collection,
      "POST"
    );

  const patchBlock =
    getHandlerBlock(
      item,
      "PATCH"
    );

  for (
    const block of [
      postBlock,
      patchBlock,
    ]
  ) {
    assert.match(
      block,
      /facilityId/
    );

    assert.match(
      block,
      /facilityId\s*&&\s*!endsAt/
    );

    assert.match(
      block,
      /checkFacilityAvailability/
    );

    assert.match(
      block,
      /location\s*=\s*facilityId\s*\?\s*null/
    );
  }

  assert.match(
    patchBlock,
    /excludeTrainingSessionId:\s*existing\.id/
  );
});

test("match create and update enforce end time, conflicts and self exclusion", () => {
  const collection =
    readSource(
      "app/api/matches/route.ts"
    );

  const item =
    readSource(
      "app/api/matches/[matchId]/route.ts"
    );

  const postBlock =
    getHandlerBlock(
      collection,
      "POST"
    );

  const patchBlock =
    getHandlerBlock(
      item,
      "PATCH"
    );

  assert.match(
    postBlock,
    /facilityId\s*&&\s*!endsAtDate/
  );

  assert.match(
    postBlock,
    /checkFacilityAvailability/
  );

  assert.match(
    postBlock,
    /startsAt:\s*startsAtDate/
  );

  assert.match(
    postBlock,
    /endsAt:\s*endsAtDate/
  );

  assert.match(
    postBlock,
    /const location = facilityId/
  );

  assert.match(
    patchBlock,
    /facilityId\s*&&\s*!endsAt/
  );

  assert.match(
    patchBlock,
    /checkFacilityAvailability/
  );

  assert.match(
    patchBlock,
    /excludeMatchId:\s*existing\.id/
  );

  assert.match(
    patchBlock,
    /location:\s*facilityId\s*\?\s*null/
  );
});

test("calendar exposes scheduled facility and real match end time", () => {
  const api =
    readSource(
      "app/api/calendar/route.ts"
    );

  const client =
    readSource(
      "components/kalendari/calendar-client.tsx"
    );

  assert.match(
    api,
    /facility:\s*session\.facility/
  );

  assert.match(
    api,
    /endsAt:\s*match\.endsAt/
  );

  assert.match(
    api,
    /facility:\s*match\.facility/
  );

  assert.match(
    client,
    /event\.facility\?\.name/
  );

  assert.match(
    client,
    /event\.endsAt/
  );
});

test("training and match forms expose facility scheduling controls", () => {
  const trainings =
    readSource(
      "components/seancat/seancat-client.tsx"
    );

  const matches =
    readSource(
      "components/ndeshjet/ndeshjet-client.tsx"
    );

  for (
    const client of [
      trainings,
      matches,
    ]
  ) {
    assert.match(
      client,
      /Ambienti i akademisë/
    );

    assert.match(
      client,
      /facilityId/
    );

    assert.match(
      client,
      /facility\.status\s*!==\s*"ACTIVE"/
    );

    assert.match(
      client,
      /facility\?\.name/
    );
  }

  assert.match(
    matches,
    /required=\{Boolean\(facilityId\)\}/
  );
});