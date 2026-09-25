import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

function read(path: string) {
  return readFileSync(join(process.cwd(), path), "utf8");
}

const home = read("app/page.tsx");
const applyPage = read("app/apliko/page.tsx");
const publicApi = read("app/api/academy-applications/route.ts");
const adminPage = read("app/platform-admin/aplikimet/page.tsx");
const adminClient = read(
  "app/platform-admin/aplikimet/applications-client.tsx",
);
const schema = read("prisma/schema.prisma");

test("pricing links preserve selected plan in the application URL", () => {
  assert.match(home, /\/apliko\?plan=STARTER/);
  assert.match(home, /\/apliko\?plan=PRO/);
  assert.match(home, /\/apliko\?plan=PRO_PORTAL/);
  assert.match(home, /\/apliko\?plan=UNLIMITED/);
});

test("application page sends the validated selected plan", () => {
  assert.match(applyPage, /requestedPlanCode:\s*selectedPlanCode/);

  assert.match(applyPage, /Object\.prototype\.hasOwnProperty\.call/);
});

test("public application API only accepts standard plan codes", () => {
  assert.match(publicApi, /STARTER/);
  assert.match(publicApi, /PRO_PORTAL/);
  assert.match(publicApi, /UNLIMITED/);
  assert.match(publicApi, /requestedPlanCode/);
});

test("academy application persists requested plan interest", () => {
  assert.match(schema, /requestedPlanCode\s+String\?/);
});

test("platform admin exposes the requested plan", () => {
  assert.match(
    adminPage,
    /requestedPlanCode:\s*application\.requestedPlanCode/,
  );

  assert.match(adminClient, /Paketa e interesit/);

  assert.match(adminClient, /Pro \+ Athlete Portal/);
  assert.match(adminClient, /Unlimited/);
});
