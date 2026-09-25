import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(join(process.cwd(), "app/page.tsx"), "utf8");

test("public homepage exposes the current three pricing cards", () => {
  assert.match(source, /Starter/);
  assert.match(source, /Pro \+ Athlete Portal/);
  assert.match(source, /10,000/);
  assert.match(source, /20,000/);
  assert.match(source, /15,000/);
});

test("public homepage includes athlete portal value", () => {
  assert.match(source, /Deri në 50 llogari sportistësh/);

  assert.match(source, /Dashboard personal për sportistin/);

  assert.match(source, /Historia dhe statistikat e prezencës/);
});

test("public homepage keeps the seven day pro trial message", () => {
  assert.match(source, /7 ditë PRO falas/);
});
