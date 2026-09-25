import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const migration = fs.readFileSync(
  "prisma/migrations/20260923160000_add_pro_portal_plan/migration.sql",
  "utf8",
);

test("historical PRO_PORTAL migration seeded the original active plan price", () => {
  assert.match(migration, /'PRO_PORTAL'/);

  assert.match(migration, /'Pro \+ Athlete Portal'/);

  assert.match(migration, /25000\.00/);

  assert.match(migration, /'ALL'/);

  assert.match(migration, /true,\s*3/);
});

test("PRO_PORTAL preserves the PRO academy limits", () => {
  assert.match(migration, /300,\s*25,\s*50,\s*15,\s*50/);
});

test("PRO_PORTAL includes fifty athlete accounts", () => {
  assert.match(migration, /"maxAthleteAccounts"[\s\S]*50/);
});

test("PRO_PORTAL includes all professional features and ATHLETE_PORTAL", () => {
  const requiredFeatures = [
    "MEDICAL",
    "PHYSICAL_PROFILE",
    "PERFORMANCE",
    "SCOUTING",
    "TACTICS",
    "KNOWLEDGE_BASE",
    "FACILITY_SCHEDULING",
    "ADVANCED_REPORTS",
    "ATHLETE_PORTAL",
  ];

  for (const feature of requiredFeatures) {
    assert.match(migration, new RegExp(`'${feature}'`));
  }
});

