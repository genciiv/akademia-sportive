import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync(
  "app/sportist/(portal)/layout.tsx",
  "utf8"
);

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

test("athlete portal layout keeps centralized athlete access", () => {
  assert.match(
    layout,
    /requireAthleteAccess/
  );

  assert.match(
    layout,
    /AthletePortalShell/
  );
});

test("athlete portal shell owns navigation and topbar", () => {
  assert.match(
    shell,
    /AthletePortalNav/
  );

  assert.match(
    shell,
    /AthletePortalTopbar/
  );
});

test("athlete portal navigation exposes core athlete routes", () => {
  assert.match(
    navigation,
    /\/sportist\/dashboard/
  );

  assert.match(
    navigation,
    /\/sportist\/orari/
  );

  assert.match(
    navigation,
    /\/sportist\/ndeshjet/
  );

  assert.match(
    navigation,
    /\/sportist\/prezenca/
  );

  assert.match(
    navigation,
    /\/sportist\/performanca/
  );

  assert.match(
    navigation,
    /\/sportist\/profili-fizik/
  );

  assert.match(
    navigation,
    /\/sportist\/ushtrimet/
  );

  assert.match(
    navigation,
    /\/sportist\/taktikat/
  );

  assert.match(
    navigation,
    /\/sportist\/baza-e-njohurive/
  );

  assert.match(
    navigation,
    /\/sportist\/njoftimet/
  );

  assert.match(
    navigation,
    /\/sportist\/llogaria/
  );
});

test("athlete portal navigation highlights the current route", () => {
  assert.match(
    navigation,
    /usePathname/
  );

  assert.match(
    navigation,
    /pathname\s*===/
  );

  assert.match(
    navigation,
    /pathname\.startsWith/
  );
});

test("athlete portal navigation receives only display context", () => {
  assert.match(
    navigation,
    /athleteName:\s*string/
  );

  assert.match(
    navigation,
    /academyName:\s*string/
  );

  assert.doesNotMatch(
    navigation,
    /privateNotes|guardianPhone|guardianEmail|tokenHash/
  );
});

test("athlete portal navigation supports mobile closing", () => {
  assert.match(
    navigation,
    /mobile\?:\s*boolean/
  );

  assert.match(
    navigation,
    /onClose\?:/
  );

  assert.match(
    navigation,
    /onClick=\{\s*onClose\s*\}/
  );

  assert.match(
    navigation,
    /aria-label="Mbyll menunë"/
  );
});

test("athlete portal shell manages responsive mobile navigation", () => {
  assert.match(
    shell,
    /mobileOpen/
  );

  assert.match(
    shell,
    /setMobileOpen/
  );

  assert.match(
    shell,
    /AthletePortalNav/
  );

  assert.match(
    shell,
    /mobile/
  );
});

test("athlete portal topbar owns logout and account actions", () => {
  assert.match(
    topbar,
    /authClient\.signOut/
  );

  assert.match(
    topbar,
    /\/sportist\/llogaria/
  );

  assert.match(
    topbar,
    /\/sportist\/njoftimet/
  );
});