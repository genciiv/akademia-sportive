import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

test("team detail API exposes the professional team overview", () => {
  const source = fs.readFileSync(
    "app/api/teams/[teamId]/route.ts",
    "utf8"
  );

  assert.match(
    source,
    /export async function GET\(/
  );

  assert.match(
    source,
    /PERMISSIONS\.TEAMS_VIEW/
  );

  assert.match(
    source,
    /canAccessTeam/
  );

  assert.match(
    source,
    /players:\s*\{/
  );

  assert.match(
    source,
    /coaches:\s*\{/
  );

  assert.match(
    source,
    /matches:\s*true/
  );

  assert.match(
    source,
    /trainingSessions:\s*true/
  );
});

test("teams UI links every team to its professional profile", () => {
  const source = fs.readFileSync(
    "components/ekipet/ekipet-client.tsx",
    "utf8"
  );

  assert.match(
    source,
    /\/ekipet\/\$\{team\.id\}/
  );

  assert.match(
    source,
    /Hap profilin e ekipit/
  );
});

test("professional team page exposes players coaches and team statistics", () => {
  const source = fs.readFileSync(
    "components/ekipet/team-detail-client.tsx",
    "utf8"
  );

  assert.match(
    source,
    /Lojtarë aktivë/
  );

  assert.match(
    source,
    /Stafi teknik/
  );

  assert.match(
    source,
    /Ndeshje/
  );

  assert.match(
    source,
    /Stërvitje/
  );
});
test("team profile exposes upcoming match and training actions", () => {
  const api = fs.readFileSync(
    "app/api/teams/[teamId]/route.ts",
    "utf8"
  );

  const ui = fs.readFileSync(
    "components/ekipet/team-detail-client.tsx",
    "utf8"
  );

  assert.match(api, /nextMatch/);
  assert.match(api, /nextTrainingSession/);
  assert.match(ui, /Ndeshja e ardhshme/);
  assert.match(ui, /Stërvitja e ardhshme/);
  assert.match(ui, /ndeshjet\?action=create&teamId=/);
  assert.match(ui, /seancat\?action=create&teamId=/);
});

test("match and training create deep links preserve the selected team", () => {
  const matches = fs.readFileSync(
    "components/ndeshjet/ndeshjet-client.tsx",
    "utf8"
  );

  const sessions = fs.readFileSync(
    "components/seancat/seancat-client.tsx",
    "utf8"
  );

  assert.match(matches, /URLSearchParams/);
  assert.match(
    matches,
    /setTeamId\(requestedTeamId\)/
  );

  assert.match(sessions, /URLSearchParams/);
  assert.match(
    sessions,
    /setTeamId\(requestedTeamId\)/
  );
});