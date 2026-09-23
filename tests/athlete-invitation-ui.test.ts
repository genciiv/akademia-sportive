import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const manager = fs.readFileSync(
  "components/sportistet/athlete-invitation-manager.tsx",
  "utf8",
);

const playersClient = fs.readFileSync(
  "components/sportistet/sportistet-client.tsx",
  "utf8",
);

test("players UI exposes athlete portal management only to player updaters", () => {
  assert.match(
    playersClient,
    /canUpdatePlayers[\s\S]*setPlayerPortal\(player\)/,
  );

  assert.match(playersClient, /AthleteInvitationManager/);
});

test("athlete invitation manager lists academy scoped invitations through the protected API", () => {
  assert.match(manager, /fetch\(\s*"\/api\/athlete-invitations"/);
});

test("athlete invitation manager creates invitations through the player scoped endpoint", () => {
  assert.match(manager, /`\/api\/players\/\$\{player\.id\}\/athlete-invite`/);

  assert.match(manager, /method:\s*"POST"/);
});

test("athlete invitation manager supports resend and revoke", () => {
  assert.match(
    manager,
    /`\/api\/athlete-invitations\/\$\{latestInvitation\.id\}\/resend`/,
  );

  assert.match(manager, /method:\s*"DELETE"/);
});

test("athlete invitation manager requires player email before creating an invitation", () => {
  assert.match(manager, /!player\.email/);

  assert.match(manager, /Shto fillimisht email-in e sportistit/);
});

test("athlete invitation manager exposes the one-time delivery invite path for manual testing", () => {
  assert.match(manager, /data\.invitation\?\.invitePath/);

  assert.match(manager, /navigator\.clipboard\.writeText/);

  assert.match(manager, /target="_blank"/);
});

test("athlete invitation manager does not persist or request token material", () => {
  assert.doesNotMatch(manager, /tokenHash|invitationToken/);

  assert.doesNotMatch(manager, /localStorage|sessionStorage/);
});

test("athlete invitation manager surfaces email delivery fallback", () => {
  assert.match(manager, /not_configured/);

  assert.match(manager, /provider_error/);

  assert.match(manager, /network_error/);

  assert.match(manager, /Përdor linkun manual/);
});

test("accepted athlete invitation is presented as an active portal", () => {
  assert.match(manager, /case "ACCEPTED"/);

  assert.match(manager, /Portali është aktiv/);
});
