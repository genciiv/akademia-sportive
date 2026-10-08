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

test("athlete notification read mutation requires centralized athlete access", () => {
  const source =
    readSource(
      "app/api/athlete/notifications/[notificationId]/read/route.ts"
    );

  assert.match(
    source,
    /requireAthleteAccess/
  );

  assert.match(
    source,
    /id:\s*notificationId/
  );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /status:\s*"ACTIVE"/
  );

  assert.match(
    source,
    /audience/
  );

  assert.match(
    source,
    /activeTeamIds/
  );

  assert.match(
    source,
    /notificationId_userId/
  );

  assert.match(
    source,
    /userId:\s*access\.userId/
  );
});

test("athlete bulk notification read mutation only touches visible notifications", () => {
  const source =
    readSource(
      "app/api/athlete/notifications/route.ts"
    );

  assert.match(
    source,
    /export async function PATCH/
  );

  assert.match(
    source,
    /requireAthleteAccess/
  );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /status:\s*"ACTIVE"/
  );

  assert.match(
    source,
    /audience/
  );

  assert.match(
    source,
    /activeTeamIds/
  );

  assert.match(
    source,
    /createMany/
  );

  assert.match(
    source,
    /userId:\s*access\.userId/
  );

  assert.match(
    source,
    /skipDuplicates:\s*true/
  );
});

test("athlete session endpoint never exposes membership details", () => {
  const source =
    readSource(
      "app/api/athlete/session/route.ts"
    );

  assert.match(
    source,
    /requireAthleteAccess/
  );

  assert.match(
    source,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    source,
    /userId:\s*access\.userId/
  );

  assert.match(
    source,
    /athlete:\s*true/
  );

  assert.match(
    source,
    /athlete:\s*false/
  );

  assert.doesNotMatch(
    source,
    /role:\s*true|permissions:\s*true|email:\s*true/
  );
});

test("athlete private API routes do not use academy staff permission guards", () => {
  const routes = [
    "app/api/athlete/notifications/route.ts",
    "app/api/athlete/notifications/[notificationId]/read/route.ts",
    "app/api/athlete/session/route.ts",
  ];

  for (const route of routes) {
    const source =
      readSource(route);

    assert.doesNotMatch(
      source,
      /requireAcademyPermission|getCurrentAcademyAccess/
    );
  }
});