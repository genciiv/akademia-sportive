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

test("player physical measurements preserve academy and team scope", () => {
  const collection =
    readSource(
      "app/api/players/[playerId]/physical-measurements/route.ts"
    );

  const item =
    readSource(
      "app/api/players/[playerId]/physical-measurements/[measurementId]/route.ts"
    );

  assert.match(
    collection,
    /academyId/
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
    item,
    /academyId:\s*access\.academyId/
  );

  assert.match(
    item,
    /canAccessPlayer/
  );

  assert.match(
    item,
    /playerId:\s*player\.id/
  );
});

test("physical profile UI respects player permissions", () => {
  const page =
    readSource(
      "app/anetaret/page.tsx"
    );

  const playersClient =
    readSource(
      "components/sportistet/sportistet-client.tsx"
    );

  const physicalProfile =
    readSource(
      "components/sportistet/player-physical-profile.tsx"
    );

  assert.match(
    page,
    /PERMISSIONS\.PLAYERS_CREATE/
  );

  assert.match(
    page,
    /PERMISSIONS\.PLAYERS_UPDATE/
  );

  assert.match(
    page,
    /PERMISSIONS\.PLAYERS_DELETE/
  );

  assert.match(
    playersClient,
    /canCreatePlayers\s*&&/
  );

  assert.match(
    playersClient,
    /canUpdatePlayers\s*&&/
  );

  assert.match(
    playersClient,
    /canDeletePlayers\s*&&/
  );

  assert.match(
    playersClient,
    /Profili fizik/
  );

  assert.match(
    physicalProfile,
    /canUpdatePlayers\s*&&/
  );
});

test("BMI is calculated instead of stored", () => {
  const schema =
    readSource(
      "prisma/schema.prisma"
    );

  const physicalProfile =
    readSource(
      "components/sportistet/player-physical-profile.tsx"
    );

  assert.doesNotMatch(
    schema,
    /\bbmi\b/i
  );

  assert.match(
    physicalProfile,
    /function calculateBmi/
  );

  assert.match(
    physicalProfile,
    /weightKg\s*\/\s*\(heightMeters\s*\*\s*heightMeters\)/
  );
});
