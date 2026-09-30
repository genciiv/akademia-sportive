import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const layout = fs.readFileSync("app/sportist/(portal)/layout.tsx", "utf8");

const navigation = fs.readFileSync("components/athlete-portal-nav.tsx", "utf8");

test("athlete portal layout keeps centralized athlete access", () => {
  assert.match(layout, /requireAthleteAccess/);

  assert.match(layout, /AthletePortalNav/);
});

test("athlete portal navigation exposes dashboard and schedule routes", () => {
  assert.match(navigation, /\/sportist\/dashboard/);

  assert.match(navigation, /\/sportist\/orari/);
});

test("athlete portal navigation highlights the current route", () => {
  assert.match(navigation, /usePathname/);

  assert.match(navigation, /pathname\s*===\s*item\.href/);

  assert.match(navigation, /pathname\.startsWith/);
});

test("athlete portal logout uses the auth client and returns to login", () => {
  assert.match(navigation, /authClient\.signOut/);

  assert.match(navigation, /router\.push\("\/hyrje"\)/);

  assert.match(navigation, /router\.refresh/);
});

test("athlete portal navigation receives only athlete display context", () => {
  assert.match(navigation, /athleteName:\s*string/);

  assert.match(navigation, /academyName:\s*string/);

  assert.doesNotMatch(
    navigation,
    /privateNotes|guardianPhone|guardianEmail|tokenHash/,
  );
});

test("athlete portal navigation provides a responsive mobile menu", () => {
  assert.match(navigation, /const \[mobileOpen,\s*setMobileOpen\]/);
  assert.match(navigation, /lg:hidden/);
  assert.match(navigation, /hidden[\s\S]*lg:block/);
  assert.match(navigation, /aria-expanded=\{mobileOpen\}/);
  assert.match(navigation, /athlete-mobile-navigation/);
  assert.match(navigation, /<Menu/);
  assert.match(navigation, /<X/);
});

test("athlete mobile navigation exposes all athlete routes and display context", () => {
  assert.match(navigation, /label:\s*"Përmbledhje"/);
  assert.match(navigation, /label:\s*"Orari"/);
  assert.match(navigation, /label:\s*"Ndeshjet"/);
  assert.match(navigation, /label:\s*"Prezenca"/);
  assert.match(navigation, /\{athleteName\}/);
  assert.match(navigation, /\{academyName\}/);
  assert.match(navigation, /Dil nga llogaria/);
});

test("athlete mobile navigation closes after route selection", () => {
  assert.match(navigation, /navigationLinks\(true\)/);
  assert.match(navigation, /setMobileOpen\(false\)/);
});
