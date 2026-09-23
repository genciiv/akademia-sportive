import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const page = fs.readFileSync("app/sportist/(portal)/prezenca/page.tsx", "utf8");

const navigation = fs.readFileSync("components/athlete-portal-nav.tsx", "utf8");

test("athlete attendance page requires centralized athlete access", () => {
  assert.match(page, /requireAthleteAccess/);

  assert.match(page, /\/hyrje\?next=\/sportist\/prezenca/);
});

test("athlete attendance history is scoped to the linked player", () => {
  assert.match(page, /prisma\.trainingAttendance\.findMany/);

  assert.match(page, /playerId:\s*access\.playerId/);
});

test("athlete attendance history is scoped to the linked academy", () => {
  assert.match(page, /trainingSession:\s*\{\s*academyId:\s*access\.academyId/);
});

test("athlete attendance history is ordered newest first", () => {
  assert.match(page, /trainingSession:\s*\{\s*startsAt:\s*"desc"/);
});

test("athlete attendance exposes only safe session context", () => {
  assert.match(page, /status:\s*true/);

  assert.match(page, /title:\s*true/);

  assert.match(page, /startsAt:\s*true/);

  assert.match(page, /name:\s*true/);

  assert.doesNotMatch(
    page,
    /note:\s*true|privateNotes|guardianPhone|guardianEmail|tokenHash/,
  );
});

test("athlete attendance provides statistics for every attendance status", () => {
  assert.match(page, /case "PRESENT"/);

  assert.match(page, /case "ABSENT"/);

  assert.match(page, /case "LATE"/);

  assert.match(page, /case "EXCUSED"/);
});

test("athlete attendance statistics derive from the athlete history", () => {
  assert.match(page, /attendances\.reduce/);

  assert.match(page, /const total = attendances\.length/);

  assert.match(page, /Math\.round/);
});

test("athlete portal navigation exposes attendance", () => {
  assert.match(navigation, /href:\s*"\/sportist\/prezenca"/);

  assert.match(navigation, /label:\s*"Prezenca"/);

  assert.match(navigation, /ClipboardCheck/);
});
