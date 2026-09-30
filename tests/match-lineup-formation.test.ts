import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("match lineup foundation is represented in Prisma", () => {
  const schema = fs.readFileSync(
    "prisma/schema.prisma",
    "utf8"
  );

  assert.match(
    schema,
    /lineupFormation\s+String\?/
  );

  assert.match(
    schema,
    /lineupPublishedAt\s+DateTime\?/
  );

  assert.match(
    schema,
    /lineupSlot\s+String\?/
  );

  assert.match(
    schema,
    /@@index\(\[matchId,\s*lineupSlot\]\)/
  );
});

test("lineup migration adds formation publication and slot storage", () => {
  const migration = fs.readFileSync(
    "prisma/migrations/20260930083000_add_match_lineup_formation/migration.sql",
    "utf8"
  );

  assert.match(migration, /"lineupFormation"/);
  assert.match(migration, /"lineupPublishedAt"/);
  assert.match(migration, /"lineupSlot"/);
});

test("lineup API preserves match scope and squad permission", () => {
  const route = fs.readFileSync(
    "app/api/matches/[matchId]/lineup/route.ts",
    "utf8"
  );

  assert.match(
    route,
    /PERMISSIONS\.MATCHES_VIEW/
  );

  assert.match(
    route,
    /PERMISSIONS\.MATCH_SQUAD_MANAGE/
  );

  assert.match(
    route,
    /canAccessMatch/
  );
});

test("lineup API supports professional football formations", () => {
  const route = fs.readFileSync(
    "app/api/matches/[matchId]/lineup/route.ts",
    "utf8"
  );

  for (const formation of [
    "4-3-3",
    "4-4-2",
    "4-2-3-1",
    "3-5-2",
    "5-3-2",
    "4-5-1",
    "3-4-3",
  ]) {
    assert.match(
      route,
      new RegExp(
        formation.replaceAll("-", "\\-")
      )
    );
  }
});

test("lineup save keeps MatchPlayer as the squad source of truth", () => {
  const route = fs.readFileSync(
    "app/api/matches/[matchId]/lineup/route.ts",
    "utf8"
  );

  assert.match(
    route,
    /matchPlayer\.upsert/
  );

  assert.match(
    route,
    /role:\s*"STARTER"/
  );

  assert.match(
    route,
    /role:\s*"SUBSTITUTE"/
  );

  assert.match(
    route,
    /lineupSlot/
  );
});

test("lineup publication requires a complete formation", () => {
  const route = fs.readFileSync(
    "app/api/matches/[matchId]/lineup/route.ts",
    "utf8"
  );

  assert.match(
    route,
    /action === "PUBLISH"/
  );

  assert.match(
    route,
    /starters\.length === expectedSlots\.length/
  );

  assert.match(
    route,
    /lineupPublishedAt: publishedAt/
  );

  assert.match(
    route,
    /lineupPublishedAt: null/
  );
});
test("formation board renders the football pitch and lineup controls", () => {
  const board = fs.readFileSync(
    "components/ndeshjet/formation-board.tsx",
    "utf8"
  );

  assert.match(
    board,
    /FORMATION_LAYOUTS/
  );

  assert.match(
    board,
    /"4-3-3"/
  );

  assert.match(
    board,
    /"4-2-3-1"/
  );

  assert.match(
    board,
    /Ruaj draftin/
  );

  assert.match(
    board,
    /Publiko formacionin/
  );

  assert.match(
    board,
    /Zgjidh sportistin/
  );

  assert.match(
    board,
    /11 titullarë/
  );
});

test("match details integrate FormationBoard with the existing squad", () => {
  const matches = fs.readFileSync(
    "components/ndeshjet/ndeshjet-client.tsx",
    "utf8"
  );

  assert.match(
    matches,
    /FormationBoard/
  );

  assert.match(
    matches,
    /players=\{sportistetEGrumbullimit\}/
  );

  assert.match(
    matches,
    /merrGrumbullimin/
  );

  assert.match(
    matches,
    /lineupSlot:\s*string \| null/
  );
});
test("squad changes invalidate published formation", () => {
  const route = fs.readFileSync(
    "app/api/matches/[matchId]/players/route.ts",
    "utf8"
  );

  assert.match(
    route,
    /lineupPublishedAt:\s*null/
  );

  assert.match(
    route,
    /lineupSlot:\s*role === "SUBSTITUTE"/
  );

  assert.match(
    route,
    /existing\.role === "STARTER"/
  );

  assert.match(
    route,
    /existing\.lineupSlot/
  );
});

test("formation board reloads when the squad changes", () => {
  const board = fs.readFileSync(
    "components/ndeshjet/formation-board.tsx",
    "utf8"
  );

  assert.match(
    board,
    /\[matchId,\s*players\]/
  );
});
test("formation board immediately removes players that leave the starting lineup", () => {
  const board = fs.readFileSync(
    "components/ndeshjet/formation-board.tsx",
    "utf8"
  );

  assert.match(
    board,
    /sync assignments with squad roles/
  );

  assert.match(
    board,
    /player\.matchPlayer\?\.role ===\s*"STARTER"/
  );

  assert.match(
    board,
    /starterIds\.has/
  );
});

test("bench contains substitutes and trash means remove from call-up", () => {
  const board = fs.readFileSync(
    "components/ndeshjet/formation-board.tsx",
    "utf8"
  );

  const matches = fs.readFileSync(
    "components/ndeshjet/ndeshjet-client.tsx",
    "utf8"
  );

  assert.match(
    board,
    /player\.selected/
  );

  assert.match(
    board,
    /Hiq nga fusha - në stol/
  );

  assert.match(
    matches,
    /nuk kalon në stol/
  );

  assert.match(
    matches,
    /Hiq plotësisht nga grumbullimi/
  );
});