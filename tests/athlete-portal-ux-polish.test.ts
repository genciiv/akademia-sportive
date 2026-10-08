import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const performance = fs.readFileSync(
  "app/sportist/(portal)/performanca/page.tsx",
  "utf8"
);

const dashboard = fs.readFileSync(
  "app/sportist/(portal)/dashboard/page.tsx",
  "utf8"
);

const notifications = fs.readFileSync(
  "components/sportist/athlete-notification-list.tsx",
  "utf8"
);

test("athlete performance rating chart exposes an accessible description", () => {
  assert.match(
    performance,
    /aria-label=\{`Vlerësimi/
  );

  assert.match(
    performance,
    /aria-hidden="true"/
  );
});

test("athlete technical efficiency metrics expose accessible text", () => {
  assert.match(
    performance,
    /role="img"/
  );

  assert.match(
    performance,
    /metric\.label/
  );

  assert.match(
    performance,
    /pa të dhëna/
  );
});

test("athlete performance interactive links expose visible keyboard focus", () => {
  assert.match(
    performance,
    /focus-visible:ring-violet-500/
  );

  assert.match(
    performance,
    /focus-visible:ring-blue-500/
  );
});

test("athlete dashboard calls to action expose visible keyboard focus", () => {
  assert.match(
    dashboard,
    /focus-visible:ring-2/
  );
});

test("athlete notification actions expose visible keyboard focus", () => {
  assert.match(
    notifications,
    /focus-visible:ring-2/
  );
});