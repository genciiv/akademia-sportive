import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("coach creation preserves an existing staff membership link", () => {
  const source = fs.readFileSync(
    "app/api/coaches/route.ts",
    "utf8"
  );

  assert.match(
    source,
    /staffId:\s*staff\.id,[\s\S]*?membershipId:\s*staff\.membershipId,/
  );
});
