import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(
  relativePath: string
) {
  return fs.readFileSync(
    path.join(
      process.cwd(),
      ...relativePath.split("/")
    ),
    "utf8"
  );
}

const portalPages = [
  "app/sportist/(portal)/dashboard/page.tsx",
  "app/sportist/(portal)/ndeshjet/page.tsx",
  "app/sportist/(portal)/ndeshjet/[matchId]/page.tsx",
  "app/sportist/(portal)/orari/page.tsx",
  "app/sportist/(portal)/prezenca/page.tsx",
  "app/sportist/(portal)/performanca/page.tsx",
  "app/sportist/(portal)/profili-fizik/page.tsx",
  "app/sportist/(portal)/taktikat/page.tsx",
  "app/sportist/(portal)/ushtrimet/page.tsx",
  "app/sportist/(portal)/njoftimet/page.tsx",
  "app/sportist/(portal)/baza-e-njohurive/page.tsx",
  "app/sportist/(portal)/baza-e-njohurive/[articleId]/page.tsx",
  "app/sportist/(portal)/llogaria/page.tsx",
];

test("every protected athlete portal page uses centralized athlete access", () => {
  for (const page of portalPages) {
    const source =
      readSource(page);

    assert.match(
      source,
      /requireAthleteAccess/,
      `${page} must use requireAthleteAccess`
    );
  }
});

test("athlete match detail prevents cross academy and cross team access", () => {
  const source =
    readSource(
      "app/sportist/(portal)/ndeshjet/[matchId]/page.tsx"
    );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /teamId:\s*\{\s*in:\s*activeTeamIds/
  );

  assert.match(
    source,
    /playerId:\s*access\.playerId/
  );
});

test("athlete knowledge article prevents cross academy and unpublished access", () => {
  const source =
    readSource(
      "app/sportist/(portal)/baza-e-njohurive/[articleId]/page.tsx"
    );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /status:\s*"PUBLISHED"/
  );

  assert.match(
    source,
    /audience:\s*\{\s*in:/
  );

  assert.match(
    source,
    /"ALL"/
  );

  assert.match(
    source,
    /"PLAYERS"/
  );
});

test("athlete tactics are academy scoped visible and team targeted", () => {
  const source =
    readSource(
      "app/sportist/(portal)/taktikat/page.tsx"
    );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /visibleToPlayers:\s*true/
  );

  assert.match(
    source,
    /isActive:\s*true/
  );

  assert.match(
    source,
    /targetTeams/
  );

  assert.match(
    source,
    /activeTeamIds/
  );
});

test("athlete performance stays scoped to the linked player", () => {
  const source =
    readSource(
      "app/sportist/(portal)/performanca/page.tsx"
    );

  assert.match(
    source,
    /playerId:\s*access\.playerId/
  );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /activeTeamIds/
  );
});

test("athlete notifications enforce academy and audience scope", () => {
  const page =
    readSource(
      "app/sportist/(portal)/njoftimet/page.tsx"
    );

  const api =
    readSource(
      "app/api/athlete/notifications/route.ts"
    );

  const readApi =
    readSource(
      "app/api/athlete/notifications/[notificationId]/read/route.ts"
    );

  for (
    const source of [
      page,
      api,
      readApi,
    ]
  ) {
    assert.match(
      source,
      /academyId:\s*access\.academyId/
    );

    assert.match(
      source,
      /audience/
    );

    assert.match(
      source,
      /activeTeamIds/
    );
  }
});

test("athlete match detail never exposes coach private notes", () => {
  const source =
    readSource(
      "app/sportist/(portal)/ndeshjet/[matchId]/page.tsx"
    );

  assert.doesNotMatch(
    source,
    /privateNotes|coachNotes|internalNotes/i
  );
});