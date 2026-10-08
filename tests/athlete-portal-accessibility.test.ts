import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const shell = fs.readFileSync(
  "components/athlete-portal-shell.tsx",
  "utf8"
);

const navigation = fs.readFileSync(
  "components/athlete-portal-nav.tsx",
  "utf8"
);

const topbar = fs.readFileSync(
  "components/athlete-portal-topbar.tsx",
  "utf8"
);

test("athlete mobile navigation exposes dialog semantics and escape support", () => {
  assert.match(shell, /role="dialog"/);
  assert.match(shell, /aria-modal="true"/);
  assert.match(shell, /event\.key === "Escape"/);
  assert.match(shell, /aria-label="Mbyll menunë"/);
});

test("athlete navigation exposes active page semantics", () => {
  assert.match(navigation, /aria-current/);
  assert.match(navigation, /"page"/);
  assert.match(
    navigation,
    /aria-label="Navigimi i portalit të sportistit"/
  );
});

test("athlete navigation exposes focus states", () => {
  assert.match(
    navigation,
    /focus-visible:ring-2/
  );
});

test("athlete notification dropdown exposes accessible relationships", () => {
  assert.match(
    topbar,
    /aria-controls="athlete-notifications-panel"/
  );

  assert.match(
    topbar,
    /id="athlete-notifications-panel"/
  );

  assert.match(
    topbar,
    /aria-haspopup="dialog"/
  );
});

test("athlete profile menu exposes menu semantics", () => {
  assert.match(
    topbar,
    /aria-controls="athlete-profile-menu"/
  );

  assert.match(
    topbar,
    /id="athlete-profile-menu"/
  );

  assert.match(
    topbar,
    /role="menu"/
  );

  assert.match(
    topbar,
    /role="menuitem"/
  );
});

test("athlete topbar dropdowns close with escape", () => {
  assert.match(
    topbar,
    /event\.key !== "Escape"/
  );

  assert.match(
    topbar,
    /setMenuOpen\(false\)/
  );

  assert.match(
    topbar,
    /setNotificationOpen\(false\)/
  );
});

test("athlete topbar exposes keyboard focus states", () => {
  assert.match(
    topbar,
    /focus-visible:ring-2/
  );
});